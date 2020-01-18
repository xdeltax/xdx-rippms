//import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
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
import passportFacebook from 'passport-facebook'
import passportGoogle from 'passport-google-oauth20';

import crypto from 'crypto';

import {unixtime,} from "../tools/datetime.mjs";
import {abs_path, } from "../basepath.mjs";

import {isERROR, isSUCCESS, } from "../tools/isErrorIsSuccess.mjs";

import DBUsers from '../nedb/DBUsers.mjs';
import DBSockets from '../nedb/DBSockets.mjs';
import DBUsercards from '../nedb/DBUsercards.mjs';

import ServerToServerSocketIOClient from "./ServerToServerSocketIOClient.mjs";

import express_CtoS_AuthMiddleware from "./express_CtoS_AuthMiddleware.mjs";
import express_CtoS_Route_CatchAll from "./express_CtoS_Route_CatchAll.mjs";

import socketioAuthConnectionHandshake from "./socketioAuthConnectionHandshake.mjs";
import socketioHandleConnectionRoutes from "./socketioHandleConnectionRoutes.mjs";


export default async function gameApp(tryPort) {
  // ===============================================
  // DATABASE: load
  // ===============================================
  const dbSockets = new DBSockets();
  const dbUsers = new DBUsers();
  const dbUsercards = new DBUsercards();

  clog("app:: nedb:: loading Sockets... ", );
  const dbSocketsConnected = await DBSockets.connect();
  //if (!dbSocketsConnected) throw new Error("failed to connect to database *sockets*");
  clog("app:: nedb:: DBSockets count:", await DBSockets.count());

  clog("app:: nedb:: loading DBUsers... ", );
  const dbUsersConnected = await DBUsers.connect();
  if (!dbUsersConnected) throw new Error("failed to connect to database *users*");
  clog("app:: nedb:: DBUsers count:", await DBUsers.count());

  clog("app:: nedb:: loading DBUsercards... ", );
  const dbUsercardsConnected = await DBUsercards.connect();
  //if (!dbUsercardsConnected) throw new Error("failed to connect to database *usercards*");
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


  // ===============================================
  // PASSPORT:: init
  // ===============================================
	app.use(passport.initialize());

  // ===============================================
  // passport:: send auth-success to client
  // ===============================================
  const passportAuthCallback = async (req, res) => {
    // req.user from passport.use() -> cb(null, user)
    // req.session from passportInjectSession()
    // req.testing from app.use()
    const {
      user, 		// injected from passport.authenticate()
      session, 	// injected from passport / passportInjectSession
    } = req;

    const {
      socketid, // socketid from client-call
      fingerprinthash, // from client
      uid, // from client
    } = session || { };

    const {
      provider, // "facebook", "google", "local"
      accessToken,
      refreshToken,
      id,
      name,
      photos,
      emails,
      username,
    } = user || { };

    if (socketid && provider) { // valid: (provider === "google" || provider === "facebook" || provider === "local")) {
      const _providerid = id ? id : null;
      const _providertoken =	refreshToken ? refreshToken : accessToken ? accessToken : null;
      const	_uid = uid ? uid : null; // client-data
      const _fingerprinthash = fingerprinthash ? fingerprinthash : null; // client-data

      let res = null;
      // query db -> update or create db
      const {err, res: res_user} = await DBUsers.loginWithProvider(provider, _providerid, _providertoken, _uid, _fingerprinthash);
      if (!err && res_user) {
        res = {
          user: res_user,
          usercard: null,
        };

        // query usercard
        const {err: err_usercard, res: res_usercard} = await DBUsercards.getUsercard(res_user.userid, res_user.userid, res_user.servertoken);
        if (!err_usercard) {
          res.usercard = res_usercard;
        }
        //clog(`***(X) passportAuthCallback:: /${provider}.io.callback:: STEP2:: `, err_usercard, res_usercard);
      }

      // send error or (full) user-object to client -> OAuth.js -> RouteLogin.js -> onAuthSuccess / onAuthFailed -> store.user.doAuthLogin(user)
      const ioRoute = `client.oauth.${provider}.io`;
      io.in(socketid).emit(ioRoute, err, res); // emit to client:: userobject OR null

      clog(`*** passportAuthCallback:: /${provider}.io.callback:: `, ioRoute, socketid, err, res.user.userid );
    }
    res.status(200).end();
  };

  const passportStrategyFacebookConfig = {
    clientID			: process.env.FACEBOOK_KEY,
    clientSecret	: process.env.FACEBOOK_SECRET,
    profileFields	: ['id', 'emails', 'name', 'picture.width(250)'],
    callbackURL		: process.env.FACEBOOK_CALLBACK,
    enableProof		: true, // enable app secret proof
  };

  const passportStrategyGoogleConfig = {
    clientID			: process.env.GOOGLE_CLIENT_ID,
    clientSecret	: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL		: process.env.GOOGLE_CALLBACK,
    enableProof		: true, // enable app secret proof
  };

  // custom middleware allows us to attach the socket id to the session. with the socket id attached we can send back the right user info to the right socket
  const passportInjectSession = (req, res, next) => {
    // parse req.query and store in session for use in passportAuthCallback
    // from client http://serverurl:serverport/facebook.io?sid={socket.id}&fp={fphash}&un={username}
    const socketid = (req && req.query) ? req.query.sid : null;
    const fingerprinthash = (req && req.query) ? req.query.fp : null;
    const uid = (req && req.query) ? req.query.uid : null;
    req.session.socketid = socketid;
    req.session.fingerprinthash = fingerprinthash;
    req.session.uid = uid;
    clog("***(1) passportInjectSession:: ", socketid, req.query, req.session,)
    next();
  };

  const verifyCallback = async (accessToken, refreshToken, profile, cb) => {
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;
    cb(null, profile);
  }

  const passportFacebookAuth = passport.authenticate('facebook', { session: false, }); // disable req.session.passport
  const passportGoogleAuth   = passport.authenticate('google'  , { scope: ['profile'], session: false, }); // disable req.session.passport
  //const passportLocalAuth    = passport.authenticate('local'   , { session: false, successRedirect: '/local.io.callback', failureRedirect: '/', }); // disable req.session.passport

  // ===============================================
  // PASSPORT: strategy middleware
  // ===============================================
  passport.use(new passportFacebook.Strategy(passportStrategyFacebookConfig, verifyCallback));
  passport.use(new passportGoogle.Strategy  (passportStrategyGoogleConfig, verifyCallback));

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
  const path2uploads= abs_path("../" + process.env.FOLDER_UPLOADS); //path.join(__dirname, '..', 'uploads');
  const path2assets = abs_path("../" + process.env.FOLDER_ASSETS); //path.join(__dirname, process.env.ASSETS_SUBFOLDER_GALLERY);
  clog("app:: static serving:: /uploads:: ", path2uploads);
  clog("app:: static serving:: /assets:: ", path2assets);

	fse.ensureDirSync(path2uploads, { mode: 0o0600, });
	fse.ensureDirSync(path2assets, { mode: 0o0600, });

  app.use('/uploads', express.static(path2uploads));// __dirname: (fullpath)\server\src -> target: (fullpath)\uploads ->
  app.use('/assets', express.static(path2assets));  // http://localhost:8080/assets/qH0nDN57jIt130Bp/8ba6305a48c87fe650daacce1af4bca1.jpeg
  */


  // ===============================================
  // route: client-build:: serve client's build-directory at route-path ("https://node-server.path/") of this node-server
  // ===============================================
  //const path2build = path.join(__dirname, '..', '..', 'client', 'build')
  //clog("app:: static serving:: local path to build folder:: ", path2build);
  //app.use(express.static(path2build));  //clog("__dirname::", __dirname) -> g:\autogit\xdx1\server\src -> target: g:\autogit\xdx1\client\build


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
  io.use(socketioAuthConnectionHandshake);


  // ===============================================
  // SOCKETIO: new socket connect -> routes
  // ===============================================
  io.on('connection', socketioHandleConnectionRoutes);


  // ===============================================
  // WEBSERVER: start the server by listening to port
  // ===============================================
  /*
  server.listen(tryPort, process.env.HOST, () => { // port and ip-address to listen to
    clog('app:: server running on port ', tryPort);
  });
  clog("app: await server listening or error");
  await { then(resolve, fail) { server.on('listening', resolve); server.on('error', fail); } };
  */

  const promiseToListen = (port, host) => {
    return new Promise( (resolve, reject) => {
      try {
        server.listen(port, () => { // port and ip-address to listen to
          clog('app:: main-server running on port ',port);

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

  //clog(`app:: *** modtime loginserver app.js:: ${fse.statSync(abs_path("gameserver/gameApp.js")).mtime}`);


  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /*
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
  */

  // pm2 Graceful Stop
	process.on('SIGINT', async () => {
    process.exit(0);
	});

  process.on('beforeExit', (code) => {
    console.log('Process beforeExit event with code: ', code);
  });

  process.on('exit', (code) => {
    console.log('Process exit event with code: ', code);
    try {
      DBSockets.close();
	  	DBUsers.close();
			DBUsercards.close();
      dbSockets = null;
      dbUsers = null;
      dbUsercards = null;
      clientsocketGameServer1.destroy();
		} catch (err) {
	    process.exit(1);
		}
  });


  clog("app:: EOF");

  return port;
};
