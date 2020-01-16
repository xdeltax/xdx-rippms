import {clog, } from "../tools/consoleLog.mjs";
import {isERROR, isSUCCESS, } from "../tools/isErrorIsSuccess.mjs";

// ===============================================
// route: middleware for every new socket-connect
// ===============================================
export default function socketioAuthConnectionHandshake(socket, next) {
	try {
		clog("io.use:: socket connect middleware:: ", socket.id)

		// ===============================================
		// check handshake-version of client and server
		// ===============================================
		// check (own app-)protocol-version is set in connect-function of socketio.js in client
		// this way we can force clients to update their mobile app
		let {
			handshakeversion,
			appversion,
		} = socket.handshake.query; // const token = socket.handshake.query.token;

		let clientHandshakeVersion = +handshakeversion; // convert string to number
		let clientAppVersion = +appversion; // convert string to number

		if (!clientHandshakeVersion) clientHandshakeVersion = 0;
		if (!clientAppVersion) clientAppVersion = 0;

		let serverHandshakeVersion = +process.env.SOCKETIO_HANDSHAKEVERSION;
		let serverAppVersion = +process.env.SOCKETIO_APPVALIDVERSION;

		if (!serverHandshakeVersion) serverHandshakeVersion = clientHandshakeVersion;
		if (!serverAppVersion) serverAppVersion = clientAppVersion;

		clog("io.use:: versions:: ", clientAppVersion, clientHandshakeVersion, serverHandshakeVersion, clientHandshakeVersion < serverHandshakeVersion);

		if (!clientHandshakeVersion || !Number.isInteger(clientHandshakeVersion) || clientHandshakeVersion < serverHandshakeVersion)
		throw isERROR(901, "io.use", "socket protocol validation", "invalid app communication protocol version c / s: " + clientHandshakeVersion + " / " + serverHandshakeVersion);

		next();
	} catch (error) {
		const {err, res} = isERROR(999, "io.use", "socket protocol validation", error);
		clog("io.use:: ERROR:: ", err, socket.id);

		// send a "force logout" signal to client
		socket.emit("client.force.logout", err); // emit logout-request to clients sotre.socketio.on("")

		// send the error to on(error)
		let newErr = new Error("socket protocol validation failed");
		newErr.data = err;
		next(newErr); // stop here -> err-object will be send to client socket-event "onError"
	};
};
