import {clog, } from "../tools/consoleLog.mjs";
import {isERROR, isSUCCESS, } from "../tools/isErrorIsSuccess.mjs";

// ===============================================
// route: new socket connect
// ===============================================
export default async function socketioRoutes(socket) {
  // ===============================================
  // handle disconnect-event
  // ===============================================
  socket.on('disconnect', async (operation) => {
    /*
    io.xdx.connectionCount--;
    if (io.xdx.connectionCount < 0) io.xdx.connectionCount = 0;

    // remove client from online-list
    if ( socket.hasOwnProperty("xdx")
      && socket.xdx.hasOwnProperty("userid")
      && socket.xdx.userid
      && io.xdx.useridARRAY.includes(socket.xdx.userid)
    ) {
      io.xdx.useridARRAY = arrayRemoveElementByValue(io.xdx.useridARRAY, socket.xdx.userid);
    }
    */
    // db-call to update onlineStatus -> remove socket
    const {err: removeError, res: numRemoved} = await DBSockets.remove(socket.id);
    global.log('socket.on:: client disconnect:: ', socket.id, operation, removeError, numRemoved);
  }); // of socket.on(disconnect)


  // ===============================================
  // new connection established
  // ===============================================
  global.log('app:: io.on:: new client connected:: ', socket.id);


  //io.xdx.connectionCount++;
  socket.xdx = {
    routetype: null,
    userid: null, // update after verification
    servertoken: null,
  };

  // ===============================================
  // update database -> add socket to onlinelist
  // ===============================================
  const {err: updateError, res: loadedObject} = await DBSockets.createOrUpdate(socket.id, null /*userid*/);
  if (updateError) global.log('app:: io.on:: new client connected:: added to database:: ERROR:: ', updateError, loadedObject.userid);


  /*
  // every api-call for this client (socket) is counted here.
  if (!socket.apicalls) socket.apicalls = { count: 0, };
  socket.apicalls.count++;
  socket.apicalls.updatedAt = new Date() / 1000;
  global.log("socketio:: socket.use:: apicalls:: count:: ", socket.apicalls.count, socket.apicalls.updatedAt);
  */


  // ===============================================
  // middleware: check routes of api-calles
  // ===============================================
  // routes with "auth/..." are valid if req contains "userid" and (a valid) "servertoken"
  // routes with "free/..." are always valid
  // all other routes are invalid
  // ===============================================
  socket.use(async (packet, next) => {
    const [route, req, clientEmitCallback] = packet || {};
    try {
      // ===============================================
      // auth-routes: routes starting with "auth" needs a valid servertoken
      // ===============================================
      if (route && route.indexOf("auth") === 0) {
        const {userid, servertoken} = req || {};
        if (!req || !userid || !servertoken) throw ERROR(1, "app.js: socket.use", "validation", "no id or token provided"); // throw new Error("no token found");

        // ===============================================
        // check servertoken-format
        // ===============================================
        const valid_userid      = JoiValidateFallback(userid     , null, joi_userid);
        const valid_servertoken = JoiValidateFallback(servertoken, null, joi_servertoken);
        if (!valid_userid || !valid_servertoken) throw ERROR(2, "app.js: socket.use", "validation", "invalid id or token format");

        // ===============================================
        // verify servertoken
        // ===============================================
        if (!jwt.verify(valid_servertoken)) throw ERROR(3, "app.js: socket.use", "validation", 'token verification failed'); // check if the token was signed by this server and isnt expired

        // ===============================================
        // decode servertoken
        // ===============================================
        const decodedServertoken = jwt.decode(valid_servertoken); // decoding token to extract userid
        //global.log("server.use:: decodedServertoken:: ", decodedServertoken)
        // usid: userid
        // pvd: provider
        // pid: providerid
        // hash: crypto.createHash('sha1').update(JSON.stringify(thisUser.forcenew + thisUser.providertoken)).digest('hex');
        const { usid, pvd, pid, hash } = decodedServertoken || {};
        if (!usid || !pvd || !pid || !hash) throw ERROR(4, "app.js: socket.use", "validation", "invalid token structure");
        if (usid !== valid_userid) throw ERROR(5, "app.js: socket.use", "validation", "token / user mismatch");

        if (socket.xdx.userid && socket.xdx.userid !== valid_userid) throw ERROR(6, "app.js: socket.use", "validation", "connection misuse");

        socket.xdx.routetype = "auth";
        socket.xdx.userid = valid_userid;
        socket.xdx.servertoken = valid_servertoken;

        /*
        // ===============================================
        // add user to list of valid users beeing online
        // ===============================================
        // add auth client to online-list
        if (!io.xdx.useridARRAY.includes(socket.xdx.userid)) {
          io.xdx.useridARRAY.push(socket.xdx.userid);
          //todo: -> db-call to update onlineStatus
        };
        */

        const {err: updateError, res: loadedObject} = await DBSockets.createOrUpdate(socket.id, /*userid*/ valid_userid );
        if (updateError) global.log('app:: io.on:: new client validated:: updated userid to database:: ERROR:: ', updateError, loadedObject.userid);

        return next();
      };

      // ===============================================
      // unauth-routes: routes starting with "free" needs no servertoken
      // ===============================================
      if (route && route.indexOf("free") === 0) {
        const {userid, servertoken} = req || {};

        if (!req) throw ERROR(7, "app.js: socket.use", "validation", "no id or token found");

        socket.xdx.routetype = "free";

        return next();
      };

      // ===============================================
      // invalid-routes: all other routes are invalid
      // ===============================================
      throw new Error("invalid route");
    } catch (error) {
      const {err, res} = ERROR(99, "app.js: socket.use", "validation", error);
      global.log("app:: socket.use:: ERROR:: ", error, err, socket.id);

      // callback:: send the error to client-emit-function
      clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function

      // send a "force logout" signal to client
      socket.emit("client.force.logout", err); // emit logout-request to clients sotre.socketio.on("")

      // send the error to on(error)
      let newErr = new Error("validation failed");
      newErr.data = err;
      next(newErr); // stop here -> err-object will be send to client socket-event "onError"
    } finally {
      //db-call to update onlineStatus -> add socket to onlinelist
      const {err: updateCountError, res: count} = await DBSockets.updateCount(socket.id);
      global.log('app:: io.on:: new client connected:: updateCount:: ', route, updateCountError, count);
    }
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
    global.log("socket.on(auth/store/user/logout)::1:: ", req, socket.xdx.userid);

    socket.xdx.userid = null;
    socket.xdx.servertoken = null;
    const err = null;
    const res = true;
    global.log("socket.on(auth/store/user/logout)::2:: ", socket.xdx.userid, err, res,);
    clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });

  socket.on('auth/store/userstore/get', async (req, clientEmitCallback) => {
    const { targetuserid, userid, servertoken, } = req || {};
    global.log("socket.on(auth/userstore/get):: ", req,);
    const {err, res} = await _getUserStore(targetuserid, userid, servertoken,);
    global.log("socket.on(auth/userstore/get):: ", socket.xdx.userid, err, res.userid,);
    clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });


  socket.on('auth/store/user/get', async (req, clientEmitCallback) => {
    const { targetuserid, userid, servertoken, } = req || {};
    const {err, res} = await DBUsers.getUser(targetuserid, userid, servertoken);
    global.log("socket.on(auth/user/get):: ", socket.xdx.userid, err, res.userid,);
    clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });


  socket.on('auth/store/user/update', async (req, clientEmitCallback) => {
    const { targetuserid, userid, servertoken, props, } = req || {};
    const {err, res} = await DBUsers.updateProps(targetuserid, userid, servertoken, props);
    global.log("socket.on(auth/user/update):: ", socket.xdx.userid, err, res.userid);
    clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });


  socket.on('auth/store/usercard/get', async (req, clientEmitCallback) => {
    const { targetuserid, userid, servertoken, } = req || {};
    const {err, res} = await DBUsercards.getUsercard(targetuserid, userid, servertoken);
    global.log("socket.on(auth/usercard/get):: ", socket.xdx.userid, err, res.userid);
    clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });


  socket.on('auth/store/usercard/update', async (req, clientEmitCallback) => {
    const { targetuserid, userid, servertoken, props, } = req || {};
    const {err, res} = await DBUsercards.updateProps(targetuserid, userid, servertoken, props);
    global.log("socket.on(auth/user/update):: ", socket.xdx.userid, err, res.userid);
    clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });


  // ===============================================
  // all routes witgh "free/" and "auth/" are valid
  // ===============================================
  socket.on('game/do/something', async (req, clientEmitCallback) => {
    const err = null;
    const res = { testData: "test" };
  	clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
  });

};
