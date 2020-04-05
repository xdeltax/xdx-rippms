import io from "socket.io-client";
import {unixtime} from "tools/datetime";

//============================================================================//
import debuglog from "debug/consolelog"; const clog = debuglog("SocketIO");
//============================================================================//

class SocketIO {
  _socket = null;
  _isConnected = false;
  onSocketConnect; // used in AppLandingPage
  onSocketDisconnect;
  onSocketForceLogout; // used in AppLandingPage
  onSocketErrorMessageFromServer; // used in AppLandingPage
  onSocketPong;

  constructor(store) {
    this.store = store;
  }

  get socket()    { return this._socket }
	set socket(o)   { this._socket = o; }

  get isConnected()  { return this._isConnected }
  set isConnected(v) { this._isConnected = v; /*rxdbStore.app.setProp("watcher.socket.isConnected", v)*/ }

  get socketID()  { return (this.socket) ? this.socket.id : null }

  connect = (server_url, handshake_version, app_version) => {
    if (!server_url) {
	    clog("connect:: abort:: server_url missing:: ", server_url);
    	return;  // url for connection to server
  	}
    if (!handshake_version) handshake_version = 10000; // internal version of socket-api of app (if client has older than required by server -> reject)
    if (!app_version) app_version = 0;

    // send "version" to check on serverside app-version for connection
    const manager_options = {
    	query: {
    		handshakeversion: handshake_version,
    		appversion: app_version,
    	},
    }

    clog("connect:: creating connection:: ", server_url);

    // connect
    this.socket = io(server_url, manager_options);

    // events
    this.initEvents();
  };


  disconnect = () => {
    if (this.socket) this.socket.disconnect();
  }


  clearSendBuffer = () => { // clear emit-buffer (after a offline-phase)
    if (this.socket) this.socket.sendBuffer = [];
  }


  // events
  initEvents = () => {
    global.log("socket:: initEvents:: creating event-listeners", );

    //this.socket.on(`client.oauth.${provider}.io`) -> set in ui/components/auth/OAuth.js

    this.socket.on("client.force.logout", () => {
      //global.log("socket:: event:: client.force.logout:: ", this.socket.id, );
      this.onSocketForceLogout && this.onSocketForceLogout(); // used in AppLandingPage
    });


    this.socket.on("error", (error) => { // triggered from next(new Error(xxx)) in socket.use-middleware of node
      //global.log("socket:: event:: ERROR:: ", error, this.socket.id, this.socket.connected, );
      this.onSocketErrorMessageFromServer && this.onSocketErrorMessageFromServer(error); // used in AppLandingPage
    });


    this.socket.on("connect", () => {
      //global.log("socket:: event:: connect:: ", this.socket.id, this.socket.connected, );
      this.isConnected = this.socket.connected;
      this.onSocketConnect && this.onSocketConnect(this.socket, this.isConnected); // used in AppLandingPage
      this.clearSendBuffer(); // clear previously buffered data when reconnecting
    });


    this.socket.on("disconnect", () => {
      clog("event:: disconnect:: ", this.socket.id, this.socket.connected, );
      this.isConnected = this.socket.connected;

      this.onSocketDisconnect && this.onSocketDisconnect(this.socket, this.isConnected); // used in AppLandingPage
      //this.socket.connect(); // force manually reconnect
    });


    this.socket.on('reconnect_attempt', () => {
      clog("event:: reconnect_attempt:: ", this.socket.id, this.socket.connected, );
      // socket.io.opts.query = { token: 'fgh' }
    })


    this.socket.on("reconnecting", (attempt) => {
      clog("event:: reconnecting:: ", attempt, this.socket.id, this.socket.connected, );
    });


    this.socket.on("reconnect", (attempt) => {
      clog("event:: reconnect:: ", attempt, this.socket.id, this.socket.connected, );
    });


    this.socket.on("connect_timeout", () => {
      //global.log("socket:: event:: connect_timeout:: ", this.socket.id, this.socket.connected, );
    });


    this.socket.on("connect_error", (error) => {
      //global.log("socket:: event:: connect_error:: ERROR:: ", error, this.socket.id, this.socket.connected, );
    });


    this.socket.on("reconnect_error", (error) => {
      //global.log("socket:: event:: reconnect_error:: ERROR:: ", error, this.socket.id, this.socket.connected, );
    });


    this.socket.on("reconnect_failed", () => {
      //global.log("socket:: event:: reconnect_failed:: ", this.socket.id, this.socket.connected, );
    });


    /*
    this.socket.on("ping", () => { // when a ping is fired to the server
      global.log("socket:: event:: ping:: ", this.socket.id, this.socket.connected, );
    });
    */

    this.socket.on("pong", (ms) => { // responsetime
      //global.log("socket:: event:: pong:: ", ms, this.socket.id, this.socket.connected, );
      //rxdbStore.app.setProp("watcher.socket.pongMS", ms)
      this.onSocketPong && this.onSocketPong(this.socket, ms);
    });
  };


  emitWithTimeout = (ioRoute, req, timeout) => {
    // res = {
    //  timeclientout,
    //  timeserverin,
    //  timeserverout, // processing time on server = timeserverout - timeserverin
    //  timeclientin,  // total delay = timeclientin - timeclientout
    //  xxx
    // }
    return new Promise( (resolve, reject) => {
      // check connection
      if (!this.socket || !this.socket.connected) {
        reject(new Error("no connection to server"));
      }

      // set timeout
      const timer = setTimeout(() => {
        clearTimeout(timer);
        this.clearSendBuffer(); // clear buffer to disable re-emit after reconnect
        reject(new Error("timeout for server call"));
      }, timeout || 5000);

      // call server
      try {
        req._timeclientout = unixtime(); // inject to request
        this.socket.emit(ioRoute, req, (err, res) => {
          clearTimeout(timer);
          if (err) reject(err);

          if (res && res.hasOwnProperty("_callstats")) {
            res._callstats.timeclientin = unixtime(); // inject to result
            res._callstats.client2client = 1000 * (res._callstats.timeclientin - res._callstats.timeclientout);
            res._callstats.client2server = 1000 * (res._callstats.timeserverin - res._callstats.timeclientout);
            res._callstats.server2server = 1000 * (res._callstats.timeserverout - res._callstats.timeserverin);
            res._callstats.server2client = 1000 * (res._callstats.timeclientin - res._callstats.timeserverout);
            //rxdbStore.app.setProp("watcher.socket._callstats", res._callstats)
          }

          resolve(res);
        }); // of emit
      } catch (error) {
        reject(error);
      }

    }); // of promise
  }

} // of class

const socketio = new SocketIO();
export default socketio;
