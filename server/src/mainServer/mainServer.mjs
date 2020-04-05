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
//import passportSocketIo from 'passport.socketio';
import passportFacebook from 'passport-facebook'
import passportGoogle from 'passport-google-oauth20';

import crypto from 'crypto';

import {datetime, datetimeUTC, unixtime,} from "../tools/datetime.mjs";
import {abs_path, } from "../basepath.mjs";

import {isERROR, isSUCCESS, } from "../tools/isErrorIsSuccess.mjs";

import DBUsers from '../database/DBUsers.mjs';
import DBSockets from '../database/DBSockets.mjs';
import DBUsercards from '../database/DBUsercards.mjs';
import DBUserobjects from '../database/DBUserobjects.mjs';
import DBGamemaps from '../database/DBGamemaps.mjs';
import DBGameGroundLayers from '../database/DBGameGroundLayers.mjs';

import rxdbStore from '../database/rxdb/index.mjs'; // rxdb-database

import ServerToServerSocketIOClient from "./server2server/socketIOClient.mjs";

import express_AuthMiddleware from "./express/auth.middleware.mjs";
import express_Route_CatchAll from "./express/route.catchAll.mjs";

import authSocketConnection from "../socket/auth.socket.connection.mjs";
import authSocket from "../socket/auth.socket.mjs";

import routesSocket from "../socket/routes.socket.mjs";
import routesGameMapAPI from "../socket/routes.gameMapAPI.mjs";

export default async function mainServer(tryPort) {
  // ===============================================
  // DATABASE: load
  // ===============================================
  clog("---DATABASE------------------------------------------------")

  const database = {
    dbSockets: new DBSockets(),
    dbUsers: new DBUsers(),
    dbUsercards: new DBUsercards(),
    dbUserobjects: new DBUserobjects(),
    dbGamemaps: new DBGamemaps(),
    dbGameGroundLayers: new DBGameGroundLayers(),


  }

  await rxdbStore.initDatabase(),

  //const db = await database.rxdbGame.connect();
  //const {dbApp} = db.server({ startServer: false });
  //app.use('/db', dbApp);
  clog("rxdbStore::", await rxdbStore.database2json())
  //clog("gameCollection::", await rxdbStore.game.getCollectionAsJson())
  clog("gameCollection::", "count::", await rxdbStore.game.count())
  clog("-----------------------------------------------------------")



  clog("app:: nedb:: loading Sockets... ", );
  const dbSocketsCount = await database.dbSockets.connect(); clog("app:: nedb:: DBSockets count:", dbSocketsCount);
  //if (!Number.isInteger(dbSocketsConnected)) throw new Error("failed to connect to database *sockets*");

  clog("app:: nedb:: loading DBUsers... ", );
  const dbUsersCount = await database.dbUsers.connect(); clog("app:: nedb:: DBUsers count:", dbUsersCount);
  if (!Number.isInteger(dbUsersCount)) throw new Error("failed to connect to database *users*");

  //const x = await dbUsers.findAll();
  //clog("ZZZZZZZZZZZZZ", x);

  clog("app:: nedb:: loading DBUsercards... ", );
  const dbUsercardsCount = await database.dbUsercards.connect(); clog("app:: nedb:: DBUsercards count:", dbUsercardsCount);
  //if (!Number.isInteger(dbUsercardsConnected)) throw new Error("failed to connect to database *usercards*");

  clog("app:: nedb:: loading DBUserobjects... ", );
  const dbUserobjectsCount = await database.dbUserobjects.connect(); clog("app:: nedb:: DBUserobjects count:", dbUserobjectsCount);

  clog("app:: nedb:: loading DBGamemaps... ", );
  const dbGamemapsCount = await database.dbGamemaps.connect(); clog("app:: nedb:: DBGamemaps count:", dbGamemapsCount);

  clog("app:: nedb:: loading DBGameGroundLayers... ", );
  const dbGameGroundLayersCount = await database.dbGameGroundLayers.connect(); clog("app:: nedb:: DBGameGroundLayers count:", dbGameGroundLayersCount);


  // ===============================================
  // EXPRESS: init
  // ===============================================
  const app = express();



  //nst {app: dbApp, server: dbServer} = database.rxdbGame.server({ startServer: false });
  //app.use('/db', dbApp);

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
  const sessionStore = new NedbStore({ filename: abs_path(path.join("../" + process.env.DATABASE_NEDB, "session.txt")), });
  const sessionSecret = process.env.SESSION_SECRET || "somethingtohide" + unixtime();

  app.use(session({ // nedb-session-store
    //key: "xdx.sid",
 		secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { path: '/', httpOnly: true, maxAge: 24 * 3600 * 1000 }, // 24 hours
    store: sessionStore,
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
    req._server = 'mainServerWasHere';
    req._database = database;
    next();
  });

  // ===============================================
  // EXPRESS: middleware for every new socket-connect
  // ===============================================
  app.use(express_AuthMiddleware);


  // ===============================================
  // PASSPORT:: init
  // ===============================================
	app.use(passport.initialize());

  // ===============================================
  // passport:: send auth-success to client
  // ===============================================
  const passportAuthCallback = async (req, res) => {
    // const url = `${server}/${provider}.io?sid=${socketid}&fp=${fphash}&uid=${_uid}&username=1&password=1`;
    // req.user from passport.use() -> cb(null, user)
    // req.session from passportInjectSession()
    // req.clientip from middleware-inject
    // req._server from middleware-inject
    // req._database = { dbSockets, dbUsers, dbUsercards, ... } from middleware-inject
    const {
      user, 		// injected from passport.authenticate()
      session, 	// injected from passport / passportInjectSession
      _database, // injected form express-middleware
    } = req;

    const {
      socketid,         // from client-call:: socketid of client/server-connection
      fingerprinthash,  // from client-call:: fingerprint of client
      uid,              // from client-call:: debug-mode to generate fake-users -> uid = extension to providerid === uid + providerid;
    } = session || { }; // const url = `${server}/${provider}.io?sid=${socketid}&fp=${fphash}&uid=${_uid}&username=1&password=1`;

    const {
      dbUsers,
      dbUsercards,
      dbUserobjects,
    } = _database || { };

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

      //create 1000 fake users based on login-provider and fakename (uid)
      //if (_uid) for (let i=0; i < 1000; i++) await dbUsers.loginWithProvider(provider, _providerid, _providertoken, _uid + i, _fingerprinthash);

      const {err, res: res_user} = await dbUsers.loginWithProvider(provider, _providerid, _providertoken, _uid, _fingerprinthash);
      if (!err && res_user) {
        const {err: err_usercard, res: res_usercard} = await dbUsercards.get(res_user.userid, res_user.userid, res_user.servertoken);
        const {err: err_userobject, res: res_userobject} = await dbUserobjects.get(res_user.userid, res_user.userid, res_user.servertoken);
        res = {
          status: "login with provider",
          provider: provider,
          socketid: socketid,

          user: res_user || {},
          usercard: res_usercard || {},
          userobject: res_userobject || {},
        };
        //clog(`***(X) passportAuthCallback:: /${provider}.io.callback:: STEP2:: `, err_usercard, res_usercard);
      }

      // send error or (full) user-object to client -> OAuth.js -> RouteLogin.js -> onAuthSuccess / onAuthFailed -> store.user.doAuthLogin(user)
      const ioRoute = `client.oauth.${provider}.io`;
      io.in(socketid).emit(ioRoute, err, res); // emit to client:: userobject OR null

      clog(`passportAuthCallback:: /${provider}.io.callback:: `, ioRoute, socketid, err, res && res.user.userid );
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
    //clog("passportInjectSession:: ", socketid, req._query, req.session,)
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
  // SOCKETIO: REST-API: route socket.io (reserved for handshake)
  // ===============================================
  app.get('/socket.io', (req, res, next) => { res.status(404).end(); });
  // client will be exposed under https://myhost.com/socket.io/socket.io.js
  // 1.step polling transport: GET https://myhost.com/socket.io/?EIO=3&transport=polling&t=ML4jUwU&b64=1


  // ===============================================
  // TEST: REST-API:
  // ===============================================
  app.get('/time.io', (req, res, next) => {
    clog("CALL ", req.route.path);
    res.status(200).type('json').send(JSON.stringify({time: new Date(),}, null, 4));
  });


  app.get('/test', async (req, res, next) => {
    clog("CALL ", req.route.path);
    const { _database } = req || {};
    const { dbSockets, dbUsers, dbUsercards, dbUserobjects, dbXXX, } = _database || {};
    clog("/test:: ", await dbSockets.count(), dbSockets.client)
    res.status(200).type('json').send(JSON.stringify({time: new Date(),}, null, 4));
  });


  app.get('/debug/db.io', async (req, res, next) => {
    clog("CALL ", req.route.path);
    const { _database } = req || {};
    const { dbSockets, dbUsers, dbUsercards, dbUserobjects, dbXXX, } = _database || {};
    const obj = {
      text: "/debug/db.io",
      unixtime: unixtime(),
      servertimeLOC: datetime(),
      servertimeUTC: datetimeUTC(),
      route: req.route,
      dbSockets: {
        count: dbSockets && await dbSockets.count(),
        findAll: dbSockets && await dbSockets.findAll(),
      },
      dbUsers: {
        count: dbUsers && await dbUsers.count(),
      },
      dbUsercards: {
        count: dbUsercards && await dbUsercards.count(),
      },
      dbUserobjects: {
        count: dbUserobjects && await dbUserobjects.count(),
      },
      dbXXX: {
        count: dbXXX && await dbXXX.count(),
      },
    };
    res.status(200).type('json').send(JSON.stringify(obj, null, 4));
  });

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
  //app.get('/*', express_Route_CatchAll);


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

  /*
  // ===============================================
  // SOCKETIO: inject something to ?
  // ===============================================
  io.use((socket, next) => {
    // socket.handshake.query = {handshakeversion, appversion, EIO, transport, t }
    let {
      handshakeversion,
      appversion,
      transport,
    } = socket.handshake.query; // const token = socket.handshake.query.token;

    clog("+++++++++++++++++++++++ socketio:: transport:: ", transport, socket)
    //socket.server = 'mainServerWasHere';
    //socket.database = database;
    next();
  });
  */

  // ===============================================
  // SOCKETIO: check if client is a valid connection
  // ===============================================
  io.use(authSocketConnection);


  // ===============================================
  // SOCKETIO: new socket connect -> routes
  // ===============================================
  io.on('connection', async (socket) => {
    // ===============================================
    // new connection established
    // ===============================================
    clog('app:: io.on:: new client connected:: ', socket.id);

    // ===============================================
    // SOCKETIO: inject something to req
    // ===============================================
    socket.use((packet, next) => {
      const [route, req, clientEmitCallback] = packet || {};
      req._servername = 'mainServerWasHere';
      req._database = database;
      req._timeserverin = unixtime(); // inject time to req
      next();
    });


    // ===============================================
    // handle disconnect-event
    // ===============================================
    socket.on('disconnect', async (operation) => {
      // db-call to update onlineStatus -> remove socket
      const {err: removeError, res: numRemoved} = await database.dbSockets.remove(socket.id);
      clog('socket.on:: client disconnect:: ', socket.id, operation, removeError, numRemoved);
    }); // of socket.on(disconnect)


    // ===============================================
    // update database -> add socket to onlinelist
    // ===============================================
    const {err: updateError, res: loadedObject} = await database.dbSockets.createOrUpdate(socket.id, null /*userid*/);
    if (updateError) clog('app:: io.on:: new client connected:: added to database:: ERROR:: ', updateError, );


    // ===============================================
    // middleware: check routes of api-calles:: all routes after  middleware are valid
    // ===============================================
    // routes with "auth/..." are valid if req contains "userid" and (a valid) "servertoken"
    // routes with "free/..." are always valid
    // all other routes are invalid
    // ===============================================
    socket.use((packet, next) => authSocket(socket, packet, next));

    // ===============================================
    // event-handlers: routes
    // ===============================================
    socket.use((packet, next) => routesSocket(socket, packet, next));
    socket.use((packet, next) => routesGameMapAPI(socket, packet, next));

    socket.on('free/game/baselayer/getifnecessary', rxdbStore.game.servercall_getGameMapIfNecessary); // async (req, clientEmitCallback) => {


    /*
    socket.on('auth/store/user/logout', routeAuth_userLogout);

    // route:: auth/store/userstore/get -> res = {userid: "xxx", user: {}, usercard: {}, }
    socket.on('auth/store/userstore/get', routeAuth_userstoreGet); // userstore = user + usercard

    socket.on('auth/store/user/get', routeAuth_userGet);
    socket.on('auth/store/user/update', routeAuth_userUpdateProps);

    socket.on('auth/store/usercard/get', routeAuth_usercardGet);
    socket.on('auth/store/usercard/update', routeAuth_usercardUpdateProps);

    socket.on('free/test/this', routeFree_testThis);
    */
  }); // of "connection"


  app.get('/debugstatus', async (req, res, next) => {
    // http://localhost:8080/debugstatus?mapid=5
    const {mapid} = req.query;
    clog("debugstatus::", await rxdbStore.database2json())
    clog("debugstatus::", await rxdbStore.game.getDocumentsAsJson());
    clog("debugstatus::", "count::", await rxdbStore.game.count())
    const rxdoc = await rxdbStore.game.findOne({map_id: +mapid});
    //const rxatt = await rxdoc.allAttachments();
    clog("debugstatus::", "rxdoc::", rxdoc.toJSON()); // toJSON show all attachements too


    res.status(200).type('json').send(JSON.stringify({time: new Date(),}, null, 4));
  });

  app.get('/debugcreatemap', async (req, res, next) => {
    // http://localhost:8080/debugcreatemap?width=5000&height=5000&mapid=3
    const {width, height, mapid} = req.query;
    clog("debugcreatemap:: path:: ", req.route.path, req.query);
    if (width>0) {
      const t1 = unixtime();
      const result = await rxdbStore.game.DEBUG_createTestData(+mapid || 0, +width, +height || +width);
      const t2 = unixtime();
      clog("debugcreatemap:: result:: ", width, height, mapid, t2 - t1);
    }

    res.status(200).type('json').send(JSON.stringify({time: new Date(),}, null, 4));
  });



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
      database && database.dbSockets && database.dbSockets.close();
	  	database && database.dbUsers && database.dbUsers.close();
			database && database.dbUsercards && database.dbUsercards.close();

      database.dbSockets = null;
      database.dbUsers = null;
      database.dbUsercards = null;
      database = null;

      clientsocketGameServer1 && clientsocketGameServer1.destroy();
		} catch (err) {
	    process.exit(1);
		}
  });


  clog("app:: EOF");

  return port;
};
