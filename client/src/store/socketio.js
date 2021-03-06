import {decorate, observable, runInAction, action} from 'mobx';

import io from "socket.io-client";

//import tryFallback from "tools/tryFallback";

class SocketIO {
  _socket = null;
  _isConnected = false;

  constructor(fbToken) {
    global.log("store:: socket:: constructor:: ", );
    this.clear();
  }

  get socket()    { return this._socket }
	set socket(o)   { runInAction(() => { this._socket = o; }) }

  get socketID()  { return this.socket.id }

  get isConnected()  { return this._isConnected }
  set isConnected(v) { runInAction(() => { this._isConnected = v }) }

  clear = action(() => {
    if (this.socket) this.socket.disconnect();
    this.socket = null;
  });

  connect = action(() => {
    global.log("store:: socket:: connect:: creating connection.", );

    // url for connection to server
    const server_url = process.env.REACT_APP_SERVERURL;
    // send "version" to check on serverside app-version for connection
    const manager_options = { query: { version: process.env.REACT_APP_HANDSHAKEVERSION || 10000, } }
    // connect
    this.socket = io(server_url, manager_options);
    // events
    this.initEvents();
  });

  disconnect = () => {
    if (this.socket) this.socket.disconnect();
  }

  clearSendBuffer = () => { // clear emit-buffer (after a offline-phase)
    if (this.socket) this.socket.sendBuffer = [];
  }

  // events
  initEvents = action(() => {
    global.log("store:: socket:: initEvents:: creating event-listeners", );

    this.socket.on("connect", () => {
      global.log("store:: socket:: event:: connect:: ", this.socket.id, this.socket.connected, );
      this.isConnected = this.socket.connected;

      this.clearSendBuffer(); // clear previously buffered data when reconnecting
    });

    this.socket.on("disconnect", () => {
      global.log("store:: socket:: event:: disconnect:: ", this.socket.id, this.socket.connected, );
      this.isConnected = this.socket.connected;

      //this.socket.connect(); // force manually reconnect
    });


    this.socket.on('reconnect_attempt', () => {
      global.log("store:: socket:: event:: reconnect_attempt:: ", this.socket.id, this.socket.connected, );
      /*
      socket.io.opts.query = {
        token: 'fgh'
      }
      */
    })

    this.socket.on("reconnecting", (attempt) => {
      global.log("store:: socket:: event:: reconnecting:: ", attempt, this.socket.id, this.socket.connected, );

    });

    this.socket.on("reconnect", (attempt) => {
      global.log("store:: socket:: event:: reconnect:: ", attempt, this.socket.id, this.socket.connected, );

    });

    this.socket.on("connect_timeout", () => {
      global.log("store:: socket:: event:: connect_timeout:: ", this.socket.id, this.socket.connected, );

    });

    this.socket.on("connect_error", (error) => {
      global.log("store:: socket:: event:: connect_error:: ERROR:: ", error, this.socket.id, this.socket.connected, );

    });

    this.socket.on("reconnect_error", (error) => {
      global.log("store:: socket:: event:: reconnect_error:: ERROR:: ", error, this.socket.id, this.socket.connected, );

    });

    this.socket.on("reconnect_failed", () => {
      global.log("store:: socket:: event:: reconnect_failed:: ", this.socket.id, this.socket.connected, );

    });

    this.socket.on("error", (error) => { // triggered from next(new Error(xxx)) in socket.use-middleware of node
      global.log("store:: socket:: event:: error:: ERROR:: ", error, this.socket.id, this.socket.connected, );

    });

    /*
    this.socket.on("ping", () => { // when a ping is fired to the server
      global.log("store:: socket:: event:: ping:: ", this.socket.id, this.socket.connected, );
    });
    */

    this.socket.on("pong", (ms) => { // responsetime
      global.log("store:: socket:: event:: pong:: ", ms, this.socket.id, this.socket.connected, );

    });
  });


  emitWithTimeoutAndConvertStatusToError = (url_param, req, timeout) => {
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
        this.socket.emit(url_param, req, (status, result) => { // convert (status, result) to return result or throw error
          clearTimeout(timer);
          if (status !== "ok") reject(status);
          resolve(result);
        }); // of emit
      } catch (error) {
        reject(error);
      }
    }); // of promise
  }

} // of class

decorate(SocketIO, {
  _socket: observable,
  _isConnected: observable,
});

export default SocketIO;
