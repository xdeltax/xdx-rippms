import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import {unixtime} from "../tools/datetime.mjs";
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
  socket.on('free/game/map/check/update', routeFree_updatecheckMapGroundLayer);

  return next();
}


const routeFree_updatecheckMapGroundLayer = async (req, clientEmitCallback) => {
  let err = "undefined";
  let res = null;
  try {
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    const { mapid, width, height, updatedAt, _database } = req || {}; // map-data stored on client
    const { dbUsers, } = _database || {};
    const { err: err_user, res: res_user } = await dbMaps.get(null, null, null);
    ////////////////////////////////////////////////////////////////////////////
    err = err_user;
    res = res_user;
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
    clientEmitCallback && clientEmitCallback(err, injectStats(req, res)); // callback to clients emit-function
  }
}
