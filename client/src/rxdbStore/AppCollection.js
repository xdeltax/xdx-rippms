import PrototypeRxdbCollectionMobx from "./PrototypeRxdbCollectionMobx";

import {autorun,  } from 'mobx';
//import {unixtime} from "tools/datetime";


// ===============================================
// collection-schema
// ===============================================
const rxdbSchema = {
  version: 0,
  title: "rxdb app schema",
  description: "all about the app",
  type: "object",
  keyCompression: false,
  properties: {
    _id:        { type: "string", primary: true }, // primary: unique, indexed, required
    config:     { type: "object", },
    state:      { type: "object", },
    watcher:    { type: "object", },
    versions:   { type: "object", },    
    updatedAt:  { type: "number", },
    //createdAt:{ type: "number", },
  },
  required: ["config", "state", "watcher", "updatedAt"], // required for every document
  //attachments: { "encrypted": false }, // allow attachments (binaries); optional: encrypt with password
};

// ===============================================
// mobx-observables
// ===============================================
const memorySchema = {
  _id: "clientonly",

  config: {
    size: {
      minWidth: "360px", // used in ./AppLandingPage
      minHeight: "360px", // used in ./AppLandingPage
      maxWidth: null, // used in ./AppLandingPage
      maxHeight: null, // used in ./AppLandingPage
    },

    color: { // application colors
      app: {
        text: 'black', // used in ./AppLandingPage with fallback black
        background: 'rgba(240, 255, 240, 1.0)', // used in ./AppLandingPage with fallback white
      },
      login: {
        text: 'blue',
        background: 'rgba(255, 238, 238, 1.0)',
      },
      auth: {
        text: 'blue',
        background: 'rgba(230, 255, 230, 1.0)',
      },
      overlay: { // color of modals (spinner, alert, ...)
        text: 'blue',
        background: "linear-gradient(140deg, rgba(255,255,255,0.7) 20%, rgba(230,255,230,0.7) 50%, rgba(255,255,255,0.7) 80%)", //'rgba(255, 238, 238, 0.9)',
        //background: 'linear-gradient(to right bottom, #430089, #82ffa1)', //'rgba(255, 238, 238, 0.9)',
      },
      menu: { // color of menus,
        text: 'blue',
        background: 'rgba(255, 238, 238, 0.9)',
      },
      header: { // topbar
        text: 'white',
        selected: 'yellow',
        background: 'rgba(0, 150, 255, 0.9)',
      },
      navigation: { // bottombar
        text: 'blue',
        selected: 'white',
        background: 'rgba(0, 150, 255, 0.9)',
      },
      game: {
        text: "white",
        background: '#000000',
      }
    },
  },

  state: {
    header: { // hide / show topbar (backbutton * label * profile * toggle)
      visible: false,
      //height: 48,
    },
    bottomNavigation: { // hide / show navigationbar at bottom of app
      visible: false,
      //height: 48, // variant "dense" -> minHeight 48
    },
    game: { // hide / show phaser-container
      visible: false,
    },
  },

  watcher: {
    orientation: { // AppLandingPage:: componentDidMount:: -> watchers/orientation.js:: window.screen.orientation
      type: "",
      angle: 0,
    },
    connection: {  // AppLandingPage:: componentDidMount:: -> watchers/connection.js::  navigator.connection
      type: "",
      downlink: 0,
      isOnline: false, // navigator.onLine;
      wentOffline: 0,
      wentOnline: 0,
    },
    socket: {
      isConnected: false, // set in ./api/socket.js
      pongMS: 0, // updated at every socket ping-response // set in ./api/socket.js
      _callstats: { // updated at every socket-call-response
        timeclientout: 0, // unixtime from client right before sending request to server
        timeserverin: 0,  // unixtime from server right after incoming request
        timeserverout: 0, // unixtime from server right before sending result to client
        timeclientin: 0,  // unixtime from client right after incoming result
        client2client: 0, // transport-time from client request emit until back to client-event
        client2server: 0, // transport-time from client request emit to server-event
        server2server: 0, // processing time for database-query on server
        server2client: 0, // transport-time from server result emit to client-event
      },
    },

    route: {
      pathname: "", // AppRouter:: componentDidUpdate
    },

    visibility: {
      hidden: null,
      visibilityState: null,
    },

    versions: {
      map: null,
    },
  },

  updatedAt: 0,
};

const migrationStrategies = null;
/*{ 1: function(oldDoc) { // 1 means, this transforms data from version 0 to version 1
         oldDoc.time = new Date(oldDoc.time).getTime(); // string to unix
         return oldDoc;
       }
  }*/

export default class RXDBAppCollection extends PrototypeRxdbCollectionMobx {
  constructor(database, collectionName) {
    const cName = "appstate"; // only lowercase allowed
    const isObserved = true;
    super(isObserved, database, collectionName || cName, rxdbSchema, memorySchema, migrationStrategies); // open/create database and create/connect collection

    this._serverIsMaster = false;
  }

  async initCollection() {
    // 1) create or open collection
    // 2) if collection is empty -> create database-document from mobx-data
    // 3) make collection reactive to changes in database --> if collection changes, update mobx/data-data
    await super.initCollection(true); // true = subscribeToCollection = collection is reactive and synced to mobx
    // 4) start mobx-autorun -> watch mobx-data and do something if mobx-data changes
    this.initMobxAutorun();
  }
  /*
    // mobx-stuff is readonly; all write-operations are done to rxdb-database
    this.getProp              same as this.mobx but with failsafe! -> this.getProp.unknownprop will not fail
    this.mobx                 mobx-observables-object -> this.mobx["aProp"] or this.mobx.aProp
    this.mobx2json            mobx-observables-object converted to json; same as toJS(this.mobx)

    // write operations
    this.setProp              save / modify a property in existing database -> changes will be synced to mobx-observables-object
    this.createupdateDocument(rxdbSchemaDocument)  rxdbSchemaDocument must validate rxdbSchema
    this.db                   lowlevel-access database
    this.collection           lowlevel-access collection
    this.socketio             lowlevel-access server-socketio-api

    this.collectionName       name of collection in database
    this.removeAllDocuments() remove all documents from collection
    this.getCollectionByName()
    this.removeCollection()
    this.collection2json()
    this.json2collection(json)

    this.count()              same as (await this.collection.find().exec()).length
    this.find(prop)
    this.findOne(prop)

    const arrayOfrxdbDocuments = await this.collection.find().exec()
    const rxdbDocument = await this.collection.findOne().exec()
    const document = rxdbDocument.toJSON;
  */

  // ===============================================
  //
  // mobx-observable-operations
  //
  // ===============================================
  initMobxAutorun = () => { autorun(() => { // autorun will run if some observable inside autorun change -> toJS required for detecting changes!!!
    if (!this.getProp._id) return;
    global.log("AUTORUN:: ", this.collectionName, this.mobx2json);
  }, { delay: 200 });}


  // ===============================================
  //
  // rxdb-database-operations
  //
  // ===============================================
  async setProp(prop, value, serverIsMaster) { // const x = await rxdbStore.user.setProp("card.test", 111 ); -> set _mobx: { card: {test:111} }
    /*
    // workflow:: send new value for property to server -> return updated prop from server-database -> change prop with data from server in local database -> sync to mobx
    const {err, res} = (serverIsMaster || this._serverIsMaster)
      ? await this.servercall_sendPropToServer(prop, value, this.getProp.auth.userid, this.getProp.auth.servertoken)
      : { err: null, res: { prop: prop, value: value }};

    if (!err && res.prop === prop) { // set prop in local database (and mobx) with feedback from server
      super.setProp(prop, res.value); // write new value to local-database and mobx-observable
    }
    */
    await super.setProp(prop, value); // write new value to local-database and mobx-observable
  }


  // ===============================================
  //
  // client-operations
  //
  // ===============================================
  get isTest() {
    return Boolean(true);
  }

  get routePathname() { return this.getProp.watcher.route.pathname }

  // ===============================================
  // ===============================================
  //
  // server-API-operations
  //
  // ===============================================
  // ===============================================


  // ===============================================
  // ===============================================
  //
  // socket connection to server
  //
  // ===============================================
  // ===============================================
  servercall_test = async (targetuserid) => {
  };

};
