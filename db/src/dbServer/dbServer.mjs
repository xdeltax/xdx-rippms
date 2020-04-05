import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import {unixtime} from "../tools/datetime.mjs";
import {random} from "../tools/random.mjs";

import express from 'express';
import cors from 'cors';

import PouchDB from 'pouchdb-core';
import Express_PouchDB from 'express-pouchdb';

import dbStore from './dbStore/index.mjs'; // rxdb-database

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const asyncFailsafeHandler = async (execution) => (req, res, next) => { execution(req, res, next).catch(nect) }; // app.get("/route"), asyncFailsafeHandler(async (req, res, next) => { /*no need for try catch*/ })

export default async function mainServer(dbPath, dbPort) {
  // ===============================================
  // EXPRESS: start express
  // ===============================================
  const app = express();


  // ===============================================
  // EXPRESS: cors (https://github.com/expressjs/cors#readme)
  // ===============================================
  //app.use(cors({credentials: true, origin: 'http://localhost:3000'})); // enable cors for requests from this client only
  app.use(cors({
    credentials: true,  // Set to true to pass the header, otherwise it is omitted
    origin: true,       // request origin defined by req.header('Origin')
    methods: ["GET", "PUT", "POST"],   // only allow GET ["GET", "PUT", "POST"] "GET,HEAD,PUT,PATCH,POST,DELETE",
  }));

  //app.use(express.limit('1mb'));


  // ===============================================
  // EXPRESS: start pouchdb-server
  // ===============================================
  clog("+++ initializing store");
  await dbStore.init();

  clog("+++ initializing pouchdb-server");
  const PouchDB_server_defaults = PouchDB.defaults({ mode: 'fullCouchDB', });
  const PouchDBServer = Express_PouchDB(PouchDB_server_defaults);
  app.use('/pouchdb', PouchDBServer);

  app.use('/db', PouchDBServer);

  //clog("+++ initializing couchdb-server");
  //app.use('/db', (req, res, next) => { next(null, "http://localhost:3333/pouchdb/"); });


  //clog("+++ creating a test database:: ", "testdb");
  //const testDB = new PouchDB('testdb'); // create a test database:: http://localhost:3333/db/testdb

  //const getdoc = await dbStore.basemaps.getOneDocumentFailsafe("_design/my_validation_name");
  //const _id = "_design/my_validation_name"; const _rev= "2-647ee79b0a9e5326f0c1616618a421c2";
  //const _id = "_design/basemaps"; const _rev= "3-88b6c2c35895268907287852cfce1793";
  //const deldoc = await dbStore.basemaps.remove(_id, _rev);
  //clog("deldoc:: ", getdoc);


  // ===============================================
  // EXPRESS: http-api
  // ===============================================
  httpApi(app);

  // ===============================================
  // WEBSERVER: start the server by listening to port
  // ===============================================
  const port = await startWebServer(app, dbPort || 3333, );

  return port;
}


// ===============================================
// WEBSERVER: start the server by listening to port
// ===============================================
const startWebServer = (server, port, host) => {
  return new Promise( (resolve, reject) => {
    try {
      server.listen(port, () => { // port and ip-address to listen to
        clog('server running on port ', port);
        resolve(port);
      });
    } catch (error) {
       reject(error);
    }
  });
}


// ===============================================
// EXPRESS: http-api
// ===============================================
const httpApi = (app) => {
  clog("+++ setting HTTP-API");

  app.get('/time', (req, res, next) => {
    clog("CALL ", req.route.path);
    res.status(200).type('json').send(JSON.stringify({time: new Date(),}, null, 4));
  });


  app.get('/random', async (req, res, next) => {
    try {
      const doc = {
        _id: "testid",
        testkey: "test" + random(10),
        time: unixtime(),
      };
      const newdoc = await dbStore.basemaps.upsertDocument(doc);
      clog("RANDOM:: ", "insert/update newdoc::" , newdoc);
      res.status(200).type('json').send(JSON.stringify({time: new Date(),}, null, 4));
    } catch (error) {
      clog("createmap::", "error::", error);
    }
  });


  app.get('/info', async (req, res, next) => {
    const result = await dbStore.basemaps.info();
    clog("status::", result);

    res.status(200).type('json').send(JSON.stringify({
      time: new Date(),
      result: result,
    }, null, 4));
  });


  app.get('/getmaps', async (req, res, next) => {
    const basemapsresult = await dbStore.basemaps.getAllDocuments({include_docs: true, attachments: false,});
    clog("status::", "basemaps result::", basemapsresult);

    res.status(200).type('json').send(JSON.stringify({
      time: new Date(),
      basemapsresult: basemapsresult,
    }, null, 4));
  });


  app.get('/createmap', async (req, res, next) => {
    try {
      // http://localhost:8080/debugcreatemap?width=5000&height=5000&mapid=3
      const {width, height, mapid} = req.query;
      //const width = 10000, height = 10000, mapid = 7;
      clog("createmap:: path:: ", req.route.path, req.query);
      if (width) {
        const t1 = unixtime();
        const result = await dbStore.basemaps.DEBUG_createTestData(+mapid || 0, +width, +height || +width);
        const t2 = unixtime();
        clog("createmap:: result:: ", width, height, mapid, t2 - t1);
      }
      res.status(200).type('json').send(JSON.stringify({time: new Date(),}, null, 4));
    } catch (error) {
      clog("createmap::", "error::", error);
    }
  });


  app.get('/createmaps', async (req, res, next) => {
    let t1, t2, width, height, mapid, result;

    mapid = 0; width =    2; height = width; t1 = unixtime(); result = await dbStore.basemaps.DEBUG_createTestData(+mapid, +width, +height); t2 = unixtime();
    clog("debugcreatemap:: result:: ", width, height, mapid, t2 - t1);

    mapid = 1; width =    5; height = width; t1 = unixtime(); result = await dbStore.basemaps.DEBUG_createTestData(+mapid, +width, +height); t2 = unixtime();
    clog("debugcreatemap:: result:: ", width, height, mapid, t2 - t1);

    mapid = 2; width =   10; height = width; t1 = unixtime(); result = await dbStore.basemaps.DEBUG_createTestData(+mapid, +width, +height); t2 = unixtime();
    clog("debugcreatemap:: result:: ", width, height, mapid, t2 - t1);

    mapid = 3; width =   50; height = width; t1 = unixtime(); result = await dbStore.basemaps.DEBUG_createTestData(+mapid, +width, +height); t2 = unixtime();
    clog("debugcreatemap:: result:: ", width, height, mapid, t2 - t1);

    mapid = 4; width =  100; height = width; t1 = unixtime(); result = await dbStore.basemaps.DEBUG_createTestData(+mapid, +width, +height); t2 = unixtime();
    clog("debugcreatemap:: result:: ", width, height, mapid, t2 - t1);

    mapid = 5; width =  500; height = width; t1 = unixtime(); result = await dbStore.basemaps.DEBUG_createTestData(+mapid, +width, +height); t2 = unixtime();
    clog("debugcreatemap:: result:: ", width, height, mapid, t2 - t1);

    mapid = 6; width = 1000; height = width; t1 = unixtime(); result = await dbStore.basemaps.DEBUG_createTestData(+mapid, +width, +height); t2 = unixtime();
    clog("debugcreatemap:: result:: ", width, height, mapid, t2 - t1);

    mapid = 7; width = 2000; height = width; t1 = unixtime(); result = await dbStore.basemaps.DEBUG_createTestData(+mapid, +width, +height); t2 = unixtime();
    clog("debugcreatemap:: result:: ", width, height, mapid, t2 - t1);

    mapid = 8; width = 5000; height = width; t1 = unixtime(); result = await dbStore.basemaps.DEBUG_createTestData(+mapid, +width, +height); t2 = unixtime();
    clog("debugcreatemap:: result:: ", width, height, mapid, t2 - t1);
    // 24 mb
    mapid = 9; width =10000; height = width; t1 = unixtime(); result = await dbStore.basemaps.DEBUG_createTestData(+mapid, +width, +height); t2 = unixtime();
    clog("debugcreatemap:: result:: ", width, height, mapid, t2 - t1);

    // 390 mb
    //mapid =10; width =20000; height = width; t1 = unixtime(); result = await dbStore.basemaps.DEBUG_createTestData(+mapid, +width, +height); t2 = unixtime();
    //clog("debugcreatemap:: result:: ", width, height, mapid, t2 - t1);

    res.status(200).type('json').send(JSON.stringify({time: new Date(),}, null, 4));
  });


  app.get('/addtest', async (req, res, next) => {
    try {
      const {id} = req.query;
      const time = new Date()/1000;

      const doc = {
        _id: "test" + id || 0,
        test: "hallo test",
        time: time,
      };
      const newdoc = await dbStore.basemaps.upsertDocument(doc);
      clog("addtest::", "result::", doc, newdoc);

      res.status(200).type('json').send(JSON.stringify({
        time: time,
        doc: doc,
        basemapsresult: basemapsresult,
      }, null, 4));
    } catch (error) {
      clog("addtest::", "error::", error);
    }
  });

/*
  app.get('/deletemaps', async (req, res, next) => {
    const basemapsresult = await pouchdbStore.basemaps.destroy();
    clog("status::", "basemaps result::", basemapsresult);

    res.status(200).type('json').send(JSON.stringify({
      time: new Date(),
      basemapsresult: basemapsresult,
    }, null, 4));
  });

  app.get('/findmap', async (req, res, next) => {
    const {mapid} = req.query;
    const result = await rxdbStore.basemaps.collection.find().where('mapid').eq(mapid || 0).exec();
    const result2= await rxdbStore.db.basemaps.find().where('mapid').eq(mapid || 0).exec();
    res.status(200).type('json').send(JSON.stringify({time: new Date(), result: result, result2: result2, }, null, 4));
  });
*/

  app.use('/', (req, res) => res.send('not found'));
}






// ===============================================
// EXPRESS: start pouchdb-server
// ===============================================
const startDatabase = (app) => {
  //http://docs.couchdb.org/en/latest/http-api.html
  //http://localhost:3333/db/_all_dbs
  //http://localhost:3333/db/_config
  //http://localhost:3333/db/_utils/ <- with final slash -> redirects to fauxton interface
  //http://localhost:3333/db/_membership
  //http://localhost:3333/db/_session
  //http://localhost:3333/db/testdb/_all_docs
  //http://localhost:3333/db/testdb/_changes
  //http://localhost:3333/db/testdb/_index list all indexes of this db

  clog("+++ starting pouchdb-server");
  const PouchDB_server_defaults = PouchDB.defaults({
    //db: require('sqldown'),
    //prefix: 'database/', // process.env.DATABASE_PATH ||
    //configPath: './config.json',
    mode: 'fullCouchDB',
    /*
    overrideMode: {
      include: ['routes/fauxton'],
      exclude: [ // excludes express-pouchdb's authentication logic
        'routes/authentication',
        // disabling the above, gives error messages which require you to disable the
        // following parts too. Which makes sense since they depend on it.
        'routes/authorization',
        'routes/session'
      ]
    }
    */
  });
  app.use('/pouchdb', Express_PouchDB(PouchDB_server_defaults));

  //clog("+++ creating a test database:: ", "testdb");
  //const testDB = new PouchDB('testdb'); // create a test database:: http://localhost:3333/db/testdb
};
