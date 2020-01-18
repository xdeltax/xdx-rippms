import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import crypto from 'crypto';
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
    	mainserveridentkeyhashed, // send hashed version of env privatekey
    } = socket.handshake.query; // const token = socket.handshake.query.token;

		const mainserveridentkeyHash_ORIGINAL = crypto.createHash('sha1').update(JSON.stringify(process.env.MAINSERVER_PRIVATE_IDENTKEY || "xyz")).digest('hex');

    clog("io.use:: checking communication protocol version:: ", serverid, servertype, mainserveridentkeyhashed, mainserveridentkeyHash_ORIGINAL, mainserveridentkeyhashed === mainserveridentkeyHash_ORIGINAL);

    if (!mainserveridentkeyhashed || mainserveridentkeyhashed !== mainserveridentkeyHash_ORIGINAL)
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
