import {clog, } from "../tools/consoleLog.mjs";

export default function express_CtoS_AuthMiddleware(req, res, next) {
  //clog("TEST", process.env.HTTPS)

  next();
};
