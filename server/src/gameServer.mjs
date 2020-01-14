//import { createRequire } from 'module';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
//import morgan from 'morgan';
import socketio from 'socket.io';
import session from 'express-session';
import nedbStore from 'nedb-session-store';
import http from 'http';

//import fse from 'fs-extra';
//import path from 'path';

import {clog, } from "./tools/consoleLog.mjs";

import DBUsers from './nedb/DBUsers.mjs';
import DBSockets from './nedb/DBSockets.mjs';
import DBUsercards from './nedb/DBUsercards.mjs';

import expressAuthMiddleware from "./gameServer/expressAuthMiddleware.mjs";
import expressRoute_CatchAll from "./gameServer/expressRoute_CatchAll.mjs";

import socketioAuthMiddleware from "./gameServer/socketioAuthMiddleware.mjs";
import socketioRoutes from "./gameServer/socketioRoutes.mjs";

import Game from "./gameServer/Game.mjs";


export default async function gameApp() {
  // ===============================================
  // DATABASE: load
  // ===============================================
  const dbSockets = new DBSockets();
  const dbUsers = new DBUsers();
  const dbUsercards = new DBUsercards();

  clog("app:: nedb:: loading Sockets... ", );
  await DBSockets.loadDatabase();

  clog("app:: nedb:: loading DBUsers... ", );
  await DBUsers.loadDatabase();

  clog("app:: nedb:: loading DBUsercards... ", );
  await DBUsercards.loadDatabase();

  clog("app:: nedb:: DBSockets count:", await DBSockets.count());
  clog("app:: nedb:: DBUsers count:", await DBUsers.count());
  clog("app:: nedb:: DBUsercards count:", await DBUsercards.count());


  // ===============================================
  // EXPRESS: init
  // ===============================================
  const app = express();


  // ===============================================
  // WEBSERVER: config the (internal) webserver to http only
  // ===============================================
  const server = http.createServer(app);


  // ===============================================
  // SOCKETIO: initialize the WebSocket server instance
  // ===============================================
  const io = socketio.listen(server);	// connect sockets to the server


  // ===============================================
  // SESSIONSTORE: init
  // ===============================================
  const NedbStore = nedbStore(session);


  // ===============================================
  // EXPRESS: middleware
  // ===============================================
  app.use(cors());                // enable all CORS requests
  app.use(helmet());              // enhance your app security with Helmet
  //app.use(morgan('combined'));    // log HTTP requests


  // ===============================================
  // ESPRESS: upload-limit
  // ===============================================
  app.use(bodyParser.json({limit: '50mb'}));                        // allow 50mb in post for imageupload; use bodyParser to support JSON-encoded bodies -> to parse application/json content-type
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));  // allow 50mb in post for imageupload; to support URL-encoded bodies


  // ===============================================
  // EXPRESS: middleware for every new socket-connect
  // ===============================================
  app.use(expressAuthMiddleware);


  // ===============================================
  // EXPRESS: route catch-all:: redirect everthing else (except the things before this command like /images /gallery /api ..)
  // ===============================================
  app.get('/*', expressRoute_CatchAll);
  app.get('/socket.io', (req, res, next) => { res.status(200).end(); });


  // ===============================================
  // EXPRESS: middleware - error handling
  // ===============================================
  app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') { // Send the error rather than to show it on the console
      res.status(401).send(err);
    } else {
      next(err);
    }
  });


  // ===============================================
  // SCOKETIO: middleware for every new socket-connect
  // ===============================================
  io.use(socketioAuthMiddleware);


  // ===============================================
  // WEBSERVER: start the server by listening to port
  // ===============================================
  const startServerPromise = (port, host) => {
    return new Promise( (resolve, reject) => {
      try {
        server.listen(port, /*host,*/ () => { // port and ip-address to listen to
          clog('app:: server running on port ',port);

          // ===============================================
          // SOCKETIO: new socket connect -> routes
          // ===============================================
          io.on('connection', socketioRoutes);

          // ===============================================
          // GAME: endless loop
          // ===============================================
          let game = new Game(/*fps*/150, /*runGameloopForSec*/5); // max fps is about 58 to 62 fps on windows

          // game-events
          game.onStart = () => {
            clog("GAME STARTED.");
          }
          game.onStop = () => {
            clog("GAME STOPPED.");
            game = null;
          }

          // start game after asnyc init and preload finished
          game.init().then(game.preload).then(game.start);

          // Here we send the ready signal to PM2
          //process.send('ready');
          resolve(port);
        });
      } catch (error) {
         reject(error);
      }
    });
  }

  const port = await startServerPromise(process.env.PORT || 8080, );

  //clog(`app:: *** modtime loginserver app.js:: ${fse.statSync(global.abs_path("gameserver/gameApp.js")).mtime}`);

  return port;
};
