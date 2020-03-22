import PrototypeMobxRxdb from "./PrototypeMobxRxdb";

import {runInAction, toJS, } from 'mobx';
import deepCopy from 'tools/deepCopyObject';
import {unixtime} from "tools/datetime";
import * as bytebuffer4Tilemap from "game/tools/bytebuffer4Tilemap";
import crypto from "crypto";

import socketio from 'api/socket'; // socket

const createHash = (object) => crypto.createHash('sha1').update(JSON.stringify(object)).digest('hex');

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
  _id: "clientonly",
  updatedAt: 0,

  mapid: 0,

  bufferbytes: 1,
  width: 100,
  height: 100,

  //buffer: null, // tilemap groundlayer -> in memory -> access from game
  bufferAsString: "",
  //bufferWasUpdated: false, // indicator for tilemap-renderer if buffer is dirty and needs a rerender! -> true => trigger new render in tilemap-renderer;
};


// ===============================================
// collection-schema
// ===============================================
const documentSchemaRxdb = {
  version: 0,
  title: "gameMobx",
  description: "one-way-sync only -> mapdata always from server to local",
  type: "object",
  keyCompression: false,
  properties: {
    _id:        { type: "string", primary: true }, // primary: unique, indexed, required
    updatedAt:  { type: "number", },

    mapid:      { type: "number", default: 0 },

    bufferbytes:{ type: "number", default: 1 },
    mapWidth:   { type: "number", default: 100 },
    mapHeight:  { type: "number", default: 100 },

    bufferHash: { type: "string" },
  },
  required: ["updatedAt"], // required for every document
  attachments: { "encrypted": false }, // tilemap groundlayer -> local indexeddb -> stored as attachment to document as a string (buffer.toString("binary"))
};

const migrationStrategies = null;


// ===============================================
// helpers
// ===============================================
let _bufferWasUpdated = false; // indicator for tilemap-renderer if buffer is dirty and needs a rerender! -> true => trigger new render in tilemap-renderer;


export default class MobxRxdbGameCollection extends PrototypeMobxRxdb {
  constructor(databaseRxdb, collectionName) {
    const cName = "gamemobx"; // only lowercase allowed
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
    // 3) sync to mobx and data (or init mobx and data with default if db is empty)
    /*
    if (rxdbDocArray.length > 0) {
      const rxdbDoc = rxdbDocArray[0];
      const allAttachments = await rxdbDoc.allAttachments();
      //global.log("$$$$$$$$$$initCollection 2:: ", rxdbDoc, allAttachments);

    };
    */
    //this.syncRxdbToMemory();
  }


  // ===============================================
  // adater to external data-access
  // ===============================================
  get bufferWasUpdated() { return _bufferWasUpdated || false; }
  set bufferWasUpdated(v){ _bufferWasUpdated = v || false; }

  get buffer() { return this.data.buffer; }
  //set buffer(v){ this.data.buffer = v; }

  get bufferString() { return this.data.bufferAsString; }
  //set bufferString(v){ this.data.bufferAsString = v; }

  get mapWidth() { return this.data.mapWidth; }
  get mapHeight(){ return this.data.mapHeight; }


  // ===============================================
  // one-way-sync-only:: server -> local:: sync external database to local database
  // ===============================================
  async syncServerDatabaseToLocalRxdb() {
    // (1) client-socketio:: send bufferHash and updatedAt to server
    // (2) server: compare hash and updatedAt with server-data
    // (3) server: send back (A) "no update needed" or (B) new data
    // (4) client: (A) do nothing or (B) update local-database and memory
    this.syncRxdbToMemory();
  }


  // ===============================================
  // one-way-sync-only:: local -> memory:: sync local database to memroy (mobx and data)
  // ===============================================
  async syncRxdbToMemory() {
    // get doument to sync
    const rxdbDocData = await this.collection.findOne().where("_id").eq(this._documentSchemaData._id || "clientonly").exec();

    if (!rxdbDocData) { // if not exist ->
      // copy default-values to memory
      this._data = deepCopy(this._documentSchemaData);
      runInAction(()=>{ this._mobx = this._documentSchemaMobx });
    } else { // if exist ->
      // get attachment (tilemap as string) from local-database
      const attachment = rxdbDocData.getAttachment("bufferAsString");

      // convert attachment to string
      const attachementAsString = await attachment.getStringData(); // 100 ms
      // convert attachment to buffer
      //const buffer = Buffer.from(attAsString, "binary"); // 500 ms
      // cast buffer as uint8
      //const uint8 = new Uint8Array(buffer2); // 10 ms

      // convert rxdb-document from local database to json-object
      const jsonDocData = rxdbDocData.toJSON();

      // create data-memory-object from json-object-data of local database
      const dataObject = {
        _id: "clientonly",

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

      global.log("***GameMobxCollection***syncRxdbToMemory***:: ", attachementAsString, attachementAsString.length, rxdbDocData, jsonDocData, this._data, this.getalldata, this.getallmobx)
    }
  };


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
      bufferHash: createHash(bufferAsString),
    };
    const rxdbDoc = await this.collection.upsert(jsonDoc); // create or replace database-document (attachments will be deleted)

    // remove old attachment
    //const oldAttachment = rxdbDoc.getAttachment('bufferAsString');
    //if (oldAttachment) await oldAttachment.remove();

    // add string as attachment to document
    const newAttachment = await rxdbDoc.putAttachment({ id: "bufferAsString", data: bufferAsString, type: "text/plain" });

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

    await this.syncRxdbToMemory();

    const allAttachments = await rxdbDoc.allAttachments();
    const jsonDocuments = await this.getDocumentsAsJson();
    const jsonCollection = await this.getCollectionAsJson();
    global.log("#########2:: ", rxdbDoc, newAttachment, allAttachments, jsonDocuments, jsonCollection);

  }

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

};
