import MobxRxdbPrototype from "./MobxRxdbPrototype";
import {runInAction, toJS, } from 'mobx';
import deepCopy from 'tools/deepCopyObject';
import {unixtime} from "tools/datetime";
import * as bytebuffer4Tilemap from "game/tools/bytebuffer4Tilemap";

import socketio from 'api/socket'; // socket

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
  bufferstring: "",
  //bufferWasUpdated: false, // indicator for tilemap-renderer if buffer is dirty and needs a rerender! -> true => trigger new render in tilemap-renderer;
};

let _bufferWasUpdated = false; // indicator for tilemap-renderer if buffer is dirty and needs a rerender! -> true => trigger new render in tilemap-renderer;

// ===============================================
// collection-schema
// ===============================================
const documentSchemaRxdb = {
  version: 0,
  title: "gameMobx",
  description: "",
  type: "object",
  keyCompression: false,
  properties: {
    _id:        { type: "string", primary: true }, // primary: unique, indexed, required
    updatedAt:  { type: "number", },

    mapid:      { type: "number", default: 0 },

    bufferbytes:{ type: "number", default: 1 },
    width:      { type: "number", default: 100 },
    height:     { type: "number", default: 100 },
  },
  required: ["updatedAt"], // required for every document
  attachments: { "encrypted": false }, // tilemap groundlayer -> local indexeddb -> stored as attachment to document as a string (buffer.toString("binary"))
};

const migrationStrategies = null;


export default class MobxRxdbGameCollection extends MobxRxdbPrototype {
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

  get bufferWasUpdated() { return _bufferWasUpdated || false; }
  set bufferWasUpdated(v){ _bufferWasUpdated = v || false; }

  get buffer() { return this.data.buffer }
  set buffer(v){ this.data.buffer = v; }

  get bufferString() { return this.data.bufferstring }
  set bufferString(v){ this.data.bufferstring = v; }

  async syncServerDatabaseToLocalRxdb() {
    //socketio
    this.syncRxdbToMemory();
  }

  async syncRxdbToMemory() {
    // get doument to sync
    const rxdbDocData = await this.collection.findOne().where("_id").eq(this._documentSchemaData._id || "clientonly").exec();

    if (!rxdbDocData) {
      // if not exsist ->
      // copy default-values to memory
      this._data = deepCopy(this._documentSchemaData);
      runInAction(()=>{ this._mobx = this._documentSchemaMobx });
    } else {
      // if exist ->
      // get attachment (tilemap as string) from local-database
      const attachment = rxdbDocData.getAttachment("bufferAsString");

      // convert attachment to string
      const attAsString = await attachment.getStringData(); // 100 ms
      // convert attachment to buffer
      //const buffer = Buffer.from(attAsString, "binary"); // 500 ms
      // cast buffer as uint8
      //const uint8 = new Uint8Array(buffer2); // 10 ms

      // create data-memory-object
      const jsonDocData = rxdbDocData.toJSON();
      const dataObject = {
        _id: "clientonly",
        updatedAt: jsonDocData.updatedAt,
        mapid: jsonDocData.mapid,
        bufferbytes: jsonDocData.bufferbytes,
        width: jsonDocData.width,
        height: jsonDocData.height,
        //buffer: buffer, // tilemap groundlayer -> in memory -> access from game
        bufferstring: attAsString,
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

      global.log("***GameMobxCollection***syncRxdbToMemory***:: ", attAsString, attAsString.length, rxdbDocData, jsonDocData, this._data, this.getalldata, this.getallmobx)
    }
  };


  async createTestData() {
    // delete all documents in collection
    //await this.collection.find().remove();

    // read from data-memory
    const mapid = 0;
    const bufferbytes = 1;
    const mapwidth  = 500;
    const mapheight = 500;

    // fill data-memory with fake data
    this.data.buffer = Buffer.alloc(bufferbytes * mapwidth * mapheight);
    const dataview = this.data.buffer;
    for (let tileY = 0; tileY < mapheight; tileY++) {
      for (let tileX = 0; tileX < mapwidth; tileX++) {
        const obj = { assetID: 0, frameID: 32, };

        switch (global.random(9)) {
          case 0: obj.frameID = global.random(30); break; // animation state of boy (0 .. 30)
          case 1: obj.frameID = 31; break; // boy, not animatable
          default:obj.frameID = 32; // empty block
        };

        const idx = bufferbytes * (tileX + tileY * mapwidth);
        dataview[idx] = bytebuffer4Tilemap.groundlayer_objectToUint8(obj);
      }
    }

    this.data.buffer[0] = global.random(64);

    global.log("#########1:: ", bufferbytes, mapwidth, mapheight, dataview);

    // convert buffer to string
    const buffer2str = this.data.buffer.toString("binary");

    // create or update document
    const jsonDoc = {
      _id: documentSchemaData._id, // "clientonly" -> always the same document
      mapid: mapid,
      bufferbytes: bufferbytes,
      width: mapwidth,
      height: mapheight,
      updatedAt: unixtime(),
    };
    const rxdbDoc = await this.collection.upsert(jsonDoc); // create or replace database-document (attachments will be deleted)

    // remove old attachment
    //const oldAttachment = rxdbDoc.getAttachment('bufferAsString');
    //if (oldAttachment) await oldAttachment.remove();

    // add string as attachment to document
    const newAttachment = await rxdbDoc.putAttachment({ id: "bufferAsString", data: buffer2str, type: "text/plain" });

    /*
    // add 1 attachment per line to document
    for (let tileY = 0; tileY < mapheight; tileY++) {
      // create view
      const start = tileY * mapwidth;
      const end = start + mapwidth - 1;
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
