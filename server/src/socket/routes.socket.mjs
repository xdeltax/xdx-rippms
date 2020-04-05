import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import {unixtime,} from "../tools/datetime.mjs";
import {injectStats} from "./injectStats.mjs";


// ===============================================
// all routes with "free/" and "auth/" are valid
// ===============================================

/*  req::
      _timeclientout: new Date(), send with emit-call from client
      _timeserverin:
      _servername: "xxx",    identifier of nodejs-server -> injected by middleware
      _database: {       all loaded databases        -> injected by middleware
        dbSockets: {},
        dbUsers: {},
        dbUsercards: {},
      },
      _authSocket: {
        routeType: "auth" or "free",
        userid: valid_userid or null,
      }
    }
*/

export default async function routesSocket_userAPI(socket, packet, next) {
  socket.on('free/test/server', routeFree_testServerResponse);
  // user
  socket.on('auth/user/logout', routeAuth_userLogout);

  return next();
}



const routeFree_testServerResponse = async (req, clientEmitCallback) => {
  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    const { text, clienttime } = req;
    ////////////////////////////////////////////////////////////////////////////
    err = null;
    res = {
      status: "serverresponse",
      clienttext: text,
      clienttime: clienttime,
      servertime: unixtime(),
    }
    ////////////////////////////////////////////////////////////////////////////
  } catch (error) {
    err = error.message; // convert Error-object to String
  } finally {
    clog("socket.on(routeFree_testServerResponse):: ", err, res);
    clientEmitCallback && clientEmitCallback(err, _injectStats(req, res)); // callback to clients emit-function
  }
};


// route:: auth/user/logout -> res = true
const routeAuth_userLogout = async (req, clientEmitCallback) => {
  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    const { targetuserid, userid, servertoken, } = req || {};
    ////////////////////////////////////////////////////////////////////////////
    err = null
    res = {
      result: true
    };
    ////////////////////////////////////////////////////////////////////////////
  } catch (error) {
    err = error.message; // convert Error-object to String
  } finally {
    clog("socket.on(auth/store/user/logout)::2:: ", req, err, res,);
    clientEmitCallback && clientEmitCallback(err, _injectStats(req, res)); // callback to clients emit-function
  }
};











// route:: auth/store/userstore/get -> res = {userid: "xxx", user: {}, usercard: {}, }
const routeAuth_userstoreGet = async (req, clientEmitCallback) => {
      const _getFullUserStore = async (req) => {
        const {
          _database, _authSocket, // injected by server
          targetuserid, userid, servertoken, // request from client
        } = req || {};
        const { dbUsers, dbUsercards, } = _database || {};

        let res = {
          userid: userid,
          user: null,
          usercard: null,
        };

        // query user
        const {err, res: res_user} = await dbUsers.get(targetuserid, userid, servertoken);
        if (!err && res_user) {
          res.user = res_user;

          // query usercard
          const {err: err_usercard, res: res_usercard} = await dbUsercards.get(res_user.userid, res_user.userid, res_user.servertoken);
          if (!err_usercard) res.usercard = res_usercard;
        }
        return {err: err, res: res};
      };

  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    clog("socket.on(auth/store/userstore/get):: ", req,);
    const {err: err_store, res: res_store} = await _getFullUserStore(req);
    ////////////////////////////////////////////////////////////////////////////
    err = err_store;
    res = res_store;
    ////////////////////////////////////////////////////////////////////////////
  } catch (error) {
    err = error.message; // convert Error-object to String
  } finally {
    clog("socket.on(auth/store/userstore/get):: ", err, res,);
    // route:: auth/store/userstore/get -> res = {userid: "xxx", user: {}, usercard: {}, }
    clientEmitCallback && clientEmitCallback(err, _injectStats(req, res)); // callback to clients emit-function
  }
};


// route:: auth/store/user/get -> res = user
const routeAuth_userGet = async (req, clientEmitCallback) => {
  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    const { targetuserid, userid, servertoken, _database } = req || {};
    const { dbUsers, } = _database || {};
    const { err: err_user, res: res_user } = await dbUsers.get(null, null, servertoken);
    ////////////////////////////////////////////////////////////////////////////
    err = err_user;
    res = res_user;
    ////////////////////////////////////////////////////////////////////////////
  } catch (error) {
    err = error.message; // convert Error-object to String
  } finally {
    clog("socket.on(auth/store/user/get):: ", err, res,);
    clientEmitCallback && clientEmitCallback(err, _injectStats(req, res)); // callback to clients emit-function
  }
};


// route:: auth/store/user/update -> res = user
const routeAuth_userUpdateProps = async (req, clientEmitCallback) => {
  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    const { targetuserid, userid, servertoken, _database, props, } = req || {};
    const { dbUsers, } = _database || {};
    const { err: err_user, res: res_user } = await dbUsers.updateProps(targetuserid, userid, servertoken, props);
    ////////////////////////////////////////////////////////////////////////////
    err = err_user;
    res = {
      user: res_user,
    };
    ////////////////////////////////////////////////////////////////////////////
  } catch (error) {
    err = error.message; // convert Error-object to String
  } finally {
    clog("socket.on(auth/store/user/update):: ", err, res);
    clientEmitCallback && clientEmitCallback(err, _injectStats(req, res)); // callback to clients emit-function
  }
};


// route:: auth/store/usercard/get -> res = usercard
const routeAuth_usercardGet = async (req, clientEmitCallback) => {
  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    const { targetuserid, userid, servertoken, _database, } = req || {};
    const { dbUsercards, } = _database || {};
    const { err: err_usercard, res: res_usercard } = await dbUsercards.get(targetuserid, userid, servertoken);
    ////////////////////////////////////////////////////////////////////////////
    err = err_usercard;
    res = {
      usercard: res_usercard,
    };
    ////////////////////////////////////////////////////////////////////////////
  } catch (error) {
    err = error.message; // convert Error-object to String
  } finally {
    clog("socket.on(auth/store/usercard/get):: ", err, res);
    clientEmitCallback && clientEmitCallback(err, _injectStats(req, res)); // callback to clients emit-function
  }
};


// route:: auth/store/usercard/update -> res = usercard
const routeAuth_usercardUpdateProps = async (req, clientEmitCallback) => {
  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    const { targetuserid, userid, servertoken, _database, props, } = req || {};
    const { dbUsercards, } = _database || {};
    const { err: err_usercard, res: res_usercard } = await dbUsercards.updateProps(targetuserid, userid, servertoken, props);
    ////////////////////////////////////////////////////////////////////////////
    err = err_usercard;
    res = {
      usercard: res_usercard,
    };
    ////////////////////////////////////////////////////////////////////////////
  } catch (error) {
    err = error.message; // convert Error-object to String
  } finally {
    clog("socket.on(auth/store/user/update):: ", err, res);
    clientEmitCallback && clientEmitCallback(err, _injectStats(req, res)); // callback to clients emit-function
  }
};


/*
socket.on('auth/user/get/full', async (req, clientEmitCallback) => {
  clog("socket.on(auth/user/get/full):: ", req,);
  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    //const {err: err_store, res: res_store} = await _getFullUserStore(req);
    const {
      _database, _timeserverin, _authSocket, // injected by server
      timeclientout, targetuserid, userid, servertoken, // request from client
    } = req || {};
    const { dbUsers, dbUsercards, } = _database || {};
    ////////////////////////////////////////////////////////////////////////////
    res = {
      userid: userid,
      user: null,
      usercard: null,
    };
    // query user
    const {err: err_user, res: res_user} = await dbUsers.get(targetuserid, userid, servertoken);
    err = err_user;
    if (!err_user && res_user) {
      res.user = res_user;
      // query usercard
      const {err: err_usercard, res: res_usercard} = await dbUsercards.get(res_user.userid, res_user.userid, res_user.servertoken);
      if (!err_usercard) res.usercard = res_usercard;
    }
    ////////////////////////////////////////////////////////////////////////////
    return {err: err, res: res};
    ////////////////////////////////////////////////////////////////////////////
  } catch (error) {
    err = error.message; // convert Error-object to String
  } finally {
    clog("socket.on(auth/store/userstore/get):: ", err, res,);
    // route:: auth/store/userstore/get -> res = {userid: "xxx", user: {}, usercard: {}, }
    clientEmitCallback && clientEmitCallback(err, _injectStats(req, res)); // callback to clients emit-function
  }
});
*/
