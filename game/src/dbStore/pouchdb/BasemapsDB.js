import PrototypeDatabase from "./PrototypeDatabase.js";
import {arrayBufferToBlob} from 'blob-util';
//import {unixtime} from "tools/datetime.js";
import {random} from "tools/random.js";
import * as createHash from "tools/createHash.js";
import * as bytebuffer4Tilemap from "phasergame/tools/bytebuffer4Tilemap.js";
import PouchDB from 'pouchdb-core';

//============================================================================//
import debuglog from "debug/consolelog"; const clog = debuglog("BasemapsDB.js");
//============================================================================//

// ===============================================
// collection-name
// ===============================================
const _DATABASENAME_ = "basemaps"; // only lowercase allowed
const _REV_LIMIT_    = 1; // default: 1000
const _AUTO_COMPACT_ = true; // default: false


export default class BasemapsDB extends PrototypeDatabase {
  get onChangeFromServer() { return this._onChangeFromServer; }
  set onChangeFromServer(v){ this._onChangeFromServer = v; }

  constructor(dbName) {
    if (!dbName) dbName = _DATABASENAME_; // only lowercase allowed
    super(dbName, documentSchema, migrationStrategies, _REV_LIMIT_, _AUTO_COMPACT_); // open/create database and create/connect collection
  }

  async init() {
    await super.init();

    this.onChangeFromServer = (change) => {
      clog("onChangeFromServer:: ", change);
    };

    // subscribe to changes of localdb
    this._subscribeToLocalChanges = this.localdb.changes({live: true, since: "now", include_docs: true,}) // https://pouchdb.com/api.html#changes
    .on('change', (change)=> { this.onChangeFromServer && this.onChangeFromServer(change); }) // handle change
    //.on('complete', (info)=> { clog("TTTTTTTTTTTTTTTTTTTTTTTTTTTi", info); }) // handle complete
    //.on('error', (error)  => { clog("TTTTTTTTTTTTTTTTTTTTTTTTTTTe", error); }) // handle error
    ;

    this._replicateFromServerToLocal = PouchDB.replicate(this.remotedb, this.db, {live: true, retry: true,}) // https://pouchdb.com/api.html#replication
    //.on('change', (info)  => { clog("RRRRRRRRRRRRRRRRRRRRRRRRRRRc", info) }) // handle change
    //.on('paused', (err)   => { cb && cb.onPaused && cb.onPaused(err) }) // replication paused (e.g. replication up to date, user went offline)
    //.on('active', ()      => { cb && cb.onActive && cb.onActive() }) // replicate resumed (e.g. new changes replicating, user went back online)
    //.on('denied', (err)   => { cb && cb.onDenied && cb.onDenied(err) }) // a document failed to replicate (e.g. due to permissions)
    //.on('complete', (info)=> { cb && cb.onComplete && cb.onComplete(info) }) // handle complete
    //.on('error', (err)    => { cb && cb.onError && cb.onError(err) }) // handle error
    ;
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

    clog("DEBUG_createTestData:: #########::1:: ", bufferbytes, mapWidth, mapHeight, );

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
      //bufferhash: createHash.fromString(bufferAsString), // string
    };

    const dbDoc = await this.upsertDocument(jsonDoc);

    clog("DEBUG_createTestData:: #########::2:: ", dbDoc);


    //const blob = await rxdbGameStore.basemap.getAttachmentAsBuffer();
    //const buffer2 = await blob.arrayBuffer();
    //const buffer2 = Buffer.from(attstr, "binary");
    //const uint8 = new Uint8Array(buffer)
    //const dataview2 = new DataView(uint8);
    //const buffer2 = dataview2.buffer;
    //const newbuffer = Buffer.allocUnsafe(10000)
    //const newbuffer = Buffer.from(blob, "binary")


    //const blob = arrayBufferToBlob(buffer, 'text/plain');
    //clog("*** BUFFER BLOB:: ", buffer, blob);
    // client: attachement as blob; server: attachment as buffer
    //const attachementId = "0";
    //const response = await this.addAttachmentToDocument(dbDoc, attachementId, blob, "text/plain");
    // response = { ok: true, id: 'map1', rev: '6-001ac4ee5c41adba7b1e3c008e892bbc' }

    // split buffer in chuncks and save multiple attachments
    const idxStep = 500 * 500;
    let index = 0;
    let idxA = 0;
    let idxB = idxStep;
    do {
      const tmpbuffer = Buffer.alloc(bufferbytes * idxStep);
      const tmpblob = arrayBufferToBlob(tmpbuffer, 'text/plain');
      buffer.copy(tmpbuffer, 0, idxA, idxB); // (target[, targetStart][, sourceStart][, sourceEnd])
      const response = await this.addAttachmentToDocument(dbDoc, ""+index, tmpblob, "text/plain"); // response = { ok: true, id: 'map1', rev: '6-001ac4ee5c41adba7b1e3c008e892bbc' }
      dbDoc._rev = response.rev; // update rev after add of attachement for next add!!!
      clog("DEBUG_createTestData:: #########::3:: ", ""+index, idxA, idxB, response);

      index++;
      idxA = idxB;
      idxB = idxB + idxStep;
    } while (idxB <= totalBytes);


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
    const attachmentId = arrayOfAtt[0][0];
    const attbuffer = await this.getAttachment(docId, attachmentId); // response will be a Blob object in the browser and a Buffer object in Node.js.
    clog("DEBUG_createTestData:: #########::7:: ", attachmentId, Buffer.isBuffer(attbuffer), attbuffer.length, attbuffer);

    const attbuffer2 = await this.getAttachmentAsBuffer(docId, attachmentId); // response will be a Blob object in the browser and a Buffer object in Node.js.
    clog("DEBUG_createTestData:: #########::8:: ", attachmentId, Buffer.isBuffer(attbuffer2), attbuffer2.length, attbuffer2);

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
