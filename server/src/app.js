"use strict";

const isPROD = Boolean(process.env.NODE_ENV === "production");


const fse = require('fs-extra');

const socketio = require('socket.io');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
//const morgan = require('morgan');
const	session = require('express-session');

const path = require('path');

const requestIp = require('request-ip');

const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy; //const { Strategy: FacebookStrategy } = require('passport-facebook');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


const jwt = requireX('tools/auth/jwt');

const socketioRoutes = require('./routes/socketio');


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

  // ===============================================
  // dev-stuff
  // ===============================================
	if (!isPROD) {
		//global.log("app:: env:: ", process.env)
		//global.log("app:: global:: ", global)
	}


  // ===============================================
  // DATABASE: init
  // ===============================================
  const DBUsers = requireX('database/nedb/DBUsers');


  // ===============================================
  // DATABASE: load
  // ===============================================
  try {
    global.log("app:: nedb:: await loading DBUsers ...");
    await DBUsers.load();
    global.log("app:: nedb:: DBUsers count:", await DBUsers.count());
  } catch (error) { throw new Error("app:: error:: loading DBUsers::" + error.message); }


  // ===============================================
  // EXPRESS
  // ===============================================
  global.log("app:: configurating express")
  var app = express();


  // ===============================================
  // Webserver
  // ===============================================
  let port;
  let server;
  global.log("app:: configurating webserver:: https:: ", process.env.HTTPS)
  if (process.env.HTTPS === "false") {
    // ===============================================
    // http-webserver
    // ===============================================
    port = Number(process.env.PORT || 8080);
    server = require('http').createServer(app); // init the server
  } else {
    // ===============================================
    // https-webserver
    // ===============================================
    port = Number(process.env.PORT || 443);
    // https://itnext.io/node-express-letsencrypt-generate-a-free-ssl-certificate-and-run-an-https-server-in-5-minutes-a730fbe528ca
    const ssl_credentials = { // in linux: openssl req -new -newkey rsa:2048 -nodes -out mydomain.csr -keyout private.key
      key: fse.readFileSync('./ssl/xdeltax.key'), // ssl_key
      cert:fse.readFileSync('./ssl/xdeltax.crt'), // ssl_cert
      //ca:fse.readFileSync('./ssl/encryption/intermediate.crt' ), // ssl-ca
    }
    server = require('https').createServer(ssl_credentials, app); // init the server
  }
  global.log("app:: using webserver:: port:: ", port);


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
  app.use(bodyParser.json({limit: '50mb'}));                        // allow 50mb in post for imageupload; use bodyParser to support JSON-encoded bodies -> to parse application/json content-type
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));  // allow 50mb in post for imageupload; to support URL-encoded bodies
  //app.use(morgan('combined'));    // log HTTP requests
	app.use(session({ secret: process.env.SESSION_SECRET || "something", resave: true, saveUninitialized: true }));


  // ===============================================
  // socket.io: initialize the WebSocket server instance
  // ===============================================
  global.log("app:: configurating socketio")
  const io = socketio.listen(server);	// connect sockets to the server
	//app.set('io', io); // add sockets to the request so that we can access them later in the controller -> const _io = req.app.get('io');

  // ===============================================
  // dev-stuff
  // ===============================================
  global.log("app:: process.env.NODE_ENV:: ", process.env.NODE_ENV);
  if (!isPROD) {
    //app.use(express.logger('dev'));
    //app.use(errorhandler())
  }


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
  // ROUTES: PROTECTED
  //    protected routes that require authorization-header-entry containing a valid jwt-servertoken
  //    https://localhost:8080/account
  //    https://localhost:8080/auth/*
  //    https://localhost:8080/api/protected/random-quote
  // ===============================================
  ////  app.use(routesProtected); // API-calls
  // ===============================================
  // ROUTES: UNPROTECED7
  //    unprotected routes that do not need any auth for requesting data from server
  //    https://localhost:8080/api/token/request
  //    https://localhost:8080/open/hello
  // ===============================================
  ////  app.use(routesUnprotected); // API-calls


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
	app.use(passport.session());
	//require("./passport/strategies")(); // configure passport-strategies
  
	// *** Configure Passport authenticated session persistence
	// In order to restore authentication state across HTTP requests, Passport needs
	// to serialize users into and deserialize users out of the session.  In a
	// production-quality application, this would typically be as simple as
	// supplying the user ID when serializing, and querying the user record by ID
	// from the database when deserializing.  However, due to the fact that this
	// example does not have a database, the complete Facebook profile is serialized
	// and deserialized.
  passport.serializeUser((user, cb) => { 
  	return cb(null, user)
  });

  passport.deserializeUser((obj, cb) => { 
  	cb(null, obj)
  });

	// custom middleware allows us to attach the socket id to the session. with the socket id attached we can send back the right user info to the right socket
	const passportInjectSocket = (req, res, next) => {
  	const socketid = (req && req.query) ? req.query.socketid : null; // from client http://serverurl:serverport/facebook.io?socketid={socket.id}
  	const fingerprinthash = (req && req.query) ? req.query.fp : null; // from client http://serverurl:serverport/facebook.io?socketid={socket.id}&fp={fphash}
  	req.session.socketid = socketid;
  	req.session.fingerprinthash = fingerprinthash;
		//global.log("****passportInjectSocket:: ", req.query, socketid, req.session)
  	next();
	};


	// setting up the passport middleware for each of the OAuth providers
	const passportFacebookAuth = passport.authenticate('facebook', { session: false, }); // disable req.session.passport
	const passportGoogleAuth   = passport.authenticate('google'  , { scope: ['profile'], session: false, }); // disable req.session.passport
 	

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
	  callbackURL		: isPROD ? process.env.FACEBOOK_CALLBACK_PROD : process.env.FACEBOOK_CALLBACK_DEV,
	  enableProof		: true, // enable app secret proof
	};

	const passportStrategyGoogleConfig = {
	  clientID			: process.env.GOOGLE_CLIENT_ID,
	  clientSecret	: process.env.GOOGLE_CLIENT_SECRET,
	  callbackURL		: isPROD ? process.env.GOOGLE_CALLBACK_PROD : process.env.GOOGLE_CALLBACK_DEV,
	  enableProof		: true, // enable app secret proof
	};


  // ===============================================
  // passport:: auth against server database
  // ===============================================
  passport.use(new FacebookStrategy(passportStrategyFacebookConfig, (accessToken, refreshToken, profile, cb) => { 
	 	// called when OAuth provider sends back user information.  Normally, you would save the user to the database here in a callback that was customized for each provider.
   	//global.log("***passportCallback:: ", accessToken, refreshToken, profile, cb);
    //todo: DBUsers.findOrCreate({ facebookId: profile.id }, function (err, user) { return cb(err, user); });
  	return cb(null, profile);
  }));

  passport.use(new GoogleStrategy(passportStrategyGoogleConfig, (accessToken, refreshToken, profile, cb) => { 
	 	// called when OAuth provider sends back user information.  Normally, you would save the user to the database here in a callback that was customized for each provider.
  	//global.log("***passportCallback:: ", accessToken, refreshToken, profile, cb);
    //todo: DBUsers.findOrCreate({ facebookId: profile.id }, function (err, user) { return cb(err, user); });
  	return cb(null, profile);
  }));


  // ===============================================
  // passport:: send auth-success to client
  // ===============================================
  const passportAuthCallback = (req, res) => {
  	const { 
  		user, 		// injected from passportGoogleAuth
  		session, 	// injected from passport
  	} = req;

  	const {
  		provider, // "facebook", "google"
  		id, 			// fb-id or google-id
  		_raw,
  		_json,
  	} = user || { };

  	const {
  		socketid, // socketid from client-call
  		fingerprinthash,
  	} = session || { };
  	
	  //global.log(`/${provider}.io.callback:: `, provider, id, socketid, session, session.passport, _raw, _json);

	  if (socketid && (provider === "google" || provider === "facebook")) {
		  global.log(`/${provider}.io.callback:: EMIT:: `, socketid, provider, id, fingerprinthash);
		  io.in(socketid).emit(provider, id);
	  }
	  res.end();
	};


  // ===============================================
  // route: socket.io-routing
  // ===============================================
  socketioRoutes(app, io);


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
  app.get('/test.io', (req, res, next) => {
    console.log('get route "/test"', req.testing);
    res.status(200).json({ route: "/test", });
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
	app.get('/facebook.io', passportInjectSocket, passportFacebookAuth); // call from client: http://localhost/facebook.io?socketid=
	app.get('/google.io'	, passportInjectSocket, passportGoogleAuth); // call from client: http://localhost/google.io?socketid=


  // ===============================================
  // route: passport callback:: triggerd by callbacks from oauth-provider
  // ===============================================	
	app.get('/facebook.io.callback', passportFacebookAuth, passportAuthCallback); // callback from provider
	app.get('/google.io.callback'	 , passportGoogleAuth  , passportAuthCallback); // callback from provider


  // ===============================================
  // route: static images:: serve images in gallery-directory at gallery-path ("https://node-server.path/gallery/") of this node-server
  // ===============================================
  /*
  const path2images = path.join(__dirname, '..', 'uploads');
  const path2gallery = path.join(__dirname, process.env.ASSETS_SUBFOLDER_GALLERY);
  global.log("app:: static serving:: /images:: ", path2images);
  global.log("app:: static serving:: /gallery:: ", path2gallery);

  app.use('/images', express.static(path2images));    // __dirname: G:\autogit\xdx1\server\src -> target: g:\autogit\xdx1\uploads ->
  app.use('/gallery', express.static(path2gallery));  // http://localhost:8080/gallery/qH0nDN57jIt130Bp/8ba6305a48c87fe650daacce1af4bca1.jpeg
  */


  // ===============================================
  // route: client-build:: serve client's build-directory at route-path ("https://node-server.path/") of this node-server
  // ===============================================
  const path2build = path.join(__dirname, '..', '..', 'client', 'build')
  global.log("app:: static serving:: local path to build folder:: ", path2build);

  app.use(express.static(path2build));  //global.log("__dirname::", __dirname) -> g:\autogit\xdx1\server\src -> target: g:\autogit\xdx1\client\build


  // ===============================================
  // route: catch-all:: redirect everthing else (except the things before this command like /images /gallery /api ..)
  // ===============================================
  app.get('/*', function(req, res) { 
    res.status(404).end();
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
    server.listen(port, () => {
      global.log('app:: server running on port ', port);
    });
  } catch (error) {
     throw Error("app:: starting server:: ERROR:: " + error);
  }
} // of module.exports (main)
