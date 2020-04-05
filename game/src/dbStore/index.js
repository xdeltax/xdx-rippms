// databases
import BasemapsDB from "./pouchdb/BasemapsDB.js";

//============================================================================//
import debuglog from "debug/consolelog"; const clog = debuglog("dbStore.js");
//============================================================================//

class DBStore {
  get objects()  { return this._objects; }
  get basemaps() { return this._basemaps; }

  constructor() {
    // ===============================================
    // create / open database
    // ===============================================
    this._basemaps = new BasemapsDB();
  };

  async init() {
    await this.basemaps.init();

    const r1 = await this.basemaps.info();
    const r2 = await this.basemaps.getAllDocuments();

    this.basemaps.subscribeToChanges({}, (onChange) => {}, (onComplete) => {}, (onError) => {});
    this.basemaps.unsubscribeToChanges();

    // ===============================================
    // create / open collections
    // ===============================================
    //await this.basemaps.initCollection();// return collection-ref
    //await this.objects.initCollection();// return collection-ref

    clog("basemap:: ", r1, r2);

    return {
      basemaps_database_info: r1,
      basemaps_all_documents: JSON.stringify(r2),
      //r3: JSON.stringify(r3),
    };
  }
};

const dbStore = new DBStore();
export default dbStore;
