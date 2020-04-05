//import debuglog from "debug/consolelog.mjs"; const clog = debuglog(import.meta.url);

// databases
import BasemapsDB from "./pouchdb/BasemapsDB.js";


class PouchDBStore {
  get objects() { return this._objects; }
  get basemaps() { return this._basemaps; }

  constructor() {
    // ===============================================
    // create / open database
    // ===============================================
    this.basemaps = new BasemapsDB();
  };

  async init() {
    await this.basemaps.init();

    const r1 = await this.basemaps.info();
    const r2 = await this.basemaps.getAllDocuments();

    const r3 = this.basemaps.subscribeToChanges({}, (onChange) => {}, (onComplete) => {}, (onError) => {});
    this.basemaps.unsubscribeToChanges();

    // ===============================================
    // create / open collections
    // ===============================================
    //await this.basemaps.initCollection();// return collection-ref
    //await this.objects.initCollection();// return collection-ref

    return {
      basemaps_database_info: r1,
      basemaps_all_documents: JSON.stringify(r2),
      //r3: JSON.stringify(r3),
    };
  }
};

const pouchDBStore = new PouchDBStore();
export default pouchDBStore;
