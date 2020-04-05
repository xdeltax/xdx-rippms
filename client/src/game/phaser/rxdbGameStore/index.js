/*
  user
    _id: "user"+userid
    userid:


  basemap (manual sync at game init)
    _id:        { type: "string", primary: true }, // primary: unique, indexed, required
    mapid:      { type: "number", default: 0 },
    tilesetid:  { type: "number", default: 0 },
    bufferbytes:{ type: "number", default: 1 },
    mapWidth:   { type: "number", default: 100 },
    mapHeight:  { type: "number", default: 100 },
    bufferHash: { type: "string", dafault: "" },
    updatedAt:  { type: "number", },
    _attachments: [ strOf1000x1000bytes, strOf1000x1000bytes, strOf1000x1000bytes, ...]

  castles (auto replicate from server to all clients)
    _id: "castle"+xxx
    userid                          owner of castle
    mapid: "map"+mapid              map
    tileX
    tileY
    geoHash



*/
import RxDB from 'rxdb';

// plugins
import RxDBPouchDBAdapterIDB from 'pouchdb-adapter-idb';
import RxDBPouchDBAdapterHTTP from 'pouchdb-adapter-http';
import RxDBZSchemaValidateModule from 'rxdb/plugins/validate-z-schema';
import timestamps from 'rxdb-utils/dist/timestamps.js';

// collections
import BasemapsCollection from "./BasemapsCollection";

class RXDBGameStore {
  get databaseURL()   { return ""; /*process.env.DATABASE_RXDB_URL;*/ }
  get databaseName()  { return "rxdb_xdxgame"; /*process.env.DATABASE_RXDB_DATABASENAME;*/ }
  get fullpath()      { return this.databaseURL + this.databaseName; /*abs_path(path.join("..", this.databaseURL, this.databaseName));*/ }

  constructor() {
    // database
    this.db = null;
    // collections
    this.basemaps = null;
  };

  get db() { return this._db; }
  set db(v){ this._db = v; }

  get basemaps() { return this._basemapsCollection; }
  set basemaps(v){ this._basemapsCollection = v; }

  async initDatabase() {
    if (this.db) return;

    // ===============================================
    // create / open database
    // ===============================================
    await this.loadPlugins();
    await this.openDatabase(); // create this._db

    this.basemaps = new BasemapsCollection(this.db); // return collection-ref

    // ===============================================
    // create / open collections
    // ===============================================
    await this.basemaps.initCollection();// return collection-ref
  }

  // ===============================================
  // database-stuff
  // ===============================================
  async closeDatabase() {
    if (this.db) await this.db.destroy();
    this.basemaps = null;
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

    global.log("RXDBPrototype:: created database:: ", this.fullpath ); // full
    this.db = await RxDB.create({
      name: this.fullpath,
      adapter: 'idb', // name of adapter to define where the data is actually stored at
      //password: 'myPassword',     // <- password (optional)
      multiInstance: true,        // <- multiInstance (optional, default: true)
      //queryChangeDetection: false // <- queryChangeDetection (optional, default: false)
    });
    global.log("RXDBPrototype:: created database:: ", this.db, this.db.name, ); // full
    //console.dir(this.db);

    // enable leader-election
    this.db.waitForLeadership().then(() => {
      global.log("RXDBPrototype:: this tab is leader now!");
      document.title = '♛ ' + document.title;
    });

    return true;
  }; // of openDatabase

  loadPlugins = async () => {
    // plugins
    RxDB.plugin(RxDBPouchDBAdapterIDB);
    RxDB.plugin(RxDBPouchDBAdapterHTTP);

    RxDB.plugin(RxDBZSchemaValidateModule);
    //RxDB.plugin(RxDBNoValidateModule);
    //RxDB.plugin(RxDBErrorMessagesModule);

    RxDB.plugin(timestamps);

    // check adapter
    const isUsable = await RxDB.checkAdapter('idb');
    //global.log("RXDBPrototype:: check if rxdb adapter:: isUsable:: ", isUsable, this.fullpath, this.databaseURL, this.databaseName);
    return isUsable;
  }; // of loadPlugins
};

const rxdbGameStore = new RXDBGameStore();
export default rxdbGameStore;
