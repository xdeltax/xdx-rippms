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

    const state = await dbFindOneASYNC(localDBapp, 'state'); // load persit state
    global.log("persistent:: loadFromPersistentDatabase:: state:: ", state);
    if ( state
      && state.hasOwnProperty("storename")
      && state.hasOwnProperty("storedata")
      && state.hasOwnProperty("createdAt")
      && state.hasOwnProperty("updatedAt")
    ) {
      global.log("persistent:: loadFromPersistentDatabase:: merge_all:: system.storedata:: ", state.storedata);
      store.system.clear_obj("state");
      store.system.merge_obj("state", state.storedata);

      store.set("system.state.dataRelevance.localstorage.lastReadCall", global.now());
    }

    const user = await dbFindOneASYNC(localDBuser, 'user'); // load persit state
    global.log("persistent:: loadFromPersistentDatabase:: user:: ", user);

    if ( user
      && user.hasOwnProperty("storename")
      && user.hasOwnProperty("storedata")
      && user.hasOwnProperty("createdAt")
      && user.hasOwnProperty("updatedAt")
      && user.storedata.hasOwnProperty("auth")
      && user.storedata.auth.hasOwnProperty("userid")
      && user.storedata.auth.hasOwnProperty("servertoken")
    ) {
      global.log("persistent:: loadFromPersistentDatabase:: merge_all:: user.storedata:: ", user.storedata)
      store.user.clear();
      store.user.merge_all(user.storedata);
    }
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
    store.set("system.state.dataRelevance.localstorage.lastWriteCall", global.now());

    const state = store.system.get_obj("state");
    const user  = store.user.get_all();

    try {
      global.log("persistent:: saveToPersistentDatabase.", );
      createDatastoreASYNC('xdx-appstate').then(localDBapp=>updatedbASYNC(localDBapp, 'state', state));
      createDatastoreASYNC('xdx-user').then(localDBuser=>updatedbASYNC(localDBuser, 'user', user));
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
    global.log("persistent:: deletePersistentDatabase:: create database ", );
    const localDBapp = await createDatastoreASYNC('xdx-appstate');
    const localDBuser = await createDatastoreASYNC('xdx-user');

    global.log("persistent:: deletePersistentDatabase:: state ");
    await removedbASYNC(localDBapp, 'state');

    global.log("persistent:: deletePersistentDatabase:: user ");
    await removedbASYNC(localDBuser, 'user');
  } catch (error) {
    global.log("persistent:: deletePersistentDatabase:: ERROR:: ", error);
    // fail silent
    // throw error
  } finally {
  }
}
