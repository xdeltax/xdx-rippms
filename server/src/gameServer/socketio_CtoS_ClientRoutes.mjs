import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import {isERROR, isSUCCESS, } from "../tools/isErrorIsSuccess.mjs";

// ===============================================
// route: new socket connect
// ===============================================
export default function socketioRoutes(socket) {
  // ===============================================
  // handle disconnect-event
  // ===============================================
  socket.on('disconnect', async (operation) => {
    clog('socket.on:: client disconnect:: ', socket.id, operation,);
  }); // of socket.on(disconnect)


  // ===============================================
  // new connection established
  // ===============================================
  clog('io.on:: new client connected:: ', socket.id);


  //io.xdx.connectionCount++;
  socket.xdx = {
  	routetype: null,
    userid: null, // update after verification
    servertoken: null,
  };


  // ===============================================
  // update database -> add socket to onlinelist
  // ===============================================
  //const {err: updateError, res: loadedObject} = await DBSockets.createOrUpdate(socket.id, null /*userid*/);


  // ===============================================
  // all routes witgh "free/" and "auth/" are valid
  // ===============================================
  socket.on('game/do/something', async (req, clientEmitCallback) => {
    const err = null;
    const res = { testData: "test" };
  	clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });

};
