#!/usr/bin/env node
"use strict";
const path = require('path');

require("./globals")("main::");

// ===============================================
// load .env
// ===============================================
const dotenv = require('dotenv');
dotenv.config();   // autoincludes .env
//const envConfig = dotenv.parse(fs.readFileSync('.env.development.local')); for (const k in envConfig) { process.env[k] = envConfig[k]; } // override env

// ===============================================
// fallback if .env is missing :-)
// ===============================================
if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";
if (!process.env.SERVERTARGET) process.env.SERVERTARGET = "vps"; // default to server-url
if (!process.env.HTTPS) process.env.HTTPS = "true";

// server-port
if (!process.env.MAINSERVER_PORT_HTTP) 	process.env.MAINSERVER_PORT_HTTP = 8080;
if (!process.env.MAINSERVER_PORT_HTTPS) process.env.MAINSERVER_PORT_HTTPS= 8443;

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
process.env.PORT = process.env.HTTPS === "true" ? process.env.MAINSERVER_PORT_HTTPS : process.env.MAINSERVER_PORT_HTTP; // port and ip-address to listen to
process.env.GOOGLE_CALLBACK  = process.env.SERVERTARGET === "localhost" ? process.env.GOOGLE_CALLBACK_LOCALHOST  : process.env.GOOGLE_CALLBACK_VPSSERVER;
process.env.FACEBOOK_CALLBACK= process.env.SERVERTARGET === "localhost" ? process.env.FACEBOOK_CALLBACK_LOCALHOST: process.env.FACEBOOK_CALLBACK_VPSSERVER;

global.isPROD = Boolean(process.env.NODE_ENV === "production");


// ===============================================
// global-error-handlers
// ===============================================
process.on('unhandledRejection', (reason, p) => {
    //I just caught an unhandled promise rejection, since we already have fallback handler for unhandled errors (see below), let throw and let him handle that
    global.gerror("######## index.js:: xdx unhandledRejection:: ", reason);
    //process.exit(1);
    throw reason;
});

process.on('uncaughtException', (error) => {
    //I just received an error that was never handled, time to handle it and then decide whether a restart is needed
    global.gerror("######## index.js:: xdx uncaughtException:: ", error);
    //errorManagement.handler.handleError(error);
    //if (!errorManagement.handler.isTrustedError(error))
    process.exit(1);
});


require('./mainserver/mainApp.js')();
