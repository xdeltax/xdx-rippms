import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import path from 'path';
import {abs_path, } from "../basepath.mjs";

import RxDB from 'rxdb';
import RxDBPouchDBAdapterNodeWebsql from 'pouchdb-adapter-node-websql';
//import RxDBErrorMessagesModule from 'rxdb/plugins/error-messages';
//import RxDBServerPlugin from 'rxdb/dist/lib/plugins/server.js'; // add the server-plugin

//import { createRequire } from 'module';
//const require = createRequire(import.meta.url);

//https://rxdb.info/rx-schema.html#example
/*
const dbSchema = {
  keyCompression: true, // set this to true, to enable the keyCompression
  title: "hero schema",
  version: 0,
  description: "describes a simple hero",
  type: "object",
  properties: {
      name: { type: "string", primary: true }, // primary: unique, indexed, required
      color: { type: "string", index: true }, // create index for this field
      test: { type: "integer", default: 20}
      "healthpoints": {
          "type": "number",
          "min": 0,
          "max": 100
      },
      "secret": {
          "type": "string",
          "encrypted": true
      },
      "birthyear": {
          "type": "number",
          "final": true,
          "min": 1900,
          "max": 2050
      },
      "skills": {
          "type": "array",
          "maxItems": 5,
          "uniqueItems": true,
          "items": {
              "type": "object",
              "properties": {
                  "name": {
                      "type": "string"
                  },
                  "damage": {
                      "type": "number"
                  }
              }
          }
      }
  },

  required: ["color"], // required for every document
  attachments: { "encrypted": false } // allow attachments (binaries); optional: encrypt with password
};
*/
export default class DBPrototype {
  _collectionName = null;
  _db = null;
  _collection = null;

  constructor(collectionName, schema) {
    this._collectionName = collectionName;
    this._schema = schema;
    this._db = null;
    this._collection = null;

    //this.init(schema);
  }

  get db() { return this._db; }
  set db(v){ this._db = v; }

  get collection() { return this._collection }
  set collection(v){ this._collection = v}

  get collectionName(){ return this._collectionName; }
  get databaseURL()   { return process.env.DATABASE_RXDB_URL; }
  get databaseName()  { return process.env.DATABASE_RXDB_DATABASENAME; }
  get fullpath()      { return abs_path(path.join("..", this.databaseURL, this.databaseName)); }

  async connect() {
    await this.loadDatabaseAdapter();
    await this.openDatabase(this._schema);
    await this.createCollection(this._schema);
    return this._db;
  }

  async loadDatabaseAdapter() {
    // plugins
    //RxDB.plugin(RxDBServerPlugin);
    //RxDB.plugin(RxDBErrorMessagesModule);
    RxDB.plugin(RxDBPouchDBAdapterNodeWebsql); //RxDB.plugin(require('pouchdb-adapter-node-websql'));

    // check adapter
    const isUsable = await RxDB.checkAdapter('websql');
    clog("check if rxdb adapter:: isUsable:: ", isUsable,this.fullpath,this.databaseURL, this.databaseName);

    return true;
  }

  async openDatabase(schema) { // static method (not affected by instance) -> called with classname: DBGeoData.load
    this.db = await RxDB.create({
      name: this.fullpath,
      adapter: 'websql',            // <- storage-adapter
      //password: 'myPassword',     // <- password (optional)
      //multiInstance: true,        // <- multiInstance (optional, default: true)
      //queryChangeDetection: false // <- queryChangeDetection (optional, default: false)
    });
    clog("created database:: ", this.db.name, ); // full
    //console.dir(this.db);


    // enable leader-election
    this.db.waitForLeadership().then(() => {
      //document.title = '♛ ' + document.title;
    });

    return true;
  }; // of connect

  async createCollection(schema) {
    this.collection = await this.db.collection({
      name: this.collectionName,
      schema: schema,
      pouchSettings: {}, // (optional)
      statics: {}, // (optional) // ORM-functions for this collection
      methods: {}, // (optional) ORM-functions for documents
      attachments: {}, // (optional) ORM-functions for attachments
      options: {}, // (optional) Custom paramters that might be used in plugins
      migrationStrategies: {}, // (optional)
      autoMigrate: true, // (optional)
    });
    //console.dir(this.collection);

    // enable replication
    //this.collection.sync({ remote: syncURL + dbName + '/' });

    return true;
  }


  // ===============================================
  // database-stuff
  // ===============================================

  async closeDatabase() {
    if (this.db) await this.db.destroy();
    this.db = null;
  }

  async removeDatabase() {
    if (this.db) await this.db.remove();
  }

  async database2json() { // export collection to json
    return (!this.collection) ? null : await this.db.dump(true)
  }

  async json2database(json) {  // import json to collection
    if (this.collection) await this.db.importDump(json)
  }


  // ===============================================
  // collection-stuff
  // ===============================================

  async getCollectionByName(collectionName) {
    return this.db[collectionName || this.collectionName];
  }

  async removeCollection() {
    return (!this.collection) ? null : await this.collection.remove()
  }

  async collection2json() { // export collection to json
    return (!this.collection) ? null : await this.collection.dump(true)
  }

  async json2collection(json) {  // import json to collection
    if (this.collection) await this.collection.importDump(json)
  }

  /*
  // database adapter
  async count(query)                 { return (!this._collection) ? null : await this._collection.countDocuments(query) : await this.collection.count(query); }
  async countAll()                   { return await this.count( {} ) }

  async find(query, projection)      { return (!this._collection) ? null : await this._collection.find(query, projection || {} ) }   // return cursor
  async findOne(query, options)      { return (!this._collection) ? null : await this._collection.findOne(query, options) }          // return element
  async findAll()                    { return (!this._collection) ? null : await this._collection.find().exec(); }

  //async updateReplace(query, obj)    { return (!this._collection) ? null : await this._collection.update(query, obj, { upsert: true }) }  // numreplaced
  //async updateMod(query, modifiers)  { return (!this._collection) ? null : await this._collection.update(query, modifiers, { upsert: true }) } // numreplaced

  async insertNewOrReplace(obj)      { return (!this._collection) ? null : await this._collection.upsert(obj) }  // return element with its new _id

  async insertNew(obj)               { return (!this._collection) ? null : await this._collection.insert(obj) }  // return element with its new _id
  async insertNewBulk(arrayOfObj)    { return (!this._collection) ? null : await this._collection.bulkInsert(arrayOfObj) }

  //async deleteMany(query)            { return (!this._collection) ? null : await this._collection.remove(query, { multi: true } ) }  // return how many where deleted
  //async deleteOne(query)             { return (!this._collection) ? null : await this._collection.remove(query, {} ) }               // return how many where deleted
  */

  //async createIndex(_prop, _isUnique){ this.isMongoDB() ? await this._collection.createIndex({ _prop: 1, }, { unique: _isUnique, }) : await this.collection.ensureIndex({ fieldName: _prop,  unique: _isUnique }) }

  //////////////////////////////////////////////////////////////////////////////
}
