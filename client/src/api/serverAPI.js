//import store from "store";
import socketio from 'api/socket'; // socket
import {unixtime} from "tools/datetime";

export const testServerResponse = async (text, userid, servertoken) => {
  let res = null;
  let err = null;
  try {
    const ioRoute = "free/test/server";
    const req = {
      targetuserid: userid,
      userid: userid,
      servertoken: servertoken,
      text : text,
      clienttime: unixtime(),
    }

    res = await socketio.emitWithTimeout(ioRoute, req);
    // res = { result: true / false, _callstats: {xxx}, }
  } catch (error) {
    err = error;
  } finally {
    global.log("userAPI:: callTestRoute:: ", userid, err, res)
    return { err: err, res: res };
  }
};
