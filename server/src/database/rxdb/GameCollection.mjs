import debuglog from "../../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import PrototypeRxdb from "./PrototypeRxdb.mjs";

import crypto from "crypto";

import deepCopy from '../../tools/deepCopyObject.js';
import {unixtime} from "../../tools/datetime.mjs";
import {random} from "../../tools/random.mjs";
import * as bytebuffer4Tilemap from "../../tools/bytebuffer4Tilemap.mjs";

import {injectStats} from "../../socket/injectStats.mjs";

//import socketio from 'api/socket'; // socket

//const createHashFromObject = (obj) => crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex');
const createHashFromString = (str) => crypto.createHash('sha1').update(str).digest('hex');


// ===============================================
// collection-schema
// ===============================================
const documentSchemaRxdb = {
  version: 0,
  title: "game",
  description: "one-way-sync only -> mapdata always from server to local",
  type: "object",
  keyCompression: false,
  properties: {
    _id:        { type: "string", primary: true }, // primary: unique, indexed, required
    updatedAt:  { type: "number", },

    mapID:      { type: "number", default: 0, unique: true, },
    tilesetID:  { type: "number", default: 0 },

    bufferbytes:{ type: "number", default: 1 },
    mapWidth:   { type: "number", default: 100 },
    mapHeight:  { type: "number", default: 100 },

    bufferHash: { type: "string", dafault: "" },
  },
  required: ["updatedAt", "mapID", ], // required for every document
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

export default class RxdbGameCollection extends PrototypeRxdb {
  constructor(db, collectionName) {
    if (!collectionName) collectionName = "game"; // only lowercase allowed
    super(db, collectionName, documentSchemaRxdb, migrationStrategies); // open/create database and create/connect collection
  }


  async initCollection() {
    // 1) create or open collection
    await super.initCollection();

    // 2) read all docs from rxdb; in this case: only 1 doc with _id: "clientonly"
    //const rxdbDocArray = await this.getDocuments(); // [] or [ {documentSchemaRxdb}, {documentSchemaRxdb}, ... ]
    //global.log("$$$$$$$$$$initCollection 1:: ", rxdbDocArray)
    //if (rxdbDocArray.length > 0) { const rxdbDoc = rxdbDocArray[0]; const allAttachments = await rxdbDoc.allAttachments(); global.log("$$$$$$$$$$initCollection 2:: ", rxdbDoc, allAttachments) };

    // do manual in first load of GameContainer.js <- await this.syncCollection();
  }



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

    clog("DEBUG_createTestData:: #########::1:: ", bufferbytes, mapWidth, mapHeight, tempstring.length);

    // convert buffer to string
    //const bufferAsString = tempbuffer.toString("binary");
    const bufferAsString = tempstring;

    // create or update document
    const jsonDoc = {
      _id: "map" + mapid, //documentSchemaData._id, // "clientonly" -> always the same document
      mapID: mapid,
      tilesetID: tilesetid,
      bufferbytes: bufferbytes,
      mapWidth: mapWidth,
      mapHeight: mapHeight,
      updatedAt: unixtime(),
      bufferHash: createHashFromString(bufferAsString),
    };
    const rxdbDoc = await this.collection.upsert(jsonDoc); // create or replace database-document (attachments will be deleted)

    clog("DEBUG_createTestData:: #########::2:: ", jsonDoc.bufferHash);

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
    const allAttachments = await rxdbDoc.allAttachments();
    const jsonDocuments = await this.getDocumentsAsJson();
    const jsonCollection = await this.getCollectionAsJson();
    */
    //clog("#########2:: ", rxdbDoc, newAttachment, allAttachments, jsonDocuments, jsonCollection);

    return rxdbDoc;
  }





  // ===============================================
  //
  // SERVER-API-operations
  //
  // ===============================================
  servercall_getGameMapIfNecessary = async (req, clientEmitCallback) => {
    let err = "undefined";
    let res = null;
    try {
      ////////////////////////////////////////////////////////////////////////////
      const { mapid, bufferHash, } = req || {}; // map-data stored on client
      ////////////////////////////////////////////////////////////////////////////
      const { err: err_user, res: res_user } = await dbMaps.get(null, null, null);
      ////////////////////////////////////////////////////////////////////////////
      err = err_user;
      res = res_user;
      ////////////////////////////////////////////////////////////////////////////
      err = null;
      res = {
        status: "serverresponse",
        clienttext: text,
        clienttime: clienttime,
        servertime: unixtime(),
      }
      ////////////////////////////////////////////////////////////////////////////
    } catch (error) {
      err = error.message; // convert Error-object to String
    } finally {
      clog("socket.on(routeFree_testServerResponse):: ", err, res);
      clientEmitCallback && clientEmitCallback(err, injectStats(req, res)); // callback to clients emit-function
    }
  }

};
