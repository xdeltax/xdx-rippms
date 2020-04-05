import PrototypeRxdbCollectionMobx from "./PrototypeRxdbCollectionMobx";
import {autorun,  } from 'mobx';
import {unixtime} from "tools/datetime";


// ===============================================
// collection-schema
// ===============================================
const rxdbSchema = {
  version: 0,
  title: "rxdb user schema",
  description: "all about the logged user",
  type: "object",
  keyCompression: false,
  properties: {
    _id:        { type: "string", primary: true }, // primary: unique, indexed, required
    auth:       { type: "object", },
    card:       { type: "object", },
    data:       { type: "object", },
    updatedAt:  { type: "number", },
    //createdAt:{ type: "number", },
  },
  required: ["auth", "card", "data", "updatedAt"], // required for every document
  //attachments: { "encrypted": false }, // allow attachments (binaries); optional: encrypt with password
};

// ===============================================
// mobx-observables
// ===============================================
const memorySchema = {
  _id: "client",
  auth: { },
  card: { },
  data: { },
  updatedAt: 0,
};

const migrationStrategies = null;
/*{ 1: function(oldDoc) { // 1 means, this transforms data from version 0 to version 1
         oldDoc.time = new Date(oldDoc.time).getTime(); // string to unix
         return oldDoc;
       }
  }*/

export default class RXDBUserCollection extends PrototypeRxdbCollectionMobx {
  constructor(database, collectionName) {
    const cName = "user";  // only lowercase allowed
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
    this.socket               lowlevel-access server-socketio-api

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
  initMobxAutorun = () => { autorun(() => { // toJS required for detecting changes
    if (!this.getProp._id) return;
    global.log("AUTORUN:: ", this.collectionName, this.mobx2json);
  }, { delay: 0 });}


  // ===============================================
  //
  // rxdb-database-operations
  //
  // ===============================================
  async setProp(prop, value, serverIsMaster) { // const x = await rxdbStore.user.setProp("card.test", 111 ); -> set _mobx: { card: {test:111} }
    // workflow:: send new value for property to server -> return updated prop from server-database -> change prop with data from server in local database -> sync to mobx
    const {err, res} = (serverIsMaster || this._serverIsMaster)
      ? await this.servercall_sendPropToServer(prop, value, this.getProp.auth.userid, this.getProp.auth.servertoken)
      : { err: null, res: { prop: prop, value: value }};

    if (!err && res.prop === prop) { // set prop in local database (and mobx) with feedback from server
      await super.setProp(prop, res.value); // write new value to local-database and mobx-observable
    }
  }


  setUpdatedAt = async () => {
    this.collection.findOne().exec().then(tempdoc => { tempdoc.atomicSet('updatedAt', unixtime()) }); // modify a property in database
    // const doc = await this.collection.findOne().exec(); await doc.atomicSet('updatedAt', unixtime()); const after = doc.get("updatedAt");
  }


  // ===============================================
  //
  // client-operations
  //
  // ===============================================

  // user-validation
  get isAuthenticated() { // used in AppRouter
    return Boolean(this.isValidUser && this.isValidUsercard);
  }

  get isValidUser() { // used in AppRouter
    return (global.DEBUG_AUTH_FAKE_ISVALIDUSER) ? true : Boolean(!!this.getProp.auth.servertoken && !!this.getProp.auth.userid);
  }

  get isValidUsercard() { // used in AppRouter
    return (global.DEBUG_AUTH_FAKE_ISVALIDUSER) ? true : Boolean(true);
  }


  // ===============================================
  // ===============================================
  //
  // server-API-operations
  //
  // ===============================================
  // ===============================================
  doAuthLogout = async () => {
    try {
      // send logout signal to server
      await this.servercall_logoutUserFromServer(this.userid, this.servertoken);
    } catch (error) {
    } finally {
      // clear local persistent store
      //global.log("USER:: doAuthLogout:: BEFORE:: ", (await this.collection2json()).docs);
  	  const removedDocumentsCount = await this.removeAllDocuments();
      global.log("USER:: doAuthLogout:: removed documents:: ", removedDocumentsCount);
    }
  };


  // routeLogin.js -> oAuth.js -> Server -> oAuth.js -> routeLogin.js -> success / failed -> store.user.doAuthLogin(...)
  doAuthLogin = async (socketid, provider, error, authCallbackObjectFromServer) => {
    if (error) return;
  	// userdataFromServer = {
    //   status: "login with provider",
    //   provider: provider,
    //   socketid: socketid,    //
  	//	 user: { ... }
  	// }
  	let {
      //status,
      //provider,
      //socketid,
  		user,
      usercard,
      userobject,
  	} = authCallbackObjectFromServer || {};

  	const {
  		userid,
  		servertoken,
      /*
  		accountstatus,
  		memberstatus,
  		createdAt,
  		updatedAt,
      */
  	} = user || {};

  	//const {  	} = usercard || {};

    //const {  	} = userobject || {};

		global.log("store.user:: doAuthLogin:: ", this.getProp.auth.userid, userid, authCallbackObjectFromServer);

  	if (this.getProp.auth.userid !== null && userid !== this.getProp.auth.userid) await this.doAuthLogout();

  	if (userid && servertoken) {
      // create rxdb-schema-object from server-data
      const rxdbSchemaDocument = {
        _id: "client", // unique id-field
        auth: user || {},
        card: usercard || {},
        data: userobject || {},
        updatedAt: unixtime(),
      }
      // save to local persistent local database and oberserved mobx-store
      await this.createupdateDocument(rxdbSchemaDocument, true);
      //global.log("USER:: doAuthLogin:: AFTER:: ", await this.collection2json());
  	};
  };

  getAnyUserDataFromServer = async (targetuserid) => {
    const userid = this.getProp.auth.userid;
    const servertoken = this.getProp.auth.servertoken;
    if (!userid || !servertoken || !targetuserid) return null;

    return await this.servercall_getUserStoreFromServer(targetuserid, userid, servertoken);
  }

  saveOwnUserDataToServer = async () => {
    //todo::
  }

  syncUserDataFromServer = async () => {
    const userid = this.getProp.auth.userid;
    const servertoken = this.getProp.auth.servertoken;
    if (!userid || !servertoken) return null;

    const {err, res} = await this.servercall_getAnyUserDataFromServer(userid);
    if (!err) {
	  	const {
        //userid,
	  		user,
	  		usercard,
        userobject,
	  	} = res || {};

      // create rxdb-schema-object from server-data
      const rxdbSchemaDocument = {
        _id: "client", // unique id-field
        auth: user || {},
        card: usercard || {},
        data: userobject || {},
        updatedAt: unixtime(),
      }
      // save to local persistent local database and oberserved mobx-store
      await this.createupdateDocument(rxdbSchemaDocument, true);
    }
    return (err) ? null : res;
  }

  syncUserDataToServer = async () => {
    if (!this._unsavedChanges) return null;

    const userid = this.getProp.auth.userid;
    const servertoken = this.getProp.auth.servertoken;
    const {err, res} = this.servercall_getUserStoreFromServer(userid, userid, servertoken);
    if (!err) this._unsavedChanges = false;
    return (err) ? null : res;
  }


  // ===============================================
  // ===============================================
  //
  // socket connection to server
  //
  // ===============================================
  // ===============================================
  servercall_logoutUserFromServer = async (userid, servertoken) => {
    let res = null;
    let err = null;
    try {
      if (!userid || !servertoken) throw new Error ("no valid auth");
      const ioRoute = "auth/user/logout";
      const req = {
        targetuserid: userid,
        userid: userid,
        servertoken: servertoken,
      }

      res = await this.socketio.emitWithTimeout(ioRoute, req,);
      // res = { result: true / false, _callstats: {xxx}, }
    } catch (error) {
      err = error;
    } finally {
      global.log("UserCollection:: servercall_logoutUserFromServer:: ", userid, err, res)
      return { err: err, res: res };
    }
  };

  servercall_sendPropToServer = async (prop, value, userid, servertoken) => {
		let res = null;
		let err = null;
		try {
      if (!userid || !servertoken) throw new Error ("no valid auth");
			const ioRoute = "auth/store/user/props/set";
			const req = {
				targetuserid: userid,
				userid: userid,
				servertoken: servertoken,
				prop: prop,
        value: value,
			};
    	res = await this.socketio.emitWithTimeout(ioRoute, req,);
      // res = { prop: prop, value: value, _callstats: {xxx}, }
		} catch (error) {
    	err = error;
		} finally {
			global.log("UserCollection:: servercall_sendPropToServer:: ", userid, err, res)
	  	return { err: err, res: res };
		}
  };

  servercall_getUserStoreFromServer = async (targetuserid, userid, servertoken) => {
  	if (!userid || !servertoken) return;

		let res = null;
		let err = null;
		try {
			const ioRoute = "auth/user/userstore/get";
			const req = {
				targetuserid: targetuserid,
				userid: userid,
				servertoken: servertoken,
			}
	  	//global.log("*** getUserStoreFromServer:: ", req, socketio.socketID)
    	res = await this.socketio.emitWithTimeout(ioRoute, req,);
      // res = { user: {xxx}, usercard: {xxx}, _callstats: {xxx}, }
      //global.log("***!!!!!!!!!!!!!! getUserStoreFromServer:: ", res, )
		} catch (error) {
    	err = error;
		} finally {
			global.log("store.user:: getUserStoreFromServer:: ", targetuserid, err, res)
	  	return { err: err, res: res };
		}
  };

  servercall_getAnyUserDataFromServer = async (targetuserid) => {

  };

};
