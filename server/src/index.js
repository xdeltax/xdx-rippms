#!/usr/bin/env node
"use strict";
require('dotenv').config();   // autoincludes .env

// fallback if .env is missing :-)
if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
// server-port
if (!process.env.PORT) process.env.PORT = 8080;
if (!process.env.HTTPS) process.env.HTTPS = false;

// folder of pictures uploaded from socket.io-connection with client
if (!process.env.ASSETS_SUBFOLDER_IMAGES) process.env.ASSETS_SUBFOLDER_IMAGES = "assets/uploaded"; // basepath: ./src/
//
if (!process.env.ASSETS_SUBFOLDER_GALLERY) process.env.ASSETS_SUBFOLDER_GALLERY = "assets/imagegallery"; // basepath: ./src/
// folder of nedb-database
if (!process.env.DATABASE_NEDB) process.env.DATABASE_NEDB = "database/nedb/"; // basepath: ./
// server-secret for tokens
if (!process.env.JWT_SECRET_PASSWORD) process.env.JWT_SECRET_PASSWORD = "veryVerySecretMessageToEncodeT3eJWTs!";


////////////////////////////////////////////////////////////////////////////////
// global.app-config
//
global.APPCONFIG_HANDSHAKEPROTOCOLVERSION = 10000; // v1.00.00
//
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// global debug-vars
global.DEBUG_DISABLE_REQUIREFACEBOOKTOLOGIN = false;
global.DEBUG_DISABLE_REQUIRESERVERTOKEN = false; // used in routes/socketio
global.DEBUGMODE_MOCK_A_USER = false;
//                                                                            //
////////////////////////////////////////////////////////////////////////////////


const appENV = process.env;
const numCPU = appENV.NUMBER_OF_PROCESSORS;

// global-helpers
global.base_dir = __dirname;
global.abs_path = (p) => { return require('path').join(global.base_dir, p) } // abs_path('lib/Utils.js');
global.requireX = (f) => { return require(abs_path('/' + f)) } // instead of: require('../../../lib/Utils.js'); -> requireX('lib/Utils.js');

global.getRandomInt = (max) => { return Math.floor(Math.random() * Math.floor(max)); }
global.absRandom = (max) => Math.floor(max*Math.random());
global.randomHash = () => "hash"+Math.floor(100000000*Math.random());

global.now = () => new Date().toLocaleTimeString();

global.ddd = requireX('tools/debug/ddd');
global.iii = requireX('tools/debug/iii'); // usage:: iii(object, depth)
global.log = ( ...restArgs ) => { ddd(global.now(), restArgs); };
global.debug = ( ...restArgs ) => { ddd(global.now(), restArgs); };


process.on('unhandledRejection', (reason, p) => {
    //I just caught an unhandled promise rejection, since we already have fallback handler for unhandled errors (see below), let throw and let him handle that
    console.error("######## index.js:: xdx unhandledRejection:: ", reason);
    //process.exit(1);
    throw reason;
});

process.on('uncaughtException', (error) => {
    //I just received an error that was never handled, time to handle it and then decide whether a restart is needed
    console.error("######## index.js:: xdx uncaughtException:: ", error);
    //errorManagement.handler.handleError(error);
    //if (!errorManagement.handler.isTrustedError(error))
    process.exit(1);
});

const app = require('./app');
app();
