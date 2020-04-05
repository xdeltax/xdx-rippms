import {} from './env.mjs';
import debuglog from "./debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import {datetime, datetimeUTC, unixtime,} from "./tools/datetime.mjs";
import {basepath, } from "./basepath.mjs";

import dbServer from "./dbServer/dbServer.mjs";

// ===============================================
// fallback if .env is missing :-)
// ===============================================
if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";
if (!process.env.SERVERTARGET) process.env.SERVERTARGET = "vps"; // default to server-url
if (!process.env.HTTPS) process.env.HTTPS = "true";

// server-port
if (!process.env.DBSERVER_PORT) 	process.env.DBSERVER_PORT = 3333;

// folder of database
if (!process.env.DATABASE_PATH) process.env.DATABASE_PATH = "database/";


// ===============================================
// print
// ===============================================
clog("app:: DATABASE-SERVER");
clog(`app:: server time (UNIX):: ${unixtime()}`);
clog(`app:: server time (LOC):: ${datetime()}`);
clog(`app:: server time (UTC):: ${datetimeUTC()}`);
clog("app:: ----------------------------------------");
clog("app:: process.env.NODE_ENV:: ", process.env.NODE_ENV);
clog("app:: process.env.SERVERTARGET:: ", process.env.SERVERTARGET);
clog("app:: process.env.HTTPS:: ", process.env.HTTPS);
clog("app:: process.env.NODE_PATH:: ", process.env.NODE_PATH);
clog("app:: ----------------------------------------");
clog('app:: process.version:: ', process.version);
clog("app:: process.env.NUMBER_OF_PROCESSORS:: ", process.env.NUMBER_OF_PROCESSORS);
clog("app:: ----------------------------------------");
clog("app:: process.env.DATABASE_PATH:: ", process.env.DATABASE_PATH);
clog("app:: process.env.DBSERVER_PORT:: ", process.env.DBSERVER_PORT);
clog("app:: ----------------------------------------");
clog("app:: basepath:: ", basepath);
clog("app:: import.meta.url:: ", import.meta.url);
clog("app:: ----------------------------------------");

// ===============================================
// start server(s)
// ===============================================
const starting = async () => {
  let res = [];

  clog("@@@ STARTING MAINSERVER!", );
  const portMainServer = await dbServer(process.env.DATABASE_PATH, process.env.DBSERVER_PORT);
  res.push(portMainServer);
  clog(`@@@ DB-SERVER RUNNING ON PORT ${portMainServer}`);

/*
  clog("@@@ index:: STARTING GAMESERVER!", );
  const portGameServer = await gameServer(process.env.GAMESERVER_PORT_HTTP);
  res.push(portGameServer);
  clog(`@@@ index:: GAMESERVER RUNNING ON PORT ${portGameServer}`);
*/

  return res;
}

starting()
.then(result => { clog("@@@ SERVERS RUNNING:: ", result); })
.catch(error => { clog("@@@ ERROR:: ", error); process.exit(1); });
