import debuglog from "../../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);

// ===============================================
// all routes with "free/" and "auth/" are valid
// ===============================================

/*  req::
      server: "xxx",    identifier of nodejs-server -> injected by middleware
      database: {       all loaded databases        -> injected by middleware
        sbSockets: {},
        dbUsers: {},
        dbUsercards: {},
      },
*/

// route:: auth/store/user/logout -> res = true
export const routeAuth_userLogout = async (req, clientEmitCallback) => {
  const { targetuserid, userid, servertoken, } = req || {};
  clog("socket.on(auth/store/user/logout)::1:: ", req, );
  const err = null, res = true;
  clog("socket.on(auth/store/user/logout)::2:: ", err, res,);
  clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
};


// route:: auth/store/userstore/get -> res = {userid: "xxx", user: {}, usercard: {}, }
export const routeAuth_userstoreGet = async (req, clientEmitCallback) => {
  const _getFullUserStore = async (req) => {
    const { targetuserid, userid, servertoken, database, } = req || {};
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

  clog("socket.on(auth/store/userstore/get):: ", req,);
  const {err, res} = await _getFullUserStore(req);
  clog("socket.on(auth/store/userstore/get):: ", err, res.userid,);

  // route:: auth/store/userstore/get -> res = {userid: "xxx", user: {}, usercard: {}, }
  clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
};


// route:: auth/store/user/get -> res = user
export const routeAuth_userGet = async (req, clientEmitCallback) => {
  const { targetuserid, userid, servertoken, database, } = req || {};
  const {dbUsers, } = database || {};
  const {err, res} = await dbUsers.getUser(targetuserid, userid, servertoken);
  clog("socket.on(auth/store/user/get):: ", err, res.userid,);
  clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
};


// route:: auth/store/user/update -> res = user
export const routeAuth_userUpdateProps = async (req, clientEmitCallback) => {
  const { targetuserid, userid, servertoken, database, props, } = req || {};
  const {dbUsers, } = database || {};
  const {err, res} = await dbUsers.updateProps(targetuserid, userid, servertoken, props);
  clog("socket.on(auth/store/user/update):: ", err, res.userid);
  clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
};


// route:: auth/store/usercard/get -> res = usercard
export const routeAuth_usercardGet = async (req, clientEmitCallback) => {
  const { targetuserid, userid, servertoken, database, } = req || {};
  const {dbUsercards, } = database || {};
  const {err, res} = await dbUsercards.getUsercard(targetuserid, userid, servertoken);
  clog("socket.on(auth/store/usercard/get):: ", err, res.userid);
  clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
};


// route:: auth/store/usercard/update -> res = usercard
export const routeAuth_usercardUpdateProps = async (req, clientEmitCallback) => {
  const { targetuserid, userid, servertoken, database, props, } = req || {};
  const {dbUsercards, } = database || {};
  const {err, res} = await dbUsercards.updateProps(targetuserid, userid, servertoken, props);
  clog("socket.on(auth/store/user/update):: ", err, res.userid);
  clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
};


// ===============================================
// all routes with "free/" and "auth/" are valid
// ===============================================
export const routeFree_testThis = async (req, clientEmitCallback) => {
  const err = null;
  const res = { test: "this", };
  clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
};
