//import { createRequire } from 'module';
import fse from 'fs-extra';
import path from 'path';

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
//import morgan from 'morgan';
import requestIp from 'request-ip';
import socketio from 'socket.io';
import session from 'express-session';
import nedbStore from 'nedb-session-store';
import http from 'http';
import https from 'https';

import passport from 'passport';

import crypto from 'crypto';
import Joi from '@hapi/joi';


import * as jwt from '../tools/jwt.mjs';
import joiValidateFallback from '../tools/joiValidateFallback.mjs';

import {clog, } from "../tools/consoleLog.mjs";
import {unixtime,} from "../tools/datetime.mjs";
import {abs_path, } from "../basepath.mjs";

import {isERROR, isSUCCESS, } from "../tools/isErrorIsSuccess.mjs";

import DBUsers from '../nedb/DBUsers.mjs';
import DBSockets from '../nedb/DBSockets.mjs';
import DBUsercards from '../nedb/DBUsercards.mjs';

import {passportFacebookStrategy, passportGoogleStrategy, passportFacebookAuth, passportGoogleAuth, passportInjectSession, passportAuthCallback, } from "./passport_CtoS_ProviderAuth.mjs";

import ServerToServerSocketIOClient from "./ServerToServerSocketIOClient.mjs";

import express_CtoS_AuthMiddleware from "./express_CtoS_AuthMiddleware.mjs";
import express_CtoS_Route_CatchAll from "./express_CtoS_Route_CatchAll.mjs";

import socketio_CtoS_AuthMiddleware from "./socketio_CtoS_AuthMiddleware.mjs";
import socketio_CtoS_ClientRoutes from "./socketio_CtoS_ClientRoutes.mjs";


const joi_userid = 			Joi.string().alphanum().min(30).max(50).normalize();
const joi_servertoken =	Joi.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/).min(30).max(499).normalize();


export default async function gameApp(tryPort) {
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
  // WEBSERVER: config the webserver http or https
  // ===============================================
  if (process.env.HTTPS === "false") {
    fse.ensureDirSync(path.dirname(abs_path("../" + process.env.SSLCERT_KEY)), { mode: 0o0600, });
    fse.ensureDirSync(path.dirname(abs_path("../" + process.env.SSLCERT_PEM)), { mode: 0o0600, });
  };

  const sslcert = {
    key: fse.readFileSync(abs_path("../" + process.env.SSLCERT_KEY)), //'./ssl/xdeltax_xyz_cloudflare_cert.key')), // ssl_key private key
    cert:fse.readFileSync(abs_path("../" + process.env.SSLCERT_PEM)), //'./ssl/xdeltax_xyz_cloudflare_cert.pem')), // ssl_cert
  };

  const server = (process.env.HTTPS === "false") ? http.createServer(app) : https.createServer(sslcert, app);


  // ===============================================
  // SOCKETIO: initialize the WebSocket server instance
  // ===============================================
  const io = socketio.listen(server);	// connect sockets to the server


  // ===============================================
  // SESSIONSTORE: init
  // ===============================================
  const NedbStore = nedbStore(session);

  app.use(session({ // nedb-session-store
 		secret: process.env.SESSION_SECRET || "somethingtohide" + unixtime(),
    resave: false,
    saveUninitialized: false,
    cookie: { path: '/', httpOnly: true, maxAge: 24 * 3600 * 1000 }, // 24 hours
    store: new NedbStore({
    	filename: abs_path(path.join("../" + process.env.DATABASE_NEDB, "session.txt")),
    }),
    autoCompactInterval: 1 * 3600 * 1000, // 1 hour
	}));


  // ===============================================
  // EXPRESS: security
  // ===============================================
  app.use(cors());                // enable all CORS requests
  app.use(helmet());              // enhance your app security with Helmet
  //app.use(morgan('combined'));    // log HTTP requests


  // ===============================================
  // ESPRESS: upload-limit
  // ===============================================
  app.use(bodyParser.json({limit: '50mb'}));                        // allow 50mb in post for imageupload; use bodyParser to support JSON-encoded bodies -> to parse application/json content-type
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));  // allow 50mb in post for imageupload; to support URL-encoded bodies

  //app.use(express.json())

  // ===============================================
  // EXPRESS: client-IP:: get IP of client and inject in res.clientip
  // ===============================================
  app.use(requestIp.mw({ attributeName : 'clientip' })) // inject ip to res.clientip


  // ===============================================
  // EXPRESS: inject something to req
  // ===============================================
  app.use((req, res, next) => {
    //console.log('inject to res');
    req.server = 'mainServerWasHere';
    return next();
  });


  // ===============================================
  // EXPRESS: middleware for every new socket-connect
  // ===============================================
  app.use(express_CtoS_AuthMiddleware);


  //https://developerhandbook.com/passport.js/how-to-add-passportjs-facebook-strategy/
  //https://github.com/scopsy/await-to-js#readme

  // ===============================================
  // PASSPORT:: init
  // ===============================================
	// Initialize Passport and restore authentication state, if any, from the session.
	app.use(passport.initialize());

  // *** Configure Passport authenticated session persistence
  // In order to restore authentication state across HTTP requests, Passport needs
  // to serialize users into and deserialize users out of the session.  In a
  // production-quality application, this would typically be as simple as
  // supplying the user ID when serializing, and querying the user record by ID
  // from the database when deserializing.  However, due to the fact that this
  // example does not have a database, the complete Facebook profile is serialized
  // and deserialized.
  /*
  app.use(passport.session());
  passport.serializeUser((user, cb) => { return cb(null, user) });
  passport.deserializeUser((obj, cb) => { cb(null, obj) });
  */

  // ===============================================
  // PASSPORT: use stagegies
  // ===============================================
  passport.use(passportFacebookStrategy);
  passport.use(passportGoogleStrategy);


  // ===============================================
  // PASSPORT: REST-API triggerd by client-call
  // ===============================================
	app.get('/facebook.io', passportInjectSession, passportFacebookAuth); // call from client: http://localhost/facebook.io?socketid=
	app.get('/google.io'	, passportInjectSession, passportGoogleAuth); // call from client: http://localhost/google.io?socketid=
	//app.get('/local.io'	, passportInjectSession, passportLocalAuth, (req, res) => { res.redirect("/local.io.callback") }); // call from client: http://localhost/fingerprint.io?socketid=xxx&fp=xxx


  // ===============================================
  // PASSPORT: REST-API:: callback triggerd by oauth-provider
  // ===============================================
	app.get('/facebook.io.callback', passportFacebookAuth, passportAuthCallback); // callback from provider
	app.get('/google.io.callback'	 , passportGoogleAuth  , passportAuthCallback); // callback from provider
	//app.get('/local.io.callback' , passportLocalAuth   , passportAuthCallback); // callback from provider


  // ===============================================
  // EXPRESS: route socket.io (reserved for handshake)
  // ===============================================
  app.get('/socket.io', (req, res, next) => { res.status(200).end(); });

  // ===============================================
  // route: static images:: serve images in assets-directory at asset-path ("https://node-server.path/assets/") of this node-server
  // ===============================================
  /*
  const path2uploads= global.abs_path("../" + process.env.FOLDER_UPLOADS); //path.join(__dirname, '..', 'uploads');
  const path2assets = global.abs_path("../" + process.env.FOLDER_ASSETS); //path.join(__dirname, process.env.ASSETS_SUBFOLDER_GALLERY);
  global.log("app:: static serving:: /uploads:: ", path2uploads);
  global.log("app:: static serving:: /assets:: ", path2assets);

	fse.ensureDirSync(path2uploads, { mode: 0o0600, });
	fse.ensureDirSync(path2assets, { mode: 0o0600, });

  app.use('/uploads', express.static(path2uploads));// __dirname: (fullpath)\server\src -> target: (fullpath)\uploads ->
  app.use('/assets', express.static(path2assets));  // http://localhost:8080/assets/qH0nDN57jIt130Bp/8ba6305a48c87fe650daacce1af4bca1.jpeg
  */


  // ===============================================
  // route: client-build:: serve client's build-directory at route-path ("https://node-server.path/") of this node-server
  // ===============================================
  //const path2build = path.join(__dirname, '..', '..', 'client', 'build')
  //global.log("app:: static serving:: local path to build folder:: ", path2build);
  //app.use(express.static(path2build));  //global.log("__dirname::", __dirname) -> g:\autogit\xdx1\server\src -> target: g:\autogit\xdx1\client\build


  // ===============================================
  // route: catch-all:: redirect everthing else (except the things before this command like /images /gallery /api ..)
  // ===============================================
  app.get('/*', express_CtoS_Route_CatchAll);


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
  io.use(socketio_CtoS_AuthMiddleware);


  // ===============================================
  // WEBSERVER: start the server by listening to port
  // ===============================================
  /*
  server.listen(tryPort, process.env.HOST, () => { // port and ip-address to listen to
    global.log('app:: server running on port ', tryPort);
  });
  global.log("app: await server listening or error");
  await { then(resolve, fail) { server.on('listening', resolve); server.on('error', fail); } };
  */

  const promiseToListen = (port, host) => {
    return new Promise( (resolve, reject) => {
      try {
        server.listen(port, () => { // port and ip-address to listen to
          clog('app:: main-server running on port ',port);

          // ===============================================
          // SOCKETIO: new socket connect -> routes
          // ===============================================
          io.on('connection', socketio_CtoS_ClientRoutes);

          // Here we send the ready signal to PM2
          //process.send('ready');

          resolve(port);
        });
      } catch (error) {
         reject(error);
      }
    });
  }

  const port = await promiseToListen(tryPort || 8080, );

  //clog(`app:: *** modtime loginserver app.js:: ${fse.statSync(global.abs_path("gameserver/gameApp.js")).mtime}`);


  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  // ===============================================
  // SERVER2SERVER SOCKET: connect main-server as a client to gameserver
  // ===============================================
  const gameserverAddr = process.env.GAMESERVER_ADDR || "localhost";
  const gameserverPort = process.env.GAMESERVER_PORT || "2052";
  const mainserveridentkeyHash_ORIGINAL = crypto.createHash('sha1').update(JSON.stringify(process.env.MAINSERVER_PRIVATE_IDENTKEY || "xyz")).digest('hex');

  const clientsocketGameServer1 = new ServerToServerSocketIOClient(io);

  // ===============================================
  // SERVER2SERVER SOCKET: connect main-server as a client to gameserver
  // ===============================================
  clientsocketGameServer1.connect(gameserverAddr, gameserverPort, mainserveridentkeyHash_ORIGINAL);




  // pm2 Graceful Stop
	process.on('SIGINT', async () => {
		try {
      await DBSockets.stop();
	  	await DBUsers.stop();
			await DBUsercards.stop();
      clientsocketGameServer1.destroy();
	    //process.exit(0);
		} catch (err) {
	    process.exit(1);
		}
	});

  clog("app:: EOF");

  return port;
};
