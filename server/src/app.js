"use strict";
const fse = require('fs-extra');
const path = require('path');

const requestIp = require('request-ip');

const socketio = require('socket.io');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
//const morgan = require('morgan');

const	session = require('express-session');
const MemoryStore = require('memorystore')(session);
//const NedbStore = require('connect-nedb-session')(session);;

const passport = require('passport');
const PassportFacebookStrategy = require('passport-facebook').Strategy; //const { Strategy: FacebookStrategy } = require('passport-facebook');
const PassportGoogleStrategy = require('passport-google-oauth20').Strategy;
//const PassportLocalStrategy = require('passport-local').Strategy;

//const jwt = requireX('tools/auth/jwt');
//const socketioRoutes = requireX('routes/socketio');
//const socketValidateServertoken = requireX("socket/validateServertoken");

const Joi = require('@hapi/joi');
const jwt = requireX('tools/jwt');
const JoiValidateFallback = requireX('tools/joivalidatefallback');

const { SUCCESS, ERROR } = requireX('tools/errorhandler');

const joi_userid = 			Joi.string().alphanum().min(30).max(50).normalize();
const joi_servertoken =	Joi.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/).min(30).max(499).normalize();

const arrayRemoveElementByValue = (arr, value) => { return arr.filter( function(element){ return element !== value; }) }


function logErrors(err, req, res, next) {
  global.log("app:: logErrors:: ", err.stack);
  next(err);
}


function clientErrorHandler(err, req, res, next) { 
  if (req.xhr) {
    res.status(500).send({ error: 'Something failed!' });
  } else {
    next(err);
  }
}


function errorHandler(err, req, res, next) { // catch all
  res.status(500);
  res.render('error', { error: err });
}


// main
module.exports = async (config) => {

  global.log("app:: ########################################");
  global.log("app:: now:: ", new Date());
  global.log("app:: process.env.NODE_ENV:: ", process.env.NODE_ENV);
  global.log("app:: process.env.SERVERTARGET:: ", process.env.SERVERTARGET);
  global.log("app:: process.env.HTTPS:: ", process.env.HTTPS);
  global.log("app:: process.env.NODE_PATH:: ", process.env.NODE_PATH);
	global.log("app:: isPROD:: ", global.isPROD);
  global.log("app:: ");
	global.log("app:: base_dir:: ", global.base_dir);
  global.log('app:: process.version:: ', process.version);
  global.log("app:: process.env.NUMBER_OF_PROCESSORS:: ", process.env.NUMBER_OF_PROCESSORS);
  global.log("app:: process.env.PORT:: ", process.env.PORT);
	global.log("app:: process.env.FACEBOOK_CALLBACK:: ", process.env.FACEBOOK_CALLBACK);
	global.log("app:: process.env.GOOGLE_CALLBACK:: ", process.env.GOOGLE_CALLBACK);

  // ===============================================
  // DATABASE: init
  // ===============================================
  const DBUsers 		= requireX('./nedb/DBUsers');
  const DBUsercards = requireX('./nedb/DBUsercards');

  // ===============================================
  // DATABASE: load
  // ===============================================
  try {
    global.log("app:: nedb:: loading DBUsers:: ", DBUsers.databasePath());
    await DBUsers.loadDatabase();
    global.log("app:: nedb:: DBUsers count:", await DBUsers.count());
  } catch (error) { 
  	throw new Error("app:: error:: loading DBUsers::" + error.message); 
  }

  try {
    global.log("app:: nedb:: loading DBUsercards:: ", DBUsercards.databasePath());
    await DBUsercards.loadDatabase();
    global.log("app:: nedb:: DBUsercards count:", await DBUsercards.count());
  } catch (error) { 
  	throw new Error("app:: error:: loading DBUsercards::" + error.message); 
  }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

  // ===============================================
  // EXPRESS
  // ===============================================
  global.log("app:: configurating express")
  var app = express();


  // ===============================================
  // Webserver
  // ===============================================
  let server;
  global.log("app:: configurating webserver:: https:: ", process.env.HTTPS)
  if (process.env.HTTPS === "false") {
    // ===============================================
    // http-webserver
    // ===============================================
    server = require('http').createServer(app); // init the server
    global.log("app:: HTTP:: no SSL", );
  } else {
    // ===============================================
    // https-webserver
    // ===============================================
    const ssl_credentials = { // in linux: openssl req -new -newkey rsa:2048 -nodes -out mydomain.csr -keyout private.key
      key: fse.readFileSync(global.abs_path("../" + process.env.SSLCERT_KEY)), //'./ssl/xdeltax_xyz_cloudflare_cert.key')), // ssl_key private key
      cert:fse.readFileSync(global.abs_path("../" + process.env.SSLCERT_PEM)), //'./ssl/xdeltax_xyz_cloudflare_cert.pem')), // ssl_cert 
      //ca:fse.readFileSync(global.abs_path('./ssl/encryption/intermediate.crt')), // ssl-ca
    };
    server = require('https').createServer(ssl_credentials, app); // init the server
    global.log("app:: HTTPS:: SSL:: ", process.env.SSLCERT_PEM);
  }


  /*
  // Redirect from http port 80 to https
  var http = require('http');
  http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
  }).listen(80);
  */


  // ===============================================
  // EXPRESS: middlewares
  // ===============================================
  app.use(cors());                // enable all CORS requests
  app.use(helmet());              // enhance your app security with Helmet
  
  // ===============================================
  // upload-limit
  // ===============================================
  app.use(bodyParser.json({limit: '50mb'}));                        // allow 50mb in post for imageupload; use bodyParser to support JSON-encoded bodies -> to parse application/json content-type
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));  // allow 50mb in post for imageupload; to support URL-encoded bodies
  //app.use(morgan('combined'));    // log HTTP requests

  // ===============================================
  // session-store
  // ===============================================
	app.use(session({ // memorystore
 		secret: process.env.SESSION_SECRET || "something" + new Date()/1000, 
		resave: true, 
		saveUninitialized: true,
    cookie: { maxAge: 24 * 3600 * 1000 },
    store: new MemoryStore({
      checkPeriod: 24 * 3600 * 1000, // prune expired entries every 24h
    }),
	}));
	/*
	app.use(session({ // connect-nedb-session
 		secret: process.env.SESSION_SECRET || "something" + new Date()/1000,
    resave: false,
    saveUninitialized: false,
    cookie: { path: '/', httpOnly: true, maxAge: 24 * 3600 * 1000 }, 
    store: new NedbStore({ 
    	filename: global.abs_path(path.join("../" + process.env.DATABASE_NEDB, "session.txt")), //'path_to_nedb_persistence_file' 
    }),
	}));
  */              

  // ===============================================
  // socket.io: initialize the WebSocket server instance
  // ===============================================
  global.log("app:: configurating socketio")
  var io = socketio.listen(server);	// connect sockets to the server
	//app.set('io', io); // add sockets to the request so that we can access them later in the controller -> const _io = req.app.get('io');


  // ===============================================
  // ERROR HANDLING
  // ===============================================
  //app.use(logErrors);
  //app.use(clientErrorHandler);
  //app.use(errorHandler);


  // ===============================================
  // middleware: force https
  // ===============================================
  // app.use(enforce.HTTPS({ trustProtoHeader: true }));
  // Use enforce.HTTPS({ trustProtoHeader: true }) in case you are behind a load balancer (e.g. Heroku).


  /*
  //app.enable('trust proxy'); // if we are behind a proxy, loadbalancer,
  app.use (function (req, res, next) {
    if (req.secure) {
      // request was via https, so do no special handling
      next();
    } else {
      // request was via http, so redirect to https
      res.redirect('https://' + req.headers.host + req.url);
    }
  });
  */


  // ===============================================
  // middleware: inject IP:: get IP of client and inject in res.clientip
  // ===============================================
  app.use(requestIp.mw({ attributeName : 'clientip' })) // inject ip to res.clientip


  // ===============================================
  // middleware: inject something to req
  // ===============================================
  app.use( (req, res, next) => {
    //console.log('inject to res');
    req.testing = 'testing';
    return next();
  });


  // ===============================================
  // passport:: init
  // ===============================================
	//app.use(express.json())
	// Initialize Passport and restore authentication state, if any, from the
	// session.
	app.use(passport.initialize());
	//require("./passport/strategies")(); // configure passport-strategies
  
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

	// setting up the passport middleware for each of the OAuth providers
	const passportFacebookAuth = passport.authenticate('facebook', { session: false, }); // disable req.session.passport
	const passportGoogleAuth   = passport.authenticate('google'  , { scope: ['profile'], session: false, }); // disable req.session.passport
	//const passportLocalAuth    = passport.authenticate('local'   , { session: false, successRedirect: '/local.io.callback', failureRedirect: '/', }); // disable req.session.passport

 	

	// *** Configure the Facebook strategy for use by Passport.
	// OAuth 2.0-based strategies require a `verify` function which receives the
	// credential (`accessToken`) for accessing the Facebook API on the user's
	// behalf, along with the user's profile.  The function must invoke `cb`
	// with a user object, which will be set at `req.user` in route handlers after
	// authentication.
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

	/*
	const passportStrategyLocalConfig = {
		usernameField: "username",
		passwordField: "password",
	};
	*/

  // ===============================================
  // passport:: auth against server database
  // ===============================================
  passport.use(new PassportFacebookStrategy(passportStrategyFacebookConfig, (accessToken, refreshToken, profile, cb) => { 
  	profile.accessToken = accessToken;
  	profile.refreshToken = refreshToken;
  	cb(null, profile);
  }));

  passport.use(new PassportGoogleStrategy  (passportStrategyGoogleConfig,   (accessToken, refreshToken, profile, cb) => {
  	profile.accessToken = accessToken;
  	profile.refreshToken = refreshToken;
  	cb(null, profile);
  }));


  // ===============================================
  // passport:: middleware to parse query to session
  // ===============================================
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
		//global.log("***(1) passportInjectSession:: ", socketid, req.query, req.session,)
  	next();
	};


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
			  global.log(`***(X) passportAuthCallback:: /${provider}.io.callback:: STEP2:: `, err_usercard, res_usercard);
	  	}

		  // send error or (full) user-object to client -> OAuth.js -> RouteLogin.js -> onAuthSuccess / onAuthFailed -> store.user.doAuthLogin(user)
		  const ioRoute = `client.oauth.${provider}.io`;
		  io.in(socketid).emit(ioRoute, err, res); // emit to client:: userobject OR null

		  global.log(`***(X) passportAuthCallback:: /${provider}.io.callback:: `, err, res );
	  }
	  res.status(200).end();
	};




  // ===============================================
  // route: socket.io-routing
  // ===============================================
  io.xdx = { // add object to io -> track number of connections
    connectionCount: 0,
    useridARRAY: [],
  };
	

  // ===============================================
  // route: middleware for every new socket-connect
  // ===============================================
  io.use( (socket, next) => {
  	global.log("+++ io.use:: socket:: ", socket.id)
  	next();
  });


  io.on('connection', (socket) => {
    // new connection established
    global.log('io.on:: client successfully connected:: ', socket.id);

    io.xdx.connectionCount++;

    socket.xdx = {
    	routetype: null,
      userid: null, // update after verification
      servertoken: null,
    };

    //todo: -> db-call to update onlineStatus

    // handle disconnect-event
    socket.on('disconnect', (operation) => {
      global.log('socket.on:: client disconnect:: ', socket.id, operation);

      io.xdx.connectionCount--;
      if (io.xdx.connectionCount < 0) io.xdx.connectionCount = 0;

      // remove client from online-list
      if ( socket.hasOwnProperty("xdx")
        && socket.xdx.hasOwnProperty("userid")
        && socket.xdx.userid
        && io.xdx.useridARRAY.includes(socket.xdx.userid)
      ) {
        io.xdx.useridARRAY = arrayRemoveElementByValue(io.xdx.useridARRAY, socket.xdx.userid);
      }

      //todo: -> db-call to update onlineStatus
    }); // of socket.on(disconnect)


    // every api-call for this client (socket) is counted here.
    if (!socket.apicalls) socket.apicalls = { count: 0, };
    socket.apicalls.count++;
    socket.apicalls.updatedAt = new Date() / 1000;
    global.log("socketio:: socket.use:: apicalls:: count:: ", socket.apicalls.count, socket.apicalls.updatedAt);


	  // ===============================================
	  // middleware: check routes
	  // ===============================================
	  // routes with "auth/..." are valid if req contains "userid" and (a valid) "servertoken"
	  // routes with "free/..." are always valid
	  // all other routes are invalid
	  // ===============================================
    socket.use( (packet, next) => {    	
  		const [route, req, clientEmitCallback] = packet || {};
    	try {
		    // check (own app-)protocol-version is set in connect-function of socketio.js in client
		    // this way we can force clients to update their mobile app
		    let { version } = socket.handshake.query; // const token = socket.handshake.query.token;
		    global.log("socketio:: io.use:: checking communication protocol version:: ", version);
		    if (!version || !Number.isInteger(version) || version < process.env.SOCKETIO_HANDSHAKEVERSION) throw ERROR(0, "validation", "invalid app communication protocol version");


			  // ===============================================
			  // auth-routes: routes starting with "auth" needs a valid servertoken 
			  // ===============================================
    		if (route && route.indexOf("auth") === 0) {
    			const {userid, servertoken} = req || {};
    			if (!req || !userid || !servertoken) throw ERROR(1, "validation", "no id or token provided"); // throw new Error("no token found");

				  // ===============================================
				  // check servertoken-format
				  // ===============================================
    			const valid_userid      = JoiValidateFallback(userid     , null, joi_userid); 
			    const valid_servertoken = JoiValidateFallback(servertoken, null, joi_servertoken); 
    			if (!valid_userid || !valid_servertoken) throw ERROR(2, "validation", "invalid id or token format");

				  // ===============================================
				  // verify servertoken
				  // ===============================================
		      if (!jwt.verify(valid_servertoken)) throw ERROR(3, "validation", 'token verification failed'); // check if the token was signed by this server and isnt expired		      

				  // ===============================================
				  // decode servertoken
				  // ===============================================
		      const decodedServertoken = jwt.decode(valid_servertoken); // decoding token to extract userid
					//global.log("server.use:: decodedServertoken:: ", decodedServertoken)
		      // usid: userid
		      // pvd: provider
		      // pid: providerid
	    		// hash: crypto.createHash('sha1').update(JSON.stringify(thisUser.forcenew + thisUser.providertoken)).digest('hex');
					const { usid, pvd, pid, hash } = decodedServertoken || {};
					if (!usid || !pvd || !pid || !hash) throw ERROR(4, "validation", "invalid token structure");
					if (usid !== valid_userid) throw ERROR(5, "validation", "token / user mismatch");

					if (socket.xdx.userid && socket.xdx.userid !== valid_userid) throw ERROR(6, "validation", "connection misuse");
					socket.xdx.routetype = "auth";
			    socket.xdx.userid = valid_userid;
			    socket.xdx.servertoken = valid_servertoken;

				  // ===============================================
				  // add user to list of valid users beeing online
				  // ===============================================
			    // add auth client to online-list
			    if (!io.xdx.useridARRAY.includes(socket.xdx.userid)) {
			      io.xdx.useridARRAY.push(socket.xdx.userid);
			      //todo: -> db-call to update onlineStatus
			    };

    			return next();
    		};

			  // ===============================================
			  // unauth-routes: routes starting with "free" needs no servertoken 
			  // ===============================================
    		if (route && route.indexOf("free") === 0) {
    			const {userid, servertoken} = req || {};

    			if (!req) throw ERROR(7, "validation", "no id or token found");

					socket.xdx.routetype = "free";

    			return next();
    		};

			  // ===============================================
			  // invalid-routes: all other routes are invalid 
			  // ===============================================
	    	throw new Error("invalid route");
		  } catch (error) {
		  	const {err, res} = ERROR(99, "validation", error);
		  	global.log("socket.use:: ERROR:: ", err, socket.id);

    		// callback:: send the error to client-emit-function
	    	clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function

	    	// send a "force logout" signal to client
		    socket.emit("client.force.logout", err); // emit logout-request to clients sotre.socketio.on("")
		
    		// send the error to on(error)
				let newErr = new Error("validation failed");
				newErr.data = err;
		  	next(newErr); // stop here -> err-object will be send to client socket-event "onError"
		  }
    });


    const _getUserStore = async (targetuserid, userid, servertoken) => {
	  	let res = null;
	  	const {err, res: res_user} = await DBUsers.getUser(targetuserid, userid, servertoken);
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
	  	}
	  	return {err: err, res: res};
    };

	  // ===============================================
	  // all routes witgh "free/" and "auth/" are valid
	  // ===============================================
    socket.on('auth/store/userstore/get', async (req, clientEmitCallback) => {
    	const { targetuserid, userid, servertoken, } = req || {};
    	global.log("*****socket.on(auth/userstore/get):: ", req,);
    	const {err, res} = await _getUserStore(targetuserid, userid, servertoken,);   
    	global.log("socket.on(auth/userstore/get):: ", socket.xdx.userid, err, res,);
    	clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
    });


    socket.on('auth/store/user/get', async (req, clientEmitCallback) => {
    	const { targetuserid, userid, servertoken, } = req || {};
	  	const {err, res} = await DBUsers.getUser(targetuserid, userid, servertoken);
    	global.log("socket.on(auth/user/get):: ", socket.xdx.userid, err, res,);
    	clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
    });

    socket.on('auth/store/user/update', async (req, clientEmitCallback) => {
    	const { targetuserid, userid, servertoken, props, } = req || {};
	  	const {err, res} = await DBUsers.updateProps(targetuserid, userid, servertoken, props);
    	global.log("socket.on(auth/user/update):: ", socket.xdx.userid, err, res);
    	clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
    });
		

    socket.on('auth/store/usercard/get', async (req, clientEmitCallback) => {
    	const { targetuserid, userid, servertoken, } = req || {};
	  	const {err, res} = await DBUsercards.getUsercard(targetuserid, userid, servertoken);
    	global.log("socket.on(auth/usercard/get):: ", socket.xdx.userid, err, res);
    	clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
    });

    socket.on('auth/store/usercard/update', async (req, clientEmitCallback) => {
    	const { targetuserid, userid, servertoken, props, } = req || {};
	  	const {err, res} = await DBUsercards.updateProps(targetuserid, userid, servertoken, props);
    	global.log("socket.on(auth/user/update):: ", socket.xdx.userid, err, res);
    	clientEmitCallback && clientEmitCallback(err, res); // callback to clients emit-function
    });
    

	}); // of io.on(connection)


  // ===============================================
  // route: socket.io for first handshake
  // ===============================================
  app.get('/socket.io', (req, res, next) => {
    global.log('get route "/socket.io"', req.testing);
    res.status(200).end();
  });


  // ===============================================
  // route: test something
  // ===============================================
  app.get('/test.io', passportInjectSession, (req, res, next) => {
    console.log('get route "/test"', req.testing, req.session);
		res.redirect("/test.io.callback");
    //res.status(200).json({ route: "/test", });
    //res.send()
    //res.end();
    //res.status(404).end();
    //res.status(200).end();
  });

  app.get('/test.io.callback', (req, res, next) => {
    console.log('get route "/test.io.callback"', req.testing);
    res.status(200).json({ route: "/test.io.callback", });
  });


  // ===============================================
  // route: passport:: auth-strategies triggerd by client-call
  // ===============================================
	app.get('/facebook.io', passportInjectSession, passportFacebookAuth); // call from client: http://localhost/facebook.io?socketid=
	app.get('/google.io'	, passportInjectSession, passportGoogleAuth); // call from client: http://localhost/google.io?socketid=
	//app.get('/local.io'		, passportInjectSession, passportLocalAuth, (req, res) => { res.redirect("/local.io.callback") }); // call from client: http://localhost/fingerprint.io?socketid=xxx&fp=xxx


  // ===============================================
  // route: passport callback:: triggerd by callbacks from oauth-provider
  // ===============================================	
	app.get('/facebook.io.callback', passportFacebookAuth, passportAuthCallback); // callback from provider
	app.get('/google.io.callback'	 , passportGoogleAuth  , passportAuthCallback); // callback from provider
	//app.get('/local.io.callback'	 , passportLocalAuth   , passportAuthCallback); // callback from provider


  // ===============================================
  // route: static images:: serve images in assets-directory at asset-path ("https://node-server.path/assets/") of this node-server
  // ===============================================
  /*
  const path2uploads= global.abs_path("../" + process.env.FOLDER_UPLOADS); //path.join(__dirname, '..', 'uploads');
  const path2assets = global.abs_path("../" + process.env.FOLDER_ASSETS); //path.join(__dirname, process.env.ASSETS_SUBFOLDER_GALLERY);
  global.log("app:: static serving:: /uploads:: ", path2uploads);
  global.log("app:: static serving:: /assets:: ", path2assets);

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
  app.get('/*', function(req, res) { 
    res.status(200).json({ 
	   	app: "/", 
	    isProd: global.isPROD,
			base_dir: global.base_dir,
			index_mtime: fse.statSync(global.base_dir + "/index.js").mtime,
			app_mtime: fse.statSync(global.base_dir + "/app.js").mtime,
			//env: process.env,
			//global: global,
    });
    //res.status(404).end();
    //res.sendFile(path.join(path2build, 'index.html')); // serve index.html for any unknown path
  });


  /*
  // ===============================================
  // middleware: async something
  // ===============================================
  app.use( async (req, res, next) => {
    // await test();
    next();
  });
	*/


  // ===============================================
  // middleware: error handling
  // ===============================================
  app.use( (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') { // Send the error rather than to show it on the console
      res.status(401).send(err);
    } else {
      next(err);
    }
  });


  // ===============================================
  // server: start the server by listening to a port
  // ===============================================
  try {
    server.listen(process.env.PORT, process.env.HOST, () => { // port and ip-address to listen to
      global.log('app:: server running on port ', process.env.PORT);

      // Here we send the ready signal to PM2
  		//process.send('ready');
    });
  } catch (error) {
     throw Error("app:: starting server:: ERROR:: " + error);
  }


  // pm2 Graceful Stop
	process.on('SIGINT', async () => {
		try {
	  	await DBUsers.stop();
			await DBUsercards.stop();
	    //process.exit(0);
		} catch (err) {
	    //process.exit(1);			
		}
	});


  global.log(`app:: *** modtime idx:: ${fse.statSync(global.base_dir + "/index.js").mtime}`);
  global.log(`app:: *** modtime app:: ${fse.statSync(global.base_dir + "/app.js").mtime}`);
  global.log(`app:: *** server time:: ${new Date()}`);
} // of module.exports (main)
