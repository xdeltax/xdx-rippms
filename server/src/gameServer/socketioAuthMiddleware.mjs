import {clog, } from "../tools/consoleLog.mjs";
import {isERROR, isSUCCESS, } from "../tools/isErrorIsSuccess.mjs";

// ===============================================
// route: middleware for every new socket-connect
// ===============================================
export default function socketioAuthMiddleware(socket, next) {
	try {
  	clog("io.use:: socket connect middleware:: ", socket.id);

	  // ===============================================
    // compare ident-key of client (main-server) with ident-key of game-server (this)
	  // ===============================================
    let {
      serverid,
    	servertype,
    	mainserveridentkey,
    } = socket.handshake.query; // const token = socket.handshake.query.token;

    const mainserveridentkey_original = process.env.MAINSERVER_PRIVATE_IDENTKEY || null;

    clog("io.use:: checking communication protocol version:: ", serverid, servertype, mainserveridentkey, mainserveridentkey_original, mainserveridentkey !== mainserveridentkey_original);

    if (!mainserveridentkey || mainserveridentkey !== mainserveridentkey_original)
  	throw isERROR(901, "app.js: io.use", "socket protocol validation", "invalid server to server communication key");

		next();
  } catch (error) {
  	const {err, res} = isERROR(999, "app.js: io.use", "socket protocol validation", error);
  	clog("!!!!!!!!!!! io.use:: ERROR:: ", err, socket.id);

		// send the error to on(error)
		let newErr = new Error("socket protocol validation failed");
		newErr.data = err;
  	next(newErr); // stop here -> err-object will be send to client socket-event "onError"
  };
};
