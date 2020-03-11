//https://developerhandbook.com/passport.js/how-to-add-passportjs-facebook-strategy/
import {} from './env.mjs';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/*
import path from 'path';
import { fileURLToPath } from 'url';
export const __filename = fileURLToPath(import.meta.url);
export const baseDir = path.dirname(__filename);
require('app-module-path').addPath(baseDir);
*/
//import "app-module-path/register"; // import { addPath } from 'app-module-path'; addPath(__dirname);
//import "app-module-path/cwd"; //import { addPath } from 'app-module-path'; addPath(process.cwd());

import debuglog from "./debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import {datetime, datetimeUTC, unixtime,} from "./tools/datetime.mjs";
import {basepath, } from "./basepath.mjs";

require("nodejs-dashboard");

//import debug from "./tools/debug/node.js";
//var clog = require('debug')('xdxApp');

import gameServer from "./gameServer/gameServer.mjs";
import mainServer from "./mainServer/mainServer.mjs";

//import * as geohash from "./tools/geohash.mjs";
import {calcExponent, point2hash, hash2rect} from "./tools/geoHashIntegerV2.mjs";

// ===============================================
// fallback if .env is missing :-)
// ===============================================
if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";
if (!process.env.SERVERTARGET) process.env.SERVERTARGET = "vps"; // default to server-url
if (!process.env.HTTPS) process.env.HTTPS = "true";

// server-port
if (!process.env.MAINSERVER_PORT_HTTP) 	process.env.GAMESERVER_PORT_HTTP = 8080;
if (!process.env.MAINSERVER_PORT_HTTPS) process.env.GAMESERVER_PORT_HTTPS= 8443;
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
// autogenerate .env
// ===============================================
//process.env.HOST = "0.0.0.0"; // port and ip-address to listen to
process.env.MAINSERVER_PORT = process.env.HTTPS === "true" ? process.env.MAINSERVER_PORT_HTTPS : process.env.MAINSERVER_PORT_HTTP; // port and ip-address to listen to
process.env.GAMESERVER_PORT = process.env.GAMESERVER_PORT_HTTP; //process.env.HTTPS === "true" ? process.env.GAMESERVER_PORT_HTTPS : process.env.GAMESERVER_PORT_HTTP; // port and ip-address to listen to

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
clog("app:: import.meta.url:: ", import.meta.url);
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

  clog("@@@ index:: STARTING MAINSERVER!", );
  const portMainServer = await mainServer(process.env.MAINSERVER_PORT_HTTP);
  res.push(portMainServer);
  clog(`@@@ index:: MAINSERVER RUNNING ON PORT ${portMainServer}`);

/*
  clog("@@@ index:: STARTING GAMESERVER!", );
  const portGameServer = await gameServer(process.env.GAMESERVER_PORT_HTTP);
  res.push(portGameServer);
  clog(`@@@ index:: GAMESERVER RUNNING ON PORT ${portGameServer}`);
*/

  return res;
}



awaitServers()
.then(result => { clog("@@@ index:: SERVERS RUNNING:: ", result); })
.catch(error => { clog("@@@ index:: ERROR:: ", error); process.exit(1); });

/*
const mapXwidth = 1600000;
const mapYwidth = 200000;

const hashDivider = 4; // 2 to 8
const hashExponent = calcExponent(hashDivider, mapXwidth, mapYwidth); // dimXY needs to be fit power(divider, x) with x is an integer

const x = Math.floor(mapXwidth / 2);
const y = Math.floor(mapYwidth / 2);

let hash = point2hash(x, y, hashDivider, hashExponent); // '2AAAAAAAAADAAD' => divider 2; exponent = length(hash) = 13 -> maxDimXY = power(divider, exponent) = 2^13 = 8192 => ALLOWED MAP = 8192 x 8192
let rect = hash2rect(hash);

clog("mapXwidth::    ", mapXwidth);
clog("mapYwidth::    ", mapYwidth);
clog("hashDivider::  ", hashDivider, "2..8");
clog("hashExponent:: ", hashExponent, "(length of hash)");
clog("maxValidDimXY::", Math.pow(hashDivider, hashExponent), `(${hashDivider}^${hashExponent})`);
clog("x/y ::", x, y);
clog("hash::", hash.padEnd(hashExponent));
clog("rect::", rect);

rect = hash2rect(hash, 1); //clog("hash::", hash.slice(0,-1).padEnd(hashExponent+1), rect);
clog("rect::", rect);
rect = hash2rect(hash, 2); //clog("hash::", hash.slice(0,-2).padEnd(hashExponent+1), rect);
clog("rect::", rect);
rect = hash2rect(hash, 3); //clog("hash::", hash.slice(0,-3).padEnd(hashExponent+1), rect);
clog("rect::", rect);
*/

/*
let hashArray = [];
for (let y = 0; y < 1; y++) {
  for (let x = 0; x < 1; x++) {
    const hash = point2hash(x, y, hashDivider, hashExponent); // '2AAAAAAAAADAAD' => divider 2; exponent = length(hash) = 13 -> maxDimXY = power(divider, exponent) = 2^13 = 8192 => ALLOWED MAP = 8192 x 8192
    hashArray.push({x: x, y: y, hash: hash});
    clog("point2hash:: ", x, y, hash);
  }
}

for (let i = 0; i < hashArray.length; i++) {
  const hashObj = hashArray[i];
  //const hash = hashObj.hash;
  const hash = hashObj.hash.slice(0, -2); // strip last char
  const rect = hash2rect(hash);
  if (!rect) clog("ERROR:: ", hashObj)
  clog("hash2rect:: ", hashObj, rect);
  //if (hashObj.x !== rect.top || hashObj.y !== rect.left) clog("++++++");
  //clog("HASH:: ", deviderUsed, hash, rect, Math.round(rect.x), Math.round(rect.y));
}
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
