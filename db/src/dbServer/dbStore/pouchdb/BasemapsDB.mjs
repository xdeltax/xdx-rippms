import debuglog from "../../../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import PrototypeDatabase from "./PrototypeDatabase.mjs";

//import deepCopy from '../../../tools/deepCopyObject.js';
import {unixtime} from "../../../tools/datetime.mjs";
import {random} from "../../../tools/random.mjs";
import * as createHash from "../../../tools/createHash.js";
import * as bytebuffer4Tilemap from "../../../tools/bytebuffer4Tilemap.mjs";

// ===============================================
// database-name
// ===============================================
const _DATABASENAME_ = "basemaps"; // only lowercase allowed
const _REV_LIMIT_    = 10; // default: 1000
const _AUTO_COMPACT_ = true; // default: false

const _DESIGNDOCUMENT_ = {
   _id: "_design/xdx",
   validate_doc_update: "function(newDoc, oldDoc, userCtx) { throw({forbidden : 'not able now!'}); }",
   //filters: { "by_agent": function(doc, req) { return doc.agent === req.query.agent; }.toString() },
};

export default class BasemapsDB extends PrototypeDatabase {
  constructor(dbName) {
    if (!dbName) dbName = _DATABASENAME_; // only lowercase allowed
    super(dbName, documentSchema, migrationStrategies, _REV_LIMIT_, _AUTO_COMPACT_); // open/create database and create/connect collection
  }

  async init() {
    await super.init();

    // add design-document: restrict access to server
    const designdoc = await this.getOneDocumentFailsafe(_DESIGNDOCUMENT_._id);
    if (!designdoc && _DESIGNDOCUMENT_) await this.upsertDocument(_DESIGNDOCUMENT_);
    //clog("XXX:: ", "insert/update design-doc::" , designdoc);
    //DELETE DESIGN-DOC:: curl -v -X DELETE http://localhost:3333/db/basemaps/_design/xdx
    //curl -X PUT http://127.0.0.1:5984/db/basemaps/_design/xdx -d '{"validate_doc_update": "function(newDoc, oldDoc, userCtx) { throw({forbidden: \"not able now!\" });}"}'
    //GET curl -X GET http://localhost:3333/db/basemaps/_design/basemaps

    const doc = {
      _id: "testid",
      testkey: "test" + random(10),
      time: unixtime(),
    };
    //clog("XXX:: ", "insert/update doc::" , doc);
    //this._db.put({_id: "test", item: "test"}, function callback(err, result) {
    const newdoc = await this.upsertDocument(doc);
    clog("XXX:: ", "insert/update newdoc::" , newdoc);

    //const getdoc = await this.getOneDocumentFailsafe("testid"/*newdoc._id*/);
    //clog("XXX:: ", "insert/update getdoc::" , newdoc);

  }




  async DEBUG_createTestData(_mapid, _mapWidth, _mapHeight) {
    //await this.collection.find().remove(); // delete all documents in collection

    const mapid =_mapid || 0;
    const tilesetid = 0;
    const bufferbytes = 1;
    const mapWidth  = _mapWidth || 5;
    const mapHeight = _mapHeight|| 5;

    // fill data-memory with fake data
    //let tempstring = "";
    const totalBytes = bufferbytes * mapWidth * mapHeight;
    const buffer = Buffer.alloc(totalBytes);
    for (let tileY = 0; tileY < mapHeight; tileY++) {
      for (let tileX = 0; tileX < mapWidth; tileX++) {
        const obj = { assetID: 0, frameID: 32, };

        switch (random(9)) {
          case 0: obj.frameID = random(30); break; // animation state of boy (0 .. 30)
          case 1: obj.frameID = 31; break; // boy, not animatable
          default:obj.frameID = 32; // empty block
        };

        const byte = bytebuffer4Tilemap.groundlayer_objectToUint8(obj);
        //const char = String.fromCharCode(byte);
        //tempstring = tempstring + char;

        const idx = bufferbytes * (tileX + tileY * mapWidth);
        buffer[idx] = byte;
      }
    }

    clog("DEBUG_createTestData:: #########::1:: ", bufferbytes, mapWidth, mapHeight);

    // convert buffer to string
    //const bufferAsString = tempbuffer.toString("binary");
    //const bufferAsString = tempstring;

    // create or update document
    const jsonDoc = {
      _id: ""+mapid, // string //documentSchemaData._id, // "clientonly" -> always the same document
      mapid: ""+mapid, // string
      tilesetid: ""+tilesetid, // string
      bufferbytes: +bufferbytes, // integer
      mapwidth: +mapWidth, // integer
      mapheight: +mapHeight, // integer
      //bufferhash: "", //createHash.fromString(bufferAsString), // string
    };

    const dbDoc = await this.upsertDocument(jsonDoc);

    clog("DEBUG_createTestData:: #########::2:: ", dbDoc);

    // client: attachement as blob; server: attachment as buffer
    //const attachementId = "0";
    //const response = await this.addAttachmentToDocument(dbDoc, attachementId, buffer, "text/plain");
    // response = { ok: true, id: 'map1', rev: '6-001ac4ee5c41adba7b1e3c008e892bbc' }

    // split buffer in chuncks and save multiple attachments
    const idxStep = 500 * 500;
    let index = 0;
    let idxA = 0;
    let idxB = idxStep;
    do {
      const tmpbuffer = Buffer.alloc(bufferbytes * idxStep);
      buffer.copy(tmpbuffer, 0, idxA, idxB); // (target[, targetStart][, sourceStart][, sourceEnd])
      const response = await this.addAttachmentToDocument(dbDoc, ""+index, tmpbuffer, "text/plain"); // response = { ok: true, id: 'map1', rev: '6-001ac4ee5c41adba7b1e3c008e892bbc' }
      dbDoc._rev = response.rev; // update rev after add of attachement for next add!!!
      clog("DEBUG_createTestData:: #########::3:: ", ""+index, idxA, idxB, response);

      index++;
      idxA = idxB;
      idxB = idxB + idxStep;
    } while (idxB <= totalBytes);

        /*
      buffer.copy(tmpbuffer, 0, idxA, idxB); // (target[, targetStart][, sourceStart][, sourceEnd])
      clog("DEBUG_createTestData:: #########::3:: ", dbDoc, ""+index, response);
      response = await this.addAttachmentToDocument(dbDoc, ""+index, tmpbuffer, "text/plain");
      dbDoc._rev = response.rev; // update rev after add of attachement!!!
      clog("DEBUG_createTestData:: #########::3:: ", dbDoc, ""+index, response);
      */

    // verify
    const foundDoc = await this.getOneDocumentFailsafe(dbDoc._id);
    const docId = foundDoc._id;
    const docRev= foundDoc._rev;
    clog("DEBUG_createTestData:: #########::4:: ", foundDoc);

    const attachmentsObject = foundDoc._attachments; // _attachments = { "att0":{ }, "att1":{ }, ... }
    const arrayOfAtt = Object.entries(attachmentsObject).sort((a, b) => a < b);

    clog("DEBUG_createTestData:: #########::5:: ", arrayOfAtt);

    arrayOfAtt.forEach(([key, value]) => { // convert to sorted array of key / valie-pairs
      const attachmentId = key;
      const attachmentLength = value.length;
      const contentType = value.content_type;
      const attachementMD5 = value.digest;
      clog("DEBUG_createTestData:: #########::6:: ", key, value);
    });

    const [key, value] = arrayOfAtt[0]
    const attachmentId =arrayOfAtt[0][0];
    const attbuffer = await this.getAttachment(docId, attachmentId); // response will be a Blob object in the browser and a Buffer object in Node.js.
    clog("DEBUG_createTestData:: #########::7:: ", attachmentId, Buffer.isBuffer(attbuffer), attbuffer.length, attbuffer);

    const attbuffer2 = await this.getAttachmentAsBuffer(docId, attachmentId); // response will be a Blob object in the browser and a Buffer object in Node.js.
    clog("DEBUG_createTestData:: #########::8:: ", attachmentId, Buffer.isBuffer(attbuffer2), attbuffer2.length, attbuffer2);


    //Buffer.concat([buffer1, buffer2, ...][, totalLength])
    //buf.compare(otherBuffer);
    //buf.copy(targetBuffer[, targetStart][, sourceStart][, sourceEnd])

    return dbDoc;
  }
};

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
