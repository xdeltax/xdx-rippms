import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import {isERROR, isSUCCESS, } from "../tools/isErrorIsSuccess.mjs";

import * as jwt from '../tools/jwt.mjs';
import joiValidateFallback from '../tools/joiValidateFallback.mjs';

import {joi_userid, joi_servertoken, } from '../database/joiValidators.mjs';


// ===============================================
// route: middleware for every ws-call from client
// ===============================================
export default async function authSocket(socket, packet, next) {
	// injected in socket::
	// 		socket._clienttimeout
	// 		socket._timeserverin
	// 		socket._servername = ""
	// 		socket._database = { dbSockets, dbUsers, dbUsercards, ...}
	// packet is array of [route(String), req(Object), callback(function)]
	const [ route, req, clientEmitCallback ] = packet || {};
	const { server, _database, } = req || {};
	const { dbSockets, } = _database || {};
	try {
		// ===============================================
		// auth-routes: routes starting with "auth" needs a valid servertoken
		// ===============================================
		if (route && route.indexOf("auth") === 0) {
			const {userid, servertoken} = req || {};
			if (!req || !userid || !servertoken) throw isERROR(1, "app.js: socket.use", "validation", "no id or token provided"); // throw new Error("no token found");

			// ===============================================
			// check servertoken-format
			// ===============================================
			const valid_userid      = joiValidateFallback(userid     , null, joi_userid);
			const valid_servertoken = joiValidateFallback(servertoken, null, joi_servertoken);
			if (!valid_userid || !valid_servertoken) throw isERROR(2, "app.js: socket.use", "validation", "invalid id or token format");

			// ===============================================
			// verify servertoken
			// ===============================================
			if (!jwt.verify(valid_servertoken)) throw isERROR(3, "app.js: socket.use", "validation", 'token verification failed'); // check if the token was signed by this server and isnt expired

			// ===============================================
			// decode servertoken
			// ===============================================
			const decodedServertoken = jwt.decode(valid_servertoken); // decoding token to extract userid
			//clog("server.use:: decodedServertoken:: ", decodedServertoken)
			// usid: userid
			// pvd: provider
			// pid: providerid
			// hash: crypto.createHash('sha1').update(JSON.stringify(thisUser.forcenew + thisUser.providertoken)).digest('hex');
			const { usid, pvd, pid, hash } = decodedServertoken || {};
			if (!usid || !pvd || !pid || !hash) throw isERROR(4, "app.js: socket.use", "validation", "invalid token structure");
			if (usid !== valid_userid) throw isERROR(5, "app.js: socket.use", "validation", "token / user mismatch");

			const {err: updateError, res: loadedObject} = await dbSockets.createOrUpdate(socket.id, /*userid*/ valid_userid );
			if (updateError) clog('app:: io.on:: new client validated:: updated userid to database:: ERROR:: ', updateError, loadedObject.userid);

			req._authSocket = {
				routeType: "auth",
				userid: valid_userid,
			}

			return next();
		};

		// ===============================================
		// unauth-routes: routes starting with "free" needs no servertoken
		// ===============================================
		if (route && route.indexOf("free") === 0) {
			const {userid, servertoken} = req || {};

			if (!req) throw isERROR(7, "app.js: socket.use", "validation", "no id or token found");

			req._authSocket = {
				routeType: "free",
				userid: null,
			}

			return next();
		};

		// ===============================================
		// invalid-routes: all other routes are invalid
		// ===============================================
		throw new Error("invalid route");
	} catch (error) {
		const {err, res} = isERROR(99, "app.js: socket.use", "validation", error);
		clog("app:: socket.use:: ERROR:: ", error, err, socket.id);

		req._authSocket = {
			routeType: null,
			userid: null,
		}

		// callback:: send the error to client-emit-function
		clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function

		// send a "force logout" signal to client
		socket.emit("client.force.logout", err); // emit logout-request to clients sotre.socketio.on("")

		// send the error to on(error)
		let newErr = new Error("validation failed");
		newErr.data = err;
		next(newErr); // stop here -> err-object will be send to client socket-event "onError"
	} finally {
		if (socket) {
			//db-call to update onlineStatus -> add socket to onlinelist
			const {err: updateCountError, res: count} = await dbSockets.updateCount(socket.id);
			clog('app:: io.on:: new client connected:: updateCount:: ', route, socket.id, updateCountError, count);
		}
	}
};
