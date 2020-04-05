import RxDB from 'rxdb';

// database
import RxDBPouchDBAdapterIDB from 'pouchdb-adapter-idb';
//import RxDBPouchDBAdapterHTTP from 'pouchdb-adapter-http';
//import RxDBNoValidateModule from 'rxdb/plugins/no-validate';
import RxDBZSchemaValidateModule from 'rxdb/plugins/validate-z-schema';

// collections
import AppCollection  from "./AppCollection";
import UserCollection from "./UserCollection";

class RXDBStore {
  get databaseURL()   { return ""; /*process.env.DATABASE_RXDB_URL;*/ }
  get databaseName()  { return "rxdb_xdxapp"; /*process.env.DATABASE_RXDB_DATABASENAME;*/ }
  get fullpath()      { return this.databaseURL + this.databaseName; /*abs_path(path.join("..", this.databaseURL, this.databaseName));*/ }

  constructor() {
    // database
    this.db = null;
    // collections
    this.app  = null;
    this.user = null;
  };

  get db() { return this._db; }
  set db(v){ this._db = v; }

  get app() { return this._appCollection; }
  set app(v){ this._appCollection = v; }

  get user() { return this._userCollection; }
  set user(v){ this._userCollection = v; }

  async initDatabase() {
    // ===============================================
    // create / open database
    // ===============================================
    await this.loadPlugins();
    await this.openDatabase(); // create this._db

    this.app  = new AppCollection(this.db);  // return collection-ref
    this.user = new UserCollection(this.db); // return collection-ref

    // ===============================================
    // create / open collections
    // ===============================================
    await this.app.initCollection(); // return collection-ref
    await this.user.initCollection();// return collection-ref
  }

  // ===============================================
  // database-stuff
  // ===============================================
  async closeDatabase() {
    if (this.db) await this.db.destroy();
    this.app = null;
    this.user = null;
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
    //RxDB.plugin(RxDBErrorMessagesModule);
    RxDB.plugin(RxDBPouchDBAdapterIDB);
    //RxDB.plugin(RxDBPouchDBAdapterHTTP);

    RxDB.plugin(RxDBZSchemaValidateModule);
    //RxDB.plugin(RxDBNoValidateModule);

    // check adapter
    const isUsable = await RxDB.checkAdapter('idb');
    //global.log("RXDBPrototype:: check if rxdb adapter:: isUsable:: ", isUsable, this.fullpath, this.databaseURL, this.databaseName);
    return isUsable;
  }; // of loadPlugins
};

const rxdbStore = new RXDBStore();
export default rxdbStore;
