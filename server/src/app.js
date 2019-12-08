"use strict";

const express = require('express');

const socketio = require('socket.io');

const fse = require('fs-extra')

const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
//const morgan = require('morgan');

const path = require('path');

const requestIp = require('request-ip');

const jwt = requireX('tools/auth/jwt');


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
  // DATABASE init
  // ===============================================
  const DBUsers = require('./database/nedb/DBUsers');

  // ===============================================
  // DATABASE load
  // ===============================================
  try {
    global.log("app:: nedb:: await loading DBUsers ...");
    await DBUsers.load();
    global.log("app:: nedb:: DBUsers count:", await DBUsers.count());
  } catch (error) { throw new Error("app:: error:: loading DBUsers::" + error.message); }


  // ===============================================
  // EXPRESS APP
  // ===============================================
  global.log("app:: configurating express")
  var app = express();

  let port;
  let server;
  global.log("app:: configurating webserver:: ", process.env.HTTPS, process.env.PORT)
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
    port = Number(443);
    // https://itnext.io/node-express-letsencrypt-generate-a-free-ssl-certificate-and-run-an-https-server-in-5-minutes-a730fbe528ca
    const ssl_credentials = { // in linux: openssl req -new -newkey rsa:2048 -nodes -out mydomain.csr -keyout private.key
      //key: fse.readFileSync('./key.pem'),  // ssl_key
      //cert: fse.readFileSync('./cert.pem'),// ssl_cert
      ////ca: fse.readFileSync( './encryption/intermediate.crt' ), // ssl-ca
    }
    server = require('https').createServer(ssl_credentials, app); // init the server
  }
  global.log("app:: using webserver port:: ", port)

  /*
  // Redirect from http port 80 to https
  var http = require('http');
  http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
  }).listen(80);
  */

  // ===============================================
  // initialize the WebSocket server instance
  // ===============================================
  global.log("app:: configurating socketio")
  const io = socketio.listen(server);


  // ===============================================
  // EXPRESS APP: middlewares
  // ===============================================
  app.use(cors());                // enable all CORS requests
  app.use(helmet());              // enhance your app security with Helmet
  app.use(bodyParser.json({limit: '50mb'}));                        // allow 50mb in post for imageupload; use bodyParser to support JSON-encoded bodies -> to parse application/json content-type
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));  // allow 50mb in post for imageupload; to support URL-encoded bodies
  //app.use(morgan('combined'));    // log HTTP requests

  global.log("app:: process.env.NODE_ENV:: ", process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'development') {
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
  // route: test something
  // ===============================================
  app.get('/test', (req, res, next) => {
    console.log('get route "/test"', req.testing);
    res.end();
  });


  // ===============================================
  // socket.io
  // ===============================================
  app.get('/socket.io', (req, res, next) => {
    global.log('get route "/socket.io"', req.testing);
    res.end();
  });

  // implement socketio-api routing
  global.log("app:: configurating socketio-events")
  require('./routes/socketio/')(io);


  // ===============================================
  // serve images in gallery-directory at gallery-path ("https://node-server.path/gallery/") of this node-server
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
  // serve client's build-directory at route-path ("https://node-server.path/") of this node-server
  // ===============================================
  const path2build = path.join(__dirname, '..', '..', 'client', 'build')
  global.log("app:: static serving:: local path to build folder:: ", path2build);

  app.use(express.static(path2build));  //global.log("__dirname::", __dirname) -> g:\autogit\xdx1\server\src -> target: g:\autogit\xdx1\client\build

  // ===============================================
  // route: redirect everthing else (except the things before this command like /images /gallery /api ..)
  // ===============================================
  app.get('/*', function(req, res) { // serve index.html for any unknown path
    res.sendFile(path.join(path2build, 'index.html'));
  });


  // ===============================================
  // middleware: async something
  // ===============================================
  app.use( async (req, res, next) => {
    // await test();
    next();
  });


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
  // start the server by listening to a port
  // ===============================================
  try {
    server.listen(port, () => {
      global.log('app:: server running on port ', port);
    });
  } catch (error) {
     throw Error("app:: starting server:: ERROR:: " + error);
  }
} // of module.exports (main)
