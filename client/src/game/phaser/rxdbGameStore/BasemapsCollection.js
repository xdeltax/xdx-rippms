import PrototypeMobxRxdb from "./PrototypeMobxRxdb";

import {runInAction, toJS, } from 'mobx';
import deepCopy from 'tools/deepCopyObject';
import {unixtime} from "tools/datetime";
import * as bytebuffer4Tilemap from "game/tools/bytebuffer4Tilemap";
import {random} from "tools/random";
import crypto from "crypto";

import socketio from 'api/socket'; // socket

//const createHashFromObject = (obj) => crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex');
const createHashFromString = (str) => crypto.createHash('sha1').update(str).digest('hex');

// ===============================================
// collection-name
// ===============================================
const _COLLECTIONNAME_ = "basemaps"; // only lowercase allowed

// ===============================================
// mobx-obsered-data
// ===============================================
const documentSchemaMobx = {
  _id: "clientonly",
  updatedAt: 0,
};


// ===============================================
// non-observed-data
// ===============================================
const documentSchemaData = {
  _id: "0",
  mapid: "0",

  tilesetid: "0",

  bufferbytes: 1,
  mapwidth: 100,
  mapheight: 100,

  //buffer: null, // tilemap groundlayer -> in memory -> access from game
  bufferAsString: "",
  //bufferWasUpdated: false, // indicator for tilemap-renderer if buffer is dirty and needs a rerender! -> true => trigger new render in tilemap-renderer;
};


// ===============================================
// collection-schema
// ===============================================
const documentSchemaRxdb = {
  version: 0,
  title: _COLLECTIONNAME_,
  description: _COLLECTIONNAME_,
  type: "object",
  keyCompression: false,
  options: {
    timestamps: true, // This will activate timestamps-plugin for this model
  },
  properties: {
    _id:        { type: "string", primary: true }, // primary: unique, indexed, required
    mapid:      { type: "string", unique: true, },

    tilesetid:  { type: "string", },

    bufferbytes:{ type: "number", default: 1 },
    mapwidth:   { type: "number", default: 100 },
    mapheight:  { type: "number", default: 100 },

    bufferhash: { type: "string", dafault: "" },
  },
  required: ["mapid", "bufferbytes", "mapwidth", "mapheight", "bufferhash", ], // required for every document
  attachments: { "encrypted": false }, // tilemap groundlayer -> local indexeddb -> stored as attachment to document as a string (buffer.toString("binary"))
};

const migrationStrategies = null;


// ===============================================
// helpers
// ===============================================
let _bufferWasUpdated = false; // indicator for tilemap-renderer if buffer is dirty and needs a rerender! -> true => trigger new render in tilemap-renderer;


export default class MobxRxdbGameCollection extends PrototypeMobxRxdb {
  // ===============================================
  // adater to external data-access:: used in IsometricTilemapPacked.js
  // ===============================================
  get bufferWasUpdated() { return _bufferWasUpdated || false; }
  set bufferWasUpdated(v){ _bufferWasUpdated = v || false; }

  get bufferString() { return this.data.bufferAsString; }
  //set bufferString(v){ this.data.bufferAsString = v; }

  get mapWidth() { return this.data.mapwidth; }
  get mapHeight(){ return this.data.mapheight; }



  constructor(databaseRxdb, collectionName) {
    const cName = _COLLECTIONNAME_; // only lowercase allowed
    const isObserved = false;
    super(isObserved, databaseRxdb, collectionName || cName, documentSchemaRxdb, documentSchemaMobx, documentSchemaData, migrationStrategies); // open/create database and create/connect collection
    this._serverIsMaster = false;

    // fill memory with defaults
    runInAction(()=>{ this._mobx = this._documentSchemaMobx });
    this._data = deepCopy(this._documentSchemaData)
  }

  async initCollection() {
    // 1) create or open collection
    await super.initCollection(true); // true = subscribeToCollection = collection is reactive and synced to mobx/data

    // 2) read all docs from local rxdb; in this case: only 1 doc with _id: "clientonly"
    const rxdbDocArray = await this.getDocuments(); // [] or [ {documentSchemaRxdb}, {documentSchemaRxdb}, ... ]
    //global.log("$$$$$$$$$$initCollection 1:: ", rxdbDocArray)
    //if (rxdbDocArray.length > 0) { const rxdbDoc = rxdbDocArray[0]; const allAttachments = await rxdbDoc.allAttachments(); global.log("$$$$$$$$$$initCollection 2:: ", rxdbDoc, allAttachments) };

    // do manual in first load of GameContainer.js <- await this.syncCollection();
  }

  async syncCollection(config) { // in GamContainer.js:: loadGameAssets();
    // 3) syncServerDatabaseToLocalRxdb():: check hash from local-database with hash from server and sync local with serverdata if different
    await this.syncServerDatabaseToLocalRxdb(config);
    // 4) syncRxdbToMemory():: sync to mobx and data (or init mobx and data with default if db is empty)
    await this.syncRxdbToMemory(config);
  }



  async replicationFromServerToClient() {
    // https://pouchdb.com/api.html#replication
    const replicationState = this.collection.sync({
      remote: 'http://localhost:3333/db/basemaps/', // remote database. This can be the serverURL, another RxCollection or a PouchDB-instance
      /*
      waitForLeadership: true,              // (optional) [default=true] to save performance, the sync starts on leader-instance only
      direction: {                          // direction (optional) to specify sync-directions
          pull: true, // default=true
          push: false,// default=true
      },
      options: {                             // sync-options (optional) from https://pouchdb.com/api.html#replication
          live: true,
          retry: true,
      },
      query: this.collection.find().where('mapid').eq("0"), // query (optional) only documents that match that query will be synchronised
      */
    });
    /*
    .on('change', function (change) {
      // yo, something changed!
      global.log("CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC:", "change", this.getCollectionAsJson(), this.getDocumentsAsJson(), );
    })
    .on('paused', function (info) {
      // replication was paused, usually because of a lost connection
      global.log("CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC:", "paused", this.getCollectionAsJson(), this.getDocumentsAsJson(), );
    })
    .on('active', function (info) {
      // replication was resumed
      global.log("CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC:", "active", this.getCollectionAsJson(), this.getDocumentsAsJson(), );
    })
    .on('complete', function () {
      // yay, we're in sync!
      global.log("CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC:", "complete", this.getCollectionAsJson(), this.getDocumentsAsJson(), );
    })
    .on('error', function (err) {
      // boo, we hit an error!
      global.log("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE:", "error", err);
    });
    */

  }

  // ===============================================
  // one-way-sync-only:: server -> local:: sync external database to local database
  // ===============================================
  async syncServerDatabaseToLocalRxdb(config) {
    const {mapid, force, fakedata} = config || {};

    //this.replicationFromServerToClient();

return;


    // (1) client-socketio:: send bufferHash and updatedAt to server
    const {err, res} = await servercall_getGameMapIfNecessary(mapid, this.data.bufferHash);
    global.log("PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP", err, res);

    if (err && fakedata) { // debug-stuff -> if server offline -> create map-data on the fly
      await this.DEBUG_createTestData(mapid || -1, 10, 10);
      return;
    }

    // (2) server: compare hash and updatedAt with server-data
    if (!err && res) {
      //res._id = this._documentSchemaData._id || "clientonly"; // modify unique _id from server to universal-client-id
      // (3) server: send back (A) "no update needed" or (B) new data
      // (4) client: (A) do nothing or (B) update local-database and memory
    }
  }


  // ===============================================
  // one-way-sync-only:: local -> memory:: sync local database to memroy (mobx and data)
  // ===============================================
  async syncRxdbToMemory(config) {
    const {mapid} = config || {};

    // get doument to sync
    //const rxdbDocData = await this.collection.findOne().where("_id").eq(this._documentSchemaData._id || "clientonly").exec();
    const rxdbDocData = await this.collection.findOne().where("_id").eq("map"+mapid).exec(); // || this._documentSchemaData._id || "map0").exec();

    global.log("iiiiiiiiiiiiiiiiiiiiii::", mapid, rxdbDocData)
    if (!rxdbDocData) { // if not exist ->
      // copy default-values to memory
      this._data = deepCopy(this._documentSchemaData);
      runInAction(()=>{ this._mobx = this._documentSchemaMobx });
    } else { // if exist ->
      // get attachment (tilemap as string) from local-database
      //const attachment = rxdbDocData.getAttachment("bufferAsString");
      //const attachementAsString = await attachment.getStringData(); // 100 ms
      const arrayOfAttachments = rxdbDocData.allAttachments();

      let attachementAsString = "";

      if (Array.isArray(arrayOfAttachments)) {
        for (let index = 0; index < arrayOfAttachments.length; index++) {
        //arrayOfAttachments.forEach(async (att) => {
          const attAsString = await arrayOfAttachments[index].getStringData(); // convert attachment to string
          global.log("111111111111111", attAsString.length);
          attachementAsString = attachementAsString + attAsString;
        };
      };

      // convert attachment to string
      // const attachementAsString = await attachment.getStringData(); // 100 ms
      // convert attachment to buffer
      //const buffer = Buffer.from(attAsString, "binary"); // 500 ms
      // cast buffer as uint8
      //const uint8 = new Uint8Array(buffer2); // 10 ms

      // convert rxdb-document from local database to json-object
      const jsonDocData = rxdbDocData.toJSON();

      global.log("XXXXXXXXXXXXXXXXXXXXXXXXXXX", arrayOfAttachments, attachementAsString.length, jsonDocData)

      // create data-memory-object from json-object-data of local database
      const dataObject = {
        _id: "map" + mapid, // "clientonly",

        updatedAt: jsonDocData.updatedAt,
        mapid: jsonDocData.mapid,
        bufferbytes: jsonDocData.bufferbytes,
        mapWidth: jsonDocData.mapWidth,
        mapHeight: jsonDocData.mapHeight,
        bufferHash: jsonDocData.bufferHash, // createHash(attachementAsString),

        // store buffer from attachment as string in data-memory-object
        bufferAsString: attachementAsString, //buffer: buffer, // tilemap groundlayer -> in memory -> access from game
      };

      // create mobx-memory-object
      const modxObject = {
        updatedAt: jsonDocData.updatedAt,
      }

      // copy objects to memory-storage
      this._data = dataObject; //this._data = deepCopy(jsonDocData);
      runInAction(()=>{ this._mobx = modxObject });

      // set update-flag for renderer
      this.bufferWasUpdated = true; // TRIGGER GAME TILEMAP RERENDER -> indicator for tilemap-renderer if buffer is dirty and needs a rerender!

      global.log("***GameCollection***syncRxdbToMemory***:: ", attachementAsString, attachementAsString.length, rxdbDocData, jsonDocData, this._data, this.getalldata, this.getallmobx)
    }
  };



  // ===============================================
  //
  // rxdb-database-operations
  //
  // ===============================================
  /*
  async setProp(prop, value, serverIsMaster) { // const x = await rxdbStore.user.setProp("card.test", 111 ); -> set _mobx: { card: {test:111} }
    return await super.setProp(prop, value); // write new value to local-database and mobx-observable
  }
  */

  // ===============================================
  //
  // client-operations
  //
  // ===============================================
  get isTest() {
    return Boolean(true);
  }


  // ===============================================
  // ===============================================
  //
  // server-API-operations
  //
  // ===============================================
  // ===============================================


  // ===============================================
  // ===============================================
  //
  // socket connection to server
  //
  // ===============================================
  // ===============================================
  servercall_test = async (targetuserid) => {
  };



  async DEBUG_createTestData(_mapid, _mapWidth, _mapHeight) {
    // delete all documents in collection
    //await this.collection.find().remove();

    const mapid =_mapid || 0;
    const tilesetid = 0;
    const bufferbytes = 1;
    const mapWidth  = _mapWidth || 5;
    const mapHeight = _mapHeight|| 5;

    // fill data-memory with fake data
    let tempstring = "";
    //const tempbuffer = Buffer.alloc(bufferbytes * mapWidth * mapHeight);
    for (let tileY = 0; tileY < mapHeight; tileY++) {
      for (let tileX = 0; tileX < mapWidth; tileX++) {
        const obj = { assetID: 0, frameID: 32, };

        switch (random(9)) {
          case 0: obj.frameID = random(30); break; // animation state of boy (0 .. 30)
          case 1: obj.frameID = 31; break; // boy, not animatable
          default:obj.frameID = 32; // empty block
        };

        //const idx = bufferbytes * (tileX + tileY * mapWidth);
        //tempbuffer[idx] = bytebuffer4Tilemap.groundlayer_objectToUint8(obj);

        const byte = bytebuffer4Tilemap.groundlayer_objectToUint8(obj);
        const char = String.fromCharCode(byte);
        tempstring = tempstring + char;
      }
    }

    //this.data.buffer[0] = global.random(64);

    global.log("DEBUG_createTestData:: #########::1:: ", bufferbytes, mapWidth, mapHeight, tempstring.length);

    // convert buffer to string
    //const bufferAsString = tempbuffer.toString("binary");
    const bufferAsString = tempstring;

    // create or update document
    const jsonDoc = {
      _id: "map" + mapid, //documentSchemaData._id, // "clientonly" -> always the same document
      mapid: mapid,
      tilesetid: tilesetid,
      bufferbytes: bufferbytes,
      mapWidth: mapWidth,
      mapHeight: mapHeight,
      updatedAt: unixtime(),
      bufferHash: createHashFromString(bufferAsString),
    };

    // MODIFY _id
    jsonDoc._id = documentSchemaData._id;

    const rxdbDoc = await this.collection.upsert(jsonDoc); // create or replace database-document (attachments will be deleted)

    global.log("DEBUG_createTestData:: #########::2:: ", jsonDoc.bufferHash);

    // remove old attachment
    //const oldAttachment = rxdbDoc.getAttachment('bufferAsString');
    //if (oldAttachment) await oldAttachment.remove();

    const idxStep = 1000 * 1000;
    let idxA = 0;
    let idxB = idxStep;
    let substr = "";
    while (substr = bufferAsString.substring(idxA, idxB)) {
       // idxB not included
      if (substr) {
        // add string as attachment to document
        const newAttachment = await rxdbDoc.putAttachment({ id: idxA, data: substr, type: "text/plain" });

        idxA = idxB;
        idxB = idxB + idxStep;

        global.log("DEBUG_createTestData:: #########::3:: ", idxA, idxB, substr.length);
      }
    }

    /*
    // add 1 attachment per line to document
    for (let tileY = 0; tileY < mapHeight; tileY++) {
      // create view
      const start = tileY * mapWidth;
      const end = start + mapWidth - 1;
      const buffer2str = this.data.buffer.toString("binary", start, end);
      // save view
      const linenr = tileY.toString();
      const linedata = buffer2str; // "test" + linenr.toString();
      const attachment = await rxdbDoc.putAttachment({ id: linenr, data: linedata, type: "text/plain" });
    }
    */

    /*
    const allAttachments = await rxdbDoc.allAttachments();
    const jsonDocuments = await this.getDocumentsAsJson();
    const jsonCollection = await this.getCollectionAsJson();
    */
    //clog("#########2:: ", rxdbDoc, newAttachment, allAttachments, jsonDocuments, jsonCollection);

    //return rxdbDoc;
  }


/*
async DEBUG_createTestData(_mapWidth, _mapHeight) {
  // delete all documents in collection
  //await this.collection.find().remove();

  // read from data-memory
  const mapid = 0;
  const bufferbytes = 1;
  const mapWidth  = _mapWidth || 5;
  const mapHeight = _mapHeight|| 5;

  // fill data-memory with fake data
  let tempstring = "";
  //const tempbuffer = Buffer.alloc(bufferbytes * mapWidth * mapHeight);
  for (let tileY = 0; tileY < mapHeight; tileY++) {
    for (let tileX = 0; tileX < mapWidth; tileX++) {
      const obj = { assetID: 0, frameID: 32, };

      switch (global.random(9)) {
        case 0: obj.frameID = global.random(30); break; // animation state of boy (0 .. 30)
        case 1: obj.frameID = 31; break; // boy, not animatable
        default:obj.frameID = 32; // empty block
      };

      //const idx = bufferbytes * (tileX + tileY * mapWidth);
      //tempbuffer[idx] = bytebuffer4Tilemap.groundlayer_objectToUint8(obj);

      const byte = bytebuffer4Tilemap.groundlayer_objectToUint8(obj);
      const char = String.fromCharCode(byte);
      tempstring = tempstring + char;
    }
  }

  //this.data.buffer[0] = global.random(64);

  global.log("#########1:: ", bufferbytes, mapWidth, mapHeight, tempstring.length);

  // convert buffer to string
  //const bufferAsString = tempbuffer.toString("binary");
  const bufferAsString = tempstring;

  // create or update document
  const jsonDoc = {
    _id: documentSchemaData._id, // "clientonly" -> always the same document
    mapid: mapid,
    bufferbytes: bufferbytes,
    mapWidth: mapWidth,
    mapHeight: mapHeight,
    updatedAt: unixtime(),
    bufferHash: createHashFromString(bufferAsString),
  };
  const rxdbDoc = await this.collection.upsert(jsonDoc); // create or replace database-document (attachments will be deleted)

  // remove old attachment
  //const oldAttachment = rxdbDoc.getAttachment('bufferAsString');
  //if (oldAttachment) await oldAttachment.remove();

  // add string as attachment to document
  const newAttachment = await rxdbDoc.putAttachment({ id: "bufferAsString", data: bufferAsString, type: "text/plain" });


  await this.syncRxdbToMemory();

  const allAttachments = await rxdbDoc.allAttachments();
  const jsonDocuments = await this.getDocumentsAsJson();
  const jsonCollection = await this.getCollectionAsJson();
  global.log("#########2:: ", rxdbDoc, newAttachment, allAttachments, jsonDocuments, jsonCollection);

}
*/
};


// ===============================================
// SERVER-API-Calls
// ===============================================
const servercall_getGameMapIfNecessary = async (mapid, bufferHash) => {
  const ioRoute = "free/game/baselayer/getifnecessary";
  const req = {
    mapid: mapid,
    bufferHash: bufferHash || "",
  }
  let res = null;
  let err = null;
  try {
    if (isNaN(mapid)) throw "no map-id";
    res = await socketio.emitWithTimeout(ioRoute, req,);
    // res = { user: {xxx}, usercard: {xxx}, _callstats: {xxx}, }
    //global.log("***!!!!!!!!!!!!!! getUserStoreFromServer:: ", res, )
  } catch (error) {
    err = error;
  } finally {
    global.log("GameCollection:: (socketio,route,req,err,res):: ", socketio, ioRoute, req, err, res)
    return { err: err, res: res };
  }
};
