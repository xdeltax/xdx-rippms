import debuglog from "../../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import path from 'path';
import {abs_path} from "../../basepath.mjs";

import RxDB from 'rxdb';

// database
import RxDBPouchDBAdapterNodeWebsql from 'pouchdb-adapter-node-websql';
import RxDBZSchemaValidateModule from 'rxdb/dist/lib/plugins/validate-z-schema.js';

//import RxDBServerPlugin from 'rxdb/dist/lib/plugins/server.js'; // add the server-plugin

// collections
import GameCollection from "./GameCollection.mjs";

class RXDBDatabase {
  get databaseURL()   { return process.env.DATABASE_RXDB_URL; }
  get databaseName()  { return process.env.DATABASE_RXDB_DATABASENAME; }
  get fullpath()      { return abs_path(path.join("..", this.databaseURL, this.databaseName)); }

  constructor() {
    // database
    this.db = null;
    // collections
    this.game = null;
  };

  get db() { return (this._db) ? this._db : null; }
  set db(v){ this._db = v; }

  get game() { return this._gameCollection; }
  set game(v){ this._gameCollection = v; }

  async initDatabase() {
    // ===============================================
    // create / open database
    // ===============================================
    await this.loadPlugins();
    await this.openDatabase(); // create this._db

    this.game = new GameCollection(this.db); // return collection-ref

    // ===============================================
    // create / open collections
    // ===============================================
    await this.game.initCollection();// return collection-ref

    return this;
  }

  // ===============================================
  // database-stuff
  // ===============================================
  async closeDatabase() {
    if (this.db) await this.db.destroy();
    this.game = null;
    this.db = null;
  }

  async removeDatabase() {
    if (this.db) await this.db.remove();
  }

  async database2json() { // export collection to json
    return (!this.db) ? null : await this.db.dump(true);
  }

  async json2database(json) {  // import json to collection
    if (this.db) await this.db.importDump(json);
  }

  // ===============================================
  // helpers
  // ===============================================
  openDatabase = async () => { // static method (not affected by instance) -> called with classname: DBGeoData.load
    if (this.db) return true;

    this.db = await RxDB.create({
      name: this.fullpath,
      adapter: 'websql',            // <- storage-adapter
      //password: 'myPassword',     // <- password (optional)
      //multiInstance: true,        // <- multiInstance (optional, default: true)
      //queryChangeDetection: false // <- queryChangeDetection (optional, default: false)
    });
    clog("created database:: ", this.db.name, ); // full

    // enable leader-election
    this.db.waitForLeadership().then(() => {
      clog("leader elected:: "); // full
    });

    return true;
  }; // of openDatabase

  loadPlugins = async () => {
    // plugins
    //RxDB.plugin(RxDBErrorMessagesModule);
    RxDB.plugin(RxDBPouchDBAdapterNodeWebsql);

    RxDB.plugin(RxDBZSchemaValidateModule);
    //RxDB.plugin(RxDBNoValidateModule);

    //RxDB.plugin(RxDBServerPlugin);

    // check adapter
    const isUsable = await RxDB.checkAdapter('websql');
    //global.log("RXDBPrototype:: check if rxdb adapter:: isUsable:: ", isUsable, this.fullpath, this.databaseURL, this.databaseName);
    return isUsable;
  }; // of loadPlugins
};

const rxdbDatabase = new RXDBDatabase();
export default rxdbDatabase;
