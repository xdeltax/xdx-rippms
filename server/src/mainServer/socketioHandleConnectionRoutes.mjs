import Joi from '@hapi/joi';

import {clog, } from "../tools/consoleLog.mjs";
import {isERROR, isSUCCESS, } from "../tools/isErrorIsSuccess.mjs";

import DBUsers from '../nedb/DBUsers.mjs';
import DBSockets from '../nedb/DBSockets.mjs';
import DBUsercards from '../nedb/DBUsercards.mjs';

import socketioAuthClientSocketUser from "./socketioAuthClientSocketUser.mjs";


// ===============================================
// route: new socket connect
// ===============================================
export default async function socketioHandleConnectionRoutes(socket) {
  // ===============================================
  // handle disconnect-event
  // ===============================================
  socket.on('disconnect', async (operation) => {
    // db-call to update onlineStatus -> remove socket
    const {err: removeError, res: numRemoved} = await DBSockets.remove(socket.id);
    clog('socket.on:: client disconnect:: ', socket.id, operation, removeError, numRemoved);
  }); // of socket.on(disconnect)


  // ===============================================
  // new connection established
  // ===============================================
  clog('app:: io.on:: new client connected:: ', socket.id);


  // ===============================================
  // update database -> add socket to onlinelist
  // ===============================================
  const {err: updateError, res: loadedObject} = await DBSockets.createOrUpdate(socket.id, null /*userid*/);
  if (updateError) clog('app:: io.on:: new client connected:: added to database:: ERROR:: ', updateError, loadedObject.userid);


  // ===============================================
  // middleware: check routes of api-calles:: all routes after  middleware are valid
  // ===============================================
  // routes with "auth/..." are valid if req contains "userid" and (a valid) "servertoken"
  // routes with "free/..." are always valid
  // all other routes are invalid
  // ===============================================
  socket.use((packet, next) => socketioAuthClientSocketUser(socket, packet, next));

  socket.use((packet, next) => {
    // packet is array of [route(String), req(Object), callback(function)]
  	const [route, req, clientEmitCallback] = packet || {};
    clog("XXXXXXXXXXXXXXXXX:: ", req)
    next();
  });

  const _getUserStore = async (targetuserid, userid, servertoken) => {
  	let res = null;
  	const {err, res: res_user} = await DBUsers.getUser(targetuserid, userid, servertoken);
  	if (!err && res_user) {
  		res = {
  			user: res_user,
  			usercard: null,
  		};

  		// query usercard
  		const {err: err_usercard, res: res_usercard} = await DBUsercards.getUsercard(res_user.userid, res_user.userid, res_user.servertoken);
  		if (!err_usercard) {
  			res.usercard = res_usercard;
  		}
  	}
  	return {err: err, res: res};
  };

  // ===============================================
  // all routes with "free/" and "auth/" are valid
  // ===============================================
  socket.on('auth/store/user/logout', async (req, clientEmitCallback) => {
    const { targetuserid, userid, servertoken, } = req || {};
    clog("socket.on(auth/store/user/logout)::1:: ", req, );
    const err = null, res = true;
    clog("socket.on(auth/store/user/logout)::2:: ", err, res,);
    clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });

  socket.on('auth/store/userstore/get', async (req, clientEmitCallback) => {
    const { targetuserid, userid, servertoken, } = req || {};
    clog("socket.on(auth/userstore/get):: ", req,);
    const {err, res} = await _getUserStore(targetuserid, userid, servertoken,);
    clog("socket.on(auth/userstore/get):: ", err, res.userid,);
    clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });


  socket.on('auth/store/user/get', async (req, clientEmitCallback) => {
    const { targetuserid, userid, servertoken, } = req || {};
    const {err, res} = await DBUsers.getUser(targetuserid, userid, servertoken);
    clog("socket.on(auth/user/get):: ", err, res.userid,);
    clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });


  socket.on('auth/store/user/update', async (req, clientEmitCallback) => {
    const { targetuserid, userid, servertoken, props, } = req || {};
    const {err, res} = await DBUsers.updateProps(targetuserid, userid, servertoken, props);
    clog("socket.on(auth/user/update):: ", err, res.userid);
    clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });


  socket.on('auth/store/usercard/get', async (req, clientEmitCallback) => {
    const { targetuserid, userid, servertoken, } = req || {};
    const {err, res} = await DBUsercards.getUsercard(targetuserid, userid, servertoken);
    clog("socket.on(auth/usercard/get):: ", err, res.userid);
    clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });


  socket.on('auth/store/usercard/update', async (req, clientEmitCallback) => {
    const { targetuserid, userid, servertoken, props, } = req || {};
    const {err, res} = await DBUsercards.updateProps(targetuserid, userid, servertoken, props);
    clog("socket.on(auth/user/update):: ", err, res.userid);
    clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });


  // ===============================================
  // all routes with "free/" and "auth/" are valid
  // ===============================================
  socket.on('free/do/something', async (req, clientEmitCallback) => {
    const err = null;
    const res = { testData: "test" };
  	clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });

};
