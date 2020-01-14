import {} from './env.mjs';
import {clog, } from "./tools/consoleLog.mjs";
import {basepath, } from "./basepath.mjs";
import {datetime, datetimeUTC, unixtime,} from "./tools/datetime.mjs";

import gameServer from "./gameServer.mjs";
//import mainServer from "./mainServer.mjs";

//import * as geohash from "./tools/geohash.mjs";
import GeoHash from "./tools/GeoHash.mjs";

// ===============================================
// fallback if .env is missing :-)
// ===============================================
if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";
if (!process.env.SERVERTARGET) process.env.SERVERTARGET = "vps"; // default to server-url
if (!process.env.HTTPS) process.env.HTTPS = "true";

// server-port
if (!process.env.GAMESERVER_PORT_HTTP) 	process.env.GAMESERVER_PORT_HTTP = 2052;
if (!process.env.GAMESERVER_PORT_HTTPS) process.env.GAMESERVER_PORT_HTTPS= 2053;

// folder of nedb-database
if (!process.env.DATABASE_NEDB) process.env.DATABASE_NEDB = "0600.database/nedb/"; // basepath: ./

// socket-io
if (!process.env.SOCKETIO_HANDSHAKEVERSION) process.env.SOCKETIO_HANDSHAKEVERSION = 10000;

// server-secret for tokens
if (!process.env.JWT_SECRET_PASSWORD) process.env.JWT_SECRET_PASSWORD = "veryVerySecretMessageToEncodeT3eJWTs!";

// session-secret
if (!process.env.SESSION_SECRET) process.env.SESSION_SECRET = "veryVerySecret" + new Date()/1000;

// folder of pictures uploaded from socket.io-connection with client
if (!process.env.ASSETS_SUBFOLDER_IMAGES) process.env.ASSETS_SUBFOLDER_IMAGES = "assets/uploaded/"; // basepath: ./src/
if (!process.env.ASSETS_SUBFOLDER_GALLERY) process.env.ASSETS_SUBFOLDER_GALLERY = "assets/imagegallery/"; // basepath: ./src/

// ===============================================
// eval .env
// ===============================================
//process.env.HOST = "0.0.0.0"; // port and ip-address to listen to
process.env.PORT = process.env.HTTPS === "true" ? process.env.GAMESERVER_PORT_HTTPS : process.env.GAMESERVER_PORT_HTTP; // port and ip-address to listen to
process.env.GOOGLE_CALLBACK  = process.env.SERVERTARGET === "localhost" ? process.env.GOOGLE_CALLBACK_LOCALHOST  : process.env.GOOGLE_CALLBACK_VPSSERVER;
process.env.FACEBOOK_CALLBACK= process.env.SERVERTARGET === "localhost" ? process.env.FACEBOOK_CALLBACK_LOCALHOST: process.env.FACEBOOK_CALLBACK_VPSSERVER;

// ===============================================
// print
// ===============================================
clog("app:: ########################################");
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
clog("app:: process.env.FACEBOOK_CALLBACK:: ", process.env.FACEBOOK_CALLBACK);
clog("app:: process.env.GOOGLE_CALLBACK:: ", process.env.GOOGLE_CALLBACK);
clog("app:: ----------------------------------------");
clog("app:: basepath:: ", basepath);
clog("app:: ----------------------------------------");

// ===============================================
// start server(s)
// ===============================================
/*
// start async
gameServer()
.then(result => { clog("app:: index:: gameServer:: RESULT:: ", result); })
.catch(error => { clog("app:: index:: gameServer:: ERROR:: ", error); });

mainServer()
.then(result => { clog("app:: index:: mainServer:: RESULT:: ", result); })
.catch(error => { clog("app:: index:: mainServer:: ERROR:: ", error); });
*/

const awaitServers = async () => {
  let res = [];

  clog("index:: STARTING GAMESERVER!", );
  const portGameServer = await gameServer();
  res.push(portGameServer);
  clog(`index:: GAMESERVER RUNNING ON PORT ${portGameServer}`);
  /*
  clog("index:: STARTING MAINSERVER!", );
  const portMainServer = await mainServer();
  res.push(portMainServer);
  clog(`index:: MAINSERVER RUNNING ON PORT ${portMainServer}`);
  */
  return res;
}



clog("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")

const mapwidth = 30; // needs to be an integer factor of divider
const mapheight= 10; // needs to be an integer factor of divider
const divider = undefined; // hash-base = sqr(divider); 3: 3 x 3 = 9 tiles; divider = undefined -> autodetect
const digits = 1; // 0: integer only; 3: target resolution x.xxx; digits = undefined -> 0
const geohash = new GeoHash(mapwidth, mapheight, digits, divider);
const deviderUsed = geohash.divider;
const hash = geohash.getHashFromPoint(7,8)
const rect = geohash.getRectFromHash(hash);
clog("HASH:: ", deviderUsed, hash, rect, Math.round(rect.x), Math.round(rect.y));
//clog("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
//const gHash = geohash.getHashFromXY(0,0, 0,0, 100,100, 3) // (x, y, minX, minY, maxX, maxY, divider)
//clog("GHASH:: ", gHash);
/*
awaitServers()
.then(result => { clog("index:: SERVERS RUNNING:: ", result); })
.catch(error => { clog("index:: ERROR:: ", error); });
*/














/*
const path = require('path');
const child_process = require('child_process');
const fork = require('child_process').fork;

const childLoginServer = child_process.execFileSync( path.resolve('./src/mainIndex.js') );

const doWithTimeout = (_func, _timeout) => {
  const _timer = setTimeout(() => {
    clearTimeout(_timer);
    _func;
  }, _timeout || 5000);
}

const childGameServer = doWithTimeout( child_process.execFileSync( path.resolve('./src/gameIndex.js') ) );
*/
