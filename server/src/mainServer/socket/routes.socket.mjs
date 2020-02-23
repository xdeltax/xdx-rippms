import debuglog from "../../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import {unixtime,} from "../../tools/datetime.mjs";

// ===============================================
// all routes with "free/" and "auth/" are valid
// ===============================================

/*  req::
      timeclientout: new Date(), send with emit-call from client
      timeserverin:
      servername: "xxx",    identifier of nodejs-server -> injected by middleware
      database: {       all loaded databases        -> injected by middleware
        sbSockets: {},
        dbUsers: {},
        dbUsercards: {},
      },
      authSocket: {
        routeType: "auth" or "free",
        userid: valid_userid or null,
      }
    }
*/

const injectStats = (req, res) => {
  if (res && req) res.callstats = {
    timeclientout: req.timeclientout || null,// inject new Date() at (client)time the client sends the request to the server
    timeserverin : req.timeserverin || null, // inject new Date() at (server)time the server received the client-call
    timeserverout: unixtime(),               // inject new Date() at (server)time the server sends the result back to the client
  };
  return res;
}

// route:: auth/store/user/logout -> res = true
export const routeAuth_userLogout = async (req, clientEmitCallback) => {
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
    clientEmitCallback && clientEmitCallback(err, injectStats(req, res)); // callback to clients emit-function
  }
};

// route:: auth/store/userstore/get -> res = {userid: "xxx", user: {}, usercard: {}, }
export const routeAuth_userstoreGet = async (req, clientEmitCallback) => {
      const _getFullUserStore = async (req) => {
        const {
          database, timeserverin, authSocket, // injected by server
          timeclientout, targetuserid, userid, servertoken, // request from client
        } = req || {};
        const { dbUsers, dbUsercards, } = database || {};

        let res = {
          userid: userid,
          user: null,
          usercard: null,
        };

        // query user
        const {err, res: res_user} = await dbUsers.getUser(targetuserid, userid, servertoken);
        if (!err && res_user) {
          res.user = res_user;

          // query usercard
          const {err: err_usercard, res: res_usercard} = await dbUsercards.getUsercard(res_user.userid, res_user.userid, res_user.servertoken);
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
    clientEmitCallback && clientEmitCallback(err, injectStats(req, res)); // callback to clients emit-function
  }
};


// route:: auth/store/user/get -> res = user
export const routeAuth_userGet = async (req, clientEmitCallback) => {
  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    const {targetuserid, userid, servertoken, database,} = req || {};
    const {dbUsers, } = database || {};
    const {err: err_user, res: res_user} = await dbUsers.getUser(null, null, servertoken);
    ////////////////////////////////////////////////////////////////////////////
    err = err_user;
    res = res_user;
    ////////////////////////////////////////////////////////////////////////////
  } catch (error) {
    err = error.message; // convert Error-object to String
  } finally {
    clog("socket.on(auth/store/user/get):: ", err, res,);
    clientEmitCallback && clientEmitCallback(err, injectStats(req, res)); // callback to clients emit-function
  }
};


// route:: auth/store/user/update -> res = user
export const routeAuth_userUpdateProps = async (req, clientEmitCallback) => {
  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    const { targetuserid, userid, servertoken, database, props, } = req || {};
    const {dbUsers, } = database || {};
    const {err: err_user, res: res_user} = await dbUsers.updateProps(targetuserid, userid, servertoken, props);
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
    clientEmitCallback && clientEmitCallback(err, injectStats(req, res)); // callback to clients emit-function
  }
};


// route:: auth/store/usercard/get -> res = usercard
export const routeAuth_usercardGet = async (req, clientEmitCallback) => {
  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    const { targetuserid, userid, servertoken, database, } = req || {};
    const {dbUsercards, } = database || {};
    const {err: err_usercard, res: res_usercard} = await dbUsercards.getUsercard(targetuserid, userid, servertoken);
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
    clientEmitCallback && clientEmitCallback(err, injectStats(req, res)); // callback to clients emit-function
  }
};


// route:: auth/store/usercard/update -> res = usercard
export const routeAuth_usercardUpdateProps = async (req, clientEmitCallback) => {
  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    const { targetuserid, userid, servertoken, database, props, } = req || {};
    const {dbUsercards, } = database || {};
    const {err: err_usercard, res: res_usercard} = await dbUsercards.updateProps(targetuserid, userid, servertoken, props);
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
    clientEmitCallback && clientEmitCallback(err, injectStats(req, res)); // callback to clients emit-function
  }
};


// ===============================================
// all routes with "free/" and "auth/" are valid
// ===============================================
export const routeFree_testThis = async (req, clientEmitCallback) => {
  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    err = null;
    res = {
      test: "this is a simple feedback test",
    }
    ////////////////////////////////////////////////////////////////////////////
  } catch (error) {
    err = error.message; // convert Error-object to String
  } finally {
    clog("socket.on(free/test/this):: ", err, res);
    clientEmitCallback && clientEmitCallback(err, injectStats(req, res)); // callback to clients emit-function
  }
};
