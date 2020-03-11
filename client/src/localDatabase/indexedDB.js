//npm install dexie --save
//npm install dexie-observable --save
//npm install dexie-syncable --save

import Dexie from 'dexie';
import store from 'store'; // mobx-store

/*
const db = new Dexie('xdx-idb');
db.version(1).stores({ todos: '++id' });
export default db;
*/

class IndexedDB extends Dexie {
  blocked: false;
  //myTable: Dexie.Table<State, number>

  constructor () {
    super("xdx-idb-dexie");

    // create the stores and the indexes
    // NOTE: Don’t declare all columns like in SQL. You only declare properties you want to index, that is properties you want to use in a where(…) query.
    // ++ autoincrement key
    // & unique
    // * multi-entry-index
    this.version(1).stores({
      appstate: '++userid, &userid',
      user: '++userid, &userid',
      usercard: '++userid, &userid',
      gameTilemap: '++id', // dataview (do NOT index dataview)
    });
  } // of constructor


  saveDataview = async (_dataview) => {
    // _dataview = { buffer: ArrayBuffer, byteLength: xxx, byteOffset: 0 }
    if (this.blocked) return;
    global.log("_dataview:: ", _dataview, _dataview.length)
    try {
      this.blocked = true;
      const result = await this.gameTilemap.put({ id: 1, dataview: _dataview });
      global.log("indexedDB:: saveDataview:: ", result);
    } finally {
      this.blocked = false;
    }
  }

  loadDataview = async () => {
    // _dataview = { buffer: ArrayBuffer, byteLength: xxx, byteOffset: 0 }
    if (this.blocked) return;
    try {
      this.blocked = true;
      const dataview = await this.gameTilemap.get({ id: 1 });
      global.log("indexedDB:: loadDataview:: ", dataview);
      return dataview;
    } catch (error) {
      return null;
    } finally {
      this.blocked = false;
    }
  }

  save = async (force) => {
    if (global.DEBUG_DISABLE_PERSISTENSAVEONCLOSEAPP && !force) return;

    store.appState.set("state.dataRelevance.localstorage.lastWriteCall", global.now());

    /*const state    = */store.appState.get_obj_observables("state");
    /*const user     = */store.user.get_all_observables();
    /*const game     = */store.game.get_all_observables();
    /*const gameMap  = */store.gameMap.get_all();
  }


  load = async (force) => {
    if (global.DEBUG_DISABLE_PERSISTENLOADONOPENAPP && !force) return;

    const data = await this.where()

    store.appState.clear_obj_observables("state");
    store.appState.merge_obj_observables("state", data.storedata);

    store.appState.set("state.dataRelevance.localstorage.lastReadCall", global.now());
  }

}

// create instance
const indexedDB = new IndexedDB();

// export instance
export default indexedDB;
