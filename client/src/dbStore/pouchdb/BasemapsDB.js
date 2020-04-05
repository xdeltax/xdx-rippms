import debuglog from "../../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import PrototypeDatabase from "./PrototypeDatabase.mjs";

import crypto from "crypto";

//import deepCopy from '../../tools/deepCopyObject.js';
import {unixtime} from "../../tools/datetime.mjs";
import {random} from "../../tools/random.mjs";
import * as bytebuffer4Tilemap from "../../tools/bytebuffer4Tilemap.mjs";

//const createHashFromObject = (obj) => crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex');
const createHashFromString = (str) => crypto.createHash('sha1').update(str).digest('hex');

// ===============================================
// collection-name
// ===============================================
const _DATABASENAME_ = "basemaps"; // only lowercase allowed

// ===============================================
// collection-schema
// ===============================================
const documentSchema = {
  version: 0,
  title: _DATABASENAME_,
  description: _DATABASENAME_,
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

//const migrationStrategies = null;
const migrationStrategies = {
  /*
  1: function(oldDoc) { // 1 means, this transforms data from version 0 to version 1
    //oldDoc.time = new Date(oldDoc.time).getTime(); // string to unix
    return oldDoc;
  }
  */
}

export default class BasemapsDB extends PrototypeDatabase {
  constructor(dbName) {
    if (!dbName) dbName = _DATABASENAME_; // only lowercase allowed
    super(dbName, documentSchema, migrationStrategies); // open/create database and create/connect collection
  }

  async init() {
    
  }

  async DEBUG_createTestData(_mapid, _mapWidth, _mapHeight) {
    //await this.collection.find().remove(); // delete all documents in collection

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

        const byte = bytebuffer4Tilemap.groundlayer_objectToUint8(obj);
        const char = String.fromCharCode(byte);
        tempstring = tempstring + char;
      }
    }

    clog("DEBUG_createTestData:: #########::1:: ", bufferbytes, mapWidth, mapHeight, tempstring.length);

    // convert buffer to string
    //const bufferAsString = tempbuffer.toString("binary");
    const bufferAsString = tempstring;

    // create or update document
    const jsonDoc = {
      _id: "map" + mapid, // string //documentSchemaData._id, // "clientonly" -> always the same document
      mapid: ""+mapid, // string
      tilesetid: ""+tilesetid, // string
      bufferbytes: +bufferbytes, // integer
      mapwidth: +mapWidth, // integer
      mapheight: +mapHeight, // integer
      bufferhash: createHashFromString(bufferAsString), // string
    };
    const rxdbDoc = await this.collection.upsert(jsonDoc); // create or replace database-document (attachments will be deleted)

    clog("DEBUG_createTestData:: #########::2:: ", jsonDoc.bufferHash);

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

        clog("DEBUG_createTestData:: #########::3:: ", idxA, idxB, substr.length);
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
    // remove old attachment
    //const oldAttachment = rxdbDoc.getAttachment('bufferAsString');
    //if (oldAttachment) await oldAttachment.remove();


    const allAttachments = await rxdbDoc.allAttachments();
    const jsonDocuments = await this.getDocumentsAsJson();
    const jsonCollection = await this.getCollectionAsJson();
    */
    //clog("#########2:: ", rxdbDoc, newAttachment, allAttachments, jsonDocuments, jsonCollection);

    return rxdbDoc;
  }
};
