import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import fse from 'fs-extra';
import path from 'path';
import Datastore from 'nedb-promises';
import {mongoConnect, mongoCollection} from './adapter/mongodb.mjs';
import {abs_path, } from "../basepath.mjs";

export default class DBPrototype {
  cname = null;
  client = null;
  collection = null;

  constructor(cname) {
    this.cname = cname;
    this.client = null;
    this.collection = null;
    //clog("*** PROTO: constructor:: ", cname, this.cname,)
  }

  collectionName() { return this.cname || null }
  isMongoDB()      { return process.env.DATABASE_TYPE === "mongodb"; }
  databaseURL()    { return this.isMongoDB() ? process.env.DATABASE_MONGO_URL || "" : process.env.DATABASE_NEDB_URL || ""; }
  databaseName()   { return this.isMongoDB() ? process.env.DATABASE_MONGO_DATABASENAME : process.env.DATABASE_NEDB_DATABASENAME || ""; }

  async connect() { // static method (not affected by instance) -> called with classname: DBGeoData.load
    //try {
      this.client = await this.getClient();
      this.collection = await this.getCollection(this.client);
      if (!this.isMongoDB()) this.collection.persistence.setAutocompactionInterval(5);

      //clog("PROTO:: connect:: SUCCESS:: ", this.collection);
      return await this.count();
    /*
    } catch (err) {
      clog("connect:: ERROR:: ", err);
      this.close();
      return null;
    }
    */
  }; // of connect

  close() {
    if (this.client) this.client.close();
    this.collection = null;
    this.client = null;
  }

  // database adapter
  async count(query)                 { return (!this.collection) ? null : this.isMongoDB() ? await this.collection.countDocuments(query) : await this.collection.count(query); }
  async countAll()                   { return await this.count( {} ) }
  async find(query, projection)      { return (!this.collection) ? null : await this.collection.find(query, projection || {} ) }   // return cursor
  async findOne(query, options)      { return (!this.collection) ? null : await this.collection.findOne(query, options) }          // return element
  async findAll()                    { return await this.find( {} , {} ) }
  async updateFull(query, obj)       { return (!this.collection) ? null : await this.collection.update(query, obj, { upsert: true }) }  // numreplaced
  async updateMod(query, modifiers)  { return (!this.collection) ? null : await this.collection.update(query, modifiers, { upsert: true }) } // numreplaced
  async insertNew(obj)               { return (!this.collection) ? null : await this.collection.insert(obj) }                      // return element with its new _id
  async deleteMany(query)            { return (!this.collection) ? null : await this.collection.remove(query, { multi: true } ) }  // return how many where deleted
  async deleteOne(query)             { return (!this.collection) ? null : await this.collection.remove(query, {} ) }               // return how many where deleted
  async createIndex(_prop, _isUnique){ this.isMongoDB() ? await this.collection.createIndex({ _prop: 1, }, { unique: _isUnique, }) : await this.collection.ensureIndex({ fieldName: _prop,  unique: _isUnique }) }

  getFullUrl() {
     return this.isMongoDB()
     ? this.databaseURL()
     : this.databaseURL()
     ? abs_path(path.join("..", this.databaseURL(), this.databaseName()))
     : null;
   }

  async getClient() {
    const _url = this.getFullUrl();
    if (!this.isMongoDB()) fse.ensureDirSync(_url, { mode: 0o0600, }); // nedb
    return this.isMongoDB() ? await mongoConnect(_url) : _url;
  }

  async getCollection(_client) {
    return this.isMongoDB()
    ? await mongoCollection(_client, this.databaseName(), this.collectionName())
    : Datastore.create(path.join(_client, this.collectionName() + ".txt"));
  }

  //////////////////////////////////////////////////////////////////////////////
}
