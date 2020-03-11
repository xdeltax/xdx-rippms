import store from "store";
import socketio from 'api/socket'; // socket

// called by store.gamemap.updatecheckMapGroundlayer();
export const updatecheckMapGroundLayer = async () => {
  let res = null;
  let err = null;
  try {
    const ioRoute = "free/game/map/check/update";
    const req = {
      mapid: store.gameMap.tilemap.mapid,
      width: store.gameMap.tilemap.width,
      height: store.gameMap.tilemap.height,
      updatedAt: store.gameMap.tilemap.updatedAt,
    }
    res = await socketio.emitWithTimeout(ioRoute, req,);
    // res = { result: true / false, _callstats: {xxx}, }
  } catch (error) {
    err = error;
  } finally {
    global.log("gameMapAPI:: updatecheckMapGroundLayer:: ", err, res)
    return { err: err, res: res };
  }
};
