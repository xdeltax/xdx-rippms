"use strict";

const jwt = requireX('tools/auth/jwt');

const Joi = require('@hapi/joi');
const JoiValidateThrow = requireX('tools/joivalidatethrow');

// search array for a value and remove that array-items
const arrayRemoveElementByValue = (arr, value) => { return arr.filter( function(element){ return element !== value; }) }


module.exports = (app, io) => {
  const now = new Date() / 1000;

  io.xdx = { // add object to io -> track number of connections
    connectionCount: 0,
    useridARRAY: [],
  };

  ////
  //
  // socket.io connection-handler
  //		
  // - handle a new connection (socket)
  // - register event-handlers for this socket
  //
  //
  io.on('connection', (socket) => {
    if (!socket) return;
    // new connection established
    global.log('socketio:: io.on:: client successfully connected:: ', socket.id);

    io.xdx.connectionCount++;

    socket.xdx = {
      userid: null, // update after verification
    };

    //todo: -> db-call to update onlineStatus

    // handle disconnect-event
    socket.on('disconnect', (operation) => {
      global.log('socketio:: io.on:: client disconnect:: ', socket.id, operation);

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

      //todo: -> db-call to update onlineStatus
    });

    
	  ////
	  //
	  // socket middleware
	  //		
	  // - pre-validate a route
	  //
    // - attn.: is NOT called on first connection. it IS called on emit-events
	  //
    socket.use((packet, next) => {
      // packet contains all fiels from the client-side emit-function
      // packet:: all from socket.emit(a,b,c,d, () => {}); -> packet: [ a,b,c,d, callback-function ]
      // from client we send this: packet = [ url_param, res, callback-function ]
      // we encode the socket-transport exactly the same way like REST-calls (res, req / headers, body, params) -> we can use the call to DB for websocket AND REST-calls
      let clientEmitCallback;
      try {
        //global.log("socketio:: socket.use:: packet:: ", packet);

        if (!packet || !Array.isArray(packet) || packet.length < 3)
        throw new Error("invalid communication-packet structure");

        // structure we get from the client
        const [apicall, req, ...rest] = packet; // destructure array, last element is callback-function
        clientEmitCallback = rest[rest.length - 1]; // last element of array is always the callback-function of clients emit

        // req-structure we get from the client
        const { headers, body, params, } = req; // client always send "headers", "body", "params"
        if (!headers || !body || !params )
        throw new Error("invalid communication-packet request structure");

        // headers-structure we get from the client
        const { userid, authorization,  } = headers; // client always send userid and authorization (servertoken) for authentification
        //global.log("socketio:: socket.use:: packet userid:: ", userid);
        //global.log("socketio:: socket.use:: packet headers:: ", headers);

        // every api-call for this client (socket) is counted here.
        if (!socket.apicalls) socket.apicalls = { };
        socket.apicalls.count++;
        socket.apicalls.updatedAt = now;

        global.log("socketio:: socket.use:: apicalls:: count:: ", apicall, userid, socket.apicalls.count, );

        /*
        //todo: implement flood-control -> disconnect -> ban
        if (socket.apicalls.count >= 10) {
          const timeDiff = socket.apicalls.updatedAt - socket.apicalls.createdAt;
          global.log("socketio:: socket.use:: apicalls:: timeDiff:: ", apicall, userid, socket.apicalls.count, timeDiff);
        }
        */

        // whitelist apicalls without auth-requirements
        // all api-calls from client that dont need authentication(a userid and a valid servertoken) needed to be listed here
        const apiCallWhitelist = [
          '/api2/token/get',
          '/api2/clients/connected/get/all',
          '/api3/login/provider/facebook',
        ];


        //global.log("socketio:: socket.use:: check whitelist:: ", apicall, apiCallWhitelist.includes(apicall));
        if (apiCallWhitelist.includes(apicall) === true) return next(); // skip the next authentication steps

        //////
        // check if connected socket has send the servertoken with its request
        /////
        //global.log("socketio:: socket.use:: auth stage 2:: ", apicall, authorization);

        // authorization === jwt-servertoken
        const valid_authorization = JoiValidateThrow(authorization, Joi.string().min(30).max(499).normalize().required(), "invalid authorization header (1): " ); // return valid object or throw
        const valid_userid        = JoiValidateThrow(userid       , Joi.string().min(30).max(50).alphanum().normalize().required(), "invalid authorization header (2): " ); // return valid object or throw

        if (global.DEBUG_DISABLE_REQUIRESERVERTOKEN) {
          global.log("****************** DEBUG ******************", "global.DEBUG_DISABLE_REQUIRESERVERTOKEN", global.DEBUG_DISABLE_REQUIRESERVERTOKEN);
        } else {
          if (!validator.isJWT(valid_authorization))
          throw new Error('invalid token format');

          if (!wt.verify(valid_authorization)) // check if the token was signed by this server and isnt expired
          throw new Error('verification failed');

          const decodedServertoken = jwt.decode(valid_authorization); // decoding token to extract userid
          // usid: dbUser._id  // fbid: dbUser.fbid  // hash: crypto.createHash('sha1').update(JSON.stringify(dbUser.forcenew + dbUser.fbtoken)).digest('hex');
          if ( !decodedServertoken
            || !decodedServertoken.hasOwnProperty("usid")
            || !decodedServertoken.usid
            || decodedServertoken.usid !== valid_userid
          ) throw new Error("token mismatch");
        }

        // user is successfully authentificated
        socket.xdx.userid = valid_userid;

        // add auth client to online-list
        if (!io.xdx.useridARRAY.includes(socket.xdx.userid)) {
          io.xdx.useridARRAY.push(socket.xdx.userid);

          //todo: -> db-call to update onlineStatus
        };

        global.log('socketio:: socket.use:: client authentificated:: ', socket.id, valid_userid);
        return next();
      } catch (error) {
        // next-errors are not handled in node, they are send to client:: socket.on('error', function(err){ ... });
        global.log("socketio:: socket.use:: ERROR:: ", error);

        const status = "validation error";
        const result = null;
        clientEmitCallback && clientEmitCallback(status, result); // send callback with error to emit-function in client
        next(error); // error is emited to listener "error" on client
      }
    }); // of middleware



    //*******************************************************************************************
    //*** unprotected routes (no auth required) == in apiCallWhitelist
    //*******************************************************************************************

    socket.on('/api3/login/provider/facebook', async (req, clientEmitCallback) => { // in apiCallWhitelist
      const res = null;
      Object.assign(req || {}, { clientip: socket.clientip, }); // inject client-ip


			passport.authenticate('facebook')

      global.log("req::", req)
      //const {status, result} = await requireX('database/nedb/DBUsers').loginWithFacebook(req, res); // thats the same API-Call like in ./routes/unprotected/index.js

      let status = "notOK";
      let result = null;

      if (status === "ok") {
        const { /*isnewuser,*/ user } = result;
        const { userid, servertoken, accountstatus, memberstatus, fbuserid, fbtoken, } = user;

        // this is done on every new token-request and needed to be done after every new connection
        socket.xdx.userid = userid || null;
        socket.xdx.servertoken = servertoken || null;
        socket.xdx.fbuserid = fbuserid || null;
        socket.xdx.fbtoken = fbtoken || null;
        socket.xdx.accountstatus = accountstatus || [];
        socket.xdx.memberstatus = memberstatus || [];
      }

      global.log("socketio:: call /api2/token/get:: ", socket.xdx.userid, status);
      clientEmitCallback && clientEmitCallback(status, result); // socketio can handle json only (-> no error-objects)
      return;
    });


    // +++ LOGIN / REGISTER / RENEW-SERVERTOKEN
    // +++ non-auth-route (in whitelist)
    // +++ called from client in Routelogin / RouteRegister
    // +++ receive: facebook-id and facebook-accesstoken
    // +++ return: userid and servertoken and stuff (technical: user-object from DBUsers-Database)
    socket.on('/api2/token/get', async (req, callback) => { // in apiCallWhitelist
      const res = null;
      Object.assign(req || {}, { clientip: socket.clientip, }); // inject client-ip

      // api-call to database
      const {status, result} = await requireX('database/nedb/DBUsers').loginWithFacebook(req, res); // thats the same API-Call like in ./routes/unprotected/index.js

      if (status === "ok") {
        const { /*isnewuser,*/ user } = result;
        const { userid, servertoken, accountstatus, memberstatus, fbuserid, fbtoken, } = user;

        // this is done on every new token-request and needed to be done after every new connection
        socket.xdx.userid = userid || null;
        socket.xdx.servertoken = servertoken || null;
        socket.xdx.fbuserid = fbuserid || null;
        socket.xdx.fbtoken = fbtoken || null;
        socket.xdx.accountstatus = accountstatus || [];
        socket.xdx.memberstatus = memberstatus || [];
      }

      global.log("socketio:: call /api2/token/get:: ", socket.xdx.userid, status);
      clientEmitCallback && clientEmitCallback(status, result); // socketio can handle json only (-> no error-objects)
      return;
    });



    socket.on('/api2/clients/connected/get/all', async (req, callback) => { // in apiCallWhitelist
      const a = io.xdxConnectionCount;
      const c = io.engine.clientsCount;
      const d = socket.client.conn.server.clientsCount;
      //const d = io.sockets.clients().filter(c => !!c).length

      const status = "ok";
      const result = {
        a: a,
        c: c,
        d: d,
        io: io.xdx,
        socket: socket.xdx,
      };
      clientEmitCallback(status, result); // socketio can handle json only (no error-objects)
      return;
    });


    //*******************************************************************************************
    //*** protected routes (auth required) == not in apiCallWhitelist
    //*******************************************************************************************


    // +++ LOGOUT by user action
    // +++ auth-route
    // +++ called on logout
    // +++ input: userid and servertoken
    // +++ return: user-object user-object from DBUsers-Database
    socket.on('/api2/auth/logout', async (req, callback) => {
      const res = null;
      Object.assign(req || {}, { clientip: socket.clientip, }); // inject client-i
      const {status, result} = await requireX('database/nedb/DBUsers').logout(req, res); // thats the same API-Call like in ./routes/protected/index.js
      clientEmitCallback(status, result); // socketio can handle json only (no error-objects)
    });

    /*
    socket.on('/api2/auth/userprofile/get', async (req, callback) => {
      const res = null;
      Object.assign(req || {}, { clientip: socket.clientip, }); // inject client-ip
      const {status, result} = await requireX('database/nedb/DBUserProfile').getUserProfile(req, res); // thats the same API-Call like in ./routes/protected/index.js
      callback(status, result); // socketio can handle json only (no error-objects)
    });

    socket.on('/api2/auth/userprofile/update/own', async (req, callback) => {
      const res = null;
      Object.assign(req || {}, { clientip: socket.clientip, }); // inject client-ip
      const {status, result} = await requireX('database/nedb/DBUserProfile').updateUserProfileOwn(req, res); // thats the same API-Call like in ./routes/protected/index.js
      callback(status, result); // socketio can handle json only (no error-objects)
    });
    */

    /*
    socket.on('/api2/auth/usergallery/get', async (req, callback) => {
      const res = null;
      Object.assign(req || {}, { clientip: socket.clientip, }); // inject client-ip
      const {status, result} = await requireX('database/nedb/DBUserGallery').getUserGallery(req, res); // thats the same API-Call like in ./routes/protected/index.js
      callback(status, result); // socketio can handle json only (no error-objects)
    });

    socket.on('/api2/auth/usergallery/update/own', async (req, callback) => {
      const res = null;
      Object.assign(req || {}, { clientip: socket.clientip, }); // inject client-ip
      const {status, result} = await requireX('database/nedb/DBUserGallery').updateGalleryOwn(req, res); // thats the same API-Call like in ./routes/protected/index.js
      callback(status, result); // socketio can handle json only (no error-objects)
    });

    socket.on('/api2/auth/usergallery/add/image/own', async (req, callback) => {
      const res = null;
      Object.assign(req || {}, { clientip: socket.clientip, }); // inject client-ip
      const {status, result} = await requireX('database/nedb/DBUserGallery').addImageOwn(req, res); // thats the same API-Call like in ./routes/protected/index.js
      callback(status, result); // socketio can handle json only (no error-objects)
    });

    socket.on('/api2/auth/usergallery/remove/remove/own', async (req, callback) => {
      const res = null;
      Object.assign(req || {}, { clientip: socket.clientip, }); // inject client-ip
      const {status, result} = await requireX('database/nedb/DBUserGallery').removeImageOwn(req, res); // thats the same API-Call like in ./routes/protected/index.js
      callback(status, result); // socketio can handle json only (no error-objects)
    });
    */

    /*
    socket.on('/api2/auth/userlocationtrail/get', async (req, callback) => {
      const res = null;
      Object.assign(req || {}, { clientip: socket.clientip, }); // inject client-ip
      const {status, result} = await requireX('database/nedb/DBUserLocationTrail').getUserLocationTrail(req, res); // thats the same API-Call like in ./routes/protected/index.js
      callback(status, result); // socketio can handle json only (no error-objects)
    });

    socket.on('/api2/auth/userlocationtrail/update/own', async (req, callback) => {
      const res = null;
      Object.assign(req || {}, { clientip: socket.clientip, }); // inject client-ip
      const {status, result} = await requireX('database/nedb/DBUserLocationTrail').updateUserLocationTrailOwn(req, res); // thats the same API-Call like in ./routes/protected/index.js
      callback(status, result); // socketio can handle json only (no error-objects)
    });
    */

    /*
    socket.on('/api2/auth/onlinestatus/get', async (req, callback) => {
      const res = null;
      Object.assign(req || {}, { clientip: socket.clientip, }); // inject client-ip
      const {status, result} = await requireX('database/nedb/DBOnline').getOnlineStatus(req, res); // thats the same API-Call like in ./routes/protected/index.js
      callback(status, result); // socketio can handle json only (no error-objects)
    });

    socket.on('/api2/auth/onlinestatus/update/own', async (req, callback) => {
      const res = null;
      Object.assign(req || {}, { clientip: socket.clientip, }); // inject client-ip
      const {status, result} = await requireX('database/nedb/DBOnline').updateOnlineStatus(req, res); // thats the same API-Call like in ./routes/protected/index.js
      callback(status, result); // socketio can handle json only (no error-objects)
    });
    */
  });
}; // of module.exports
