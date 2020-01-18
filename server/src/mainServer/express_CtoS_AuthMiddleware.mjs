import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);

export default function express_CtoS_AuthMiddleware(req, res, next) {
  //clog("TEST", process.env.HTTPS)

  next();
};
