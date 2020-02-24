import store from 'store'; // mobx-store
//import { toJS, }  from 'mobx';
import {createDatastoreASYNC, updatedbASYNC, dbFindOneASYNC, removedbASYNC, } from './dbProvider.js';

// AppLandingPage:: event "beforeunload" and componentWillUnmount
export const loadFromPersistentDatabase = async (force) => {
  if (global.DEBUG_DISABLE_PERSISTENLOADONOPENAPP && !force) return;

  try {
    global.log("persistent:: loadFromPersistentDatabase:: create database ", );
    const localDBapp  = await createDatastoreASYNC('xdx-appstate');
    const localDBuser = await createDatastoreASYNC('xdx-user');
    const localDBgame = await createDatastoreASYNC('xdx-game');
    const localDBgameNonO = await createDatastoreASYNC('xdx-gameNonO');

    const state = await dbFindOneASYNC(localDBapp, 'state'); // load persit state
    global.log("persistent:: loadFromPersistentDatabase:: state:: ", state);
    if ( state
      && state.hasOwnProperty("storename")
      && state.hasOwnProperty("storedata")
      && state.hasOwnProperty("createdAt")
      && state.hasOwnProperty("updatedAt")
    ) {
      global.log("persistent:: loadFromPersistentDatabase:: merge_all:: appstate.storedata:: ", state.storedata);
      store.appstate.clear_obj("state");
      store.appstate.merge_obj("state", state.storedata);

      store.appstate.set("state.dataRelevance.localstorage.lastReadCall", global.now());
    };

    const user = await dbFindOneASYNC(localDBuser, 'user'); // load persit state
    global.log("persistent:: loadFromPersistentDatabase:: user:: ", user);

    if ( user
      && user.hasOwnProperty("storename")
      && user.hasOwnProperty("storedata")
      && user.hasOwnProperty("createdAt")
      && user.hasOwnProperty("updatedAt")
      //&& user.storedata.hasOwnProperty("user")
      //&& user.storedata.user.hasOwnProperty("userid")
      //&& user.storedata.user.hasOwnProperty("servertoken")
    ) {
      global.log("persistent:: loadFromPersistentDatabase:: merge_all:: user.storedata:: ", user.storedata)
      store.user.clear();
      store.user.merge_all(user.storedata);
    };


    const gameNonO = await dbFindOneASYNC(localDBgameNonO, 'gameNonO'); // load persit state
    global.log("persistent:: loadFromPersistentDatabase:: gameNonO:: ", gameNonO);
    if ( gameNonO
      && gameNonO.hasOwnProperty("storename")
      && gameNonO.hasOwnProperty("storedata")
      && gameNonO.hasOwnProperty("createdAt")
      && gameNonO.hasOwnProperty("updatedAt")
    ) {
      global.log("persistent:: loadFromPersistentDatabase:: merge_all:: game.storedata:: ", gameNonO.storedata)
      store.gameNonO.clear();
      store.gameNonO.merge_all(game.storedata);
    };

    const game = await dbFindOneASYNC(localDBgame, 'game'); // load persit state
    global.log("persistent:: loadFromPersistentDatabase:: game:: ", game);
    if ( game
      && game.hasOwnProperty("storename")
      && game.hasOwnProperty("storedata")
      && game.hasOwnProperty("createdAt")
      && game.hasOwnProperty("updatedAt")
    ) {
      global.log("persistent:: loadFromPersistentDatabase:: merge_all:: game.storedata:: ", game.storedata)
      store.game.clear();
      store.game.merge_all(game.storedata);
    };


  } catch (error) {
    global.log("persistent:: loadFromPersistentDatabase:: ERROR:: ", error);
    // fail silent
    // throw error
  } finally {
  }
}

// AppLandingPage:: componentDidMount
export const saveToPersistentDatabase = (force) => {
  if (global.DEBUG_DISABLE_PERSISTENSAVEONCLOSEAPP && !force) return;

  try {
    store.appstate.set("state.dataRelevance.localstorage.lastWriteCall", global.now());

    const state    = store.appstate.get_obj("state");
    const user     = store.user.get_all();
    const game     = store.game.get_all();
    const gameNonO = store.gameNonO.get_all();

    try {
      global.log("persistent:: saveToPersistentDatabase.", );
      createDatastoreASYNC('xdx-appstate').then(localDB =>updatedbASYNC(localDB, 'state', state));
      createDatastoreASYNC('xdx-user'    ).then(localDB=>updatedbASYNC(localDB, 'user', user));
      createDatastoreASYNC('xdx-game'    ).then(localDB=>updatedbASYNC(localDB, 'game', game));
      createDatastoreASYNC('xdx-gameNonO').then(localDB=>updatedbASYNC(localDB, 'gameNonO', gameNonO));
    } catch (error) {
      global.log("persistent:: saveToPersistentDatabase:: ERROR:: ", error);
      // fail silent
      // throw error
    }

    // mobx-store "user":: save user-data to persistent
    try {

    } catch (error) {
      // fail silent
    }
  } finally {
  }
}

export const deletePersistentDatabase = async () => {
  try {
    global.log("persistent:: deletePersistentDatabases.");
    const localDBapp = await createDatastoreASYNC('xdx-appstate');
    const localDBuser = await createDatastoreASYNC('xdx-user');
    const localDBgame = await createDatastoreASYNC('xdx-game');
    const localDBgameNonO = await createDatastoreASYNC('xdx-gameNonO');

    await removedbASYNC(localDBapp, 'state');
    await removedbASYNC(localDBuser, 'user');
    await removedbASYNC(localDBgame, 'game');
    await removedbASYNC(localDBgameNonO, 'gameNonO');
  } catch (error) {
    global.log("persistent:: deletePersistentDatabase:: ERROR:: ", error);
    // fail silent
    // throw error
  } finally {
  }
}
