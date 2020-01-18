import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import {datetime, datetimeUTC, unixtime,} from "../tools/datetime.mjs";

// ===============================================
// route: catch-all:: redirect everthing else (except the things before this command like /images /gallery /api ..)
// ===============================================
export default function expressRoute_CatchAll(req, res) {
  const obj = {
    text: "mainServer",
    unixtime: unixtime(),
    servertimeLOC: datetime(),
    servertimeUTC: datetimeUTC(),
    route: req.route,
    query: req.query,
    headers: req.headers,
    body: req.body,
    upgrade: req.upgrade,
  };

  //clog("route access:: ", obj)
  res.status(200).type('json').send(JSON.stringify(obj, null, 4));
  //res.status(200).json(obj);
  //res.status(404).end();
};
