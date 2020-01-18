import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import socketioclient from "socket.io-client";
import {emitWithTimeoutToSocket, clearSendBufferSocket, disconnectSocket, } from "../tools/socketioClientHelper.mjs";

export default class ServerToServerSocketIOClient {
  constructor(io) {
    this.gameServerSocket = null;

    this.io = io;
  }

  destroy = () => {
    this.io = null;
    this.gameServerSocket = null;
  }

  connect = (gameserverAddr, gameserverPort, mainserveridentkeyHash_ORIGINAL) => {
    //const gameserverAddr = process.env.GAMESERVER_ADDR || "localhost";
    //const gameserverPort = process.env.GAMESERVER_PORT || "2052";
    //const mainserveridentkeyHash_ORIGINAL = crypto.createHash('sha1').update(JSON.stringify(process.env.MAINSERVER_PRIVATE_IDENTKEY || "xyz")).digest('hex');
    const gameserverManagerOptions = {
      query: {
        serverid: "01",
        servertype: "main",
        mainserveridentkeyhashed: mainserveridentkeyHash_ORIGINAL,
      },
    };

    this.gameServerSocket = socketioclient.connect(`http://${gameserverAddr}:${gameserverPort}`, gameserverManagerOptions);
    this.initEvents();

    clog("gameServerSocket:: connect:: ", this.gameServerSocket.query.serverid, );
  }

  initEvents = () => {
    // ===============================================
    // SERVER2SERVER SOCKET: error events
    // ===============================================
    this.gameServerSocket.on("error", (error) => { // triggered from next(new Error(xxx)) in socket.use-middleware of node
      clog("gameServerSocket:: error:: ", error.description, this.gameServerSocket.id);
    });

    this.gameServerSocket.on("connect_error", (error) => { // triggered from next(new Error(xxx)) in socket.use-middleware of node
      clog("gameServerSocket:: connect_error:: ", error.description, this.gameServerSocket.id);
    });

    this.gameServerSocket.on("reconnect_error", (error) => { // triggered from next(new Error(xxx)) in socket.use-middleware of node
      clog("gameServerSocket:: reconnect_error:: ", error.description, this.gameServerSocket.id);
    });

    this.gameServerSocket.on("reconnect_failed", (error) => { // triggered from next(new Error(xxx)) in socket.use-middleware of node
      clog("gameServerSocket:: reconnect_failed:: ", error.description, this.gameServerSocket.id );
    });


    // ===============================================
    // SERVER2SERVER SOCKET: connection events
    // ===============================================
    this.gameServerSocket.on("connect", () => {
      clog("gameServerSocket:: connect:: ", this.gameServerSocket.id, this.gameServerSocket.connected, );
      //this.clearSendBuffer(); // clear previously buffered data when reconnecting
    });

    this.gameServerSocket.on("disconnect", () => {
      clog("gameServerSocket:: disconnect:: ",this.gameServerSocket.id, this.gameServerSocket.connected, );
    });

    this.gameServerSocket.on("reconnect_attempt", () => {
      clog("gameServerSocket:: reconnect_attempt:: ",this.gameServerSocket.id, this.gameServerSocket.connected, );
    });

    this.gameServerSocket.on("reconnecting", () => {
      clog("gameServerSocket:: reconnecting:: ",this.gameServerSocket.id, this.gameServerSocket.connected, );
    });

    this.gameServerSocket.on("reconnect", () => {
      clog("gameServerSocket:: reconnect:: ",this.gameServerSocket.id, this.gameServerSocket.connected, );
    });

    this.gameServerSocket.on("connect_timeout", () => {
      clog("gameServerSocket:: connect_timeout:: ",this.gameServerSocket.id, this.gameServerSocket.connected, );
    });

    // ===============================================
    // SERVER2SERVER SOCKET: ping events
    // ===============================================
    this.gameServerSocket.on("ping", () => { // when a ping is fired to the server
      clog("****** gameServerSocket:: ping:: ", this.gameServerSocket, );
    });

    this.gameServerSocket.on("pong", (ms) => { // responsetime
      clog("gameServerSocket:: pong:: ", ms, this.gameServerSocket.id, this.gameServerSocket.connected, );
    });

    // ===============================================
    // SERVER2SERVER SOCKET: api events == gameserver send commands to mainserver
    // ===============================================

  }

}
