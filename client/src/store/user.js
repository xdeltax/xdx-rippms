import {decorate, observable, action, runInAction, toJS,} from 'mobx';
import ProtoStore from "./protoStore";
import deepCopy from 'tools/deepCopyObject';
import deepMerge from 'tools/deepMergeObject';
import Jimp from 'jimp';

import { saveToPersistentDatabase, deletePersistentDatabase, } from "db/persistent";

import store from "store";

class Store extends ProtoStore {
  #__privateObervablesInit;
  #__privateHelpersInit;
  constructor() { super(); /*store init-state of all vars*/ this.#__privateObervablesInit = deepCopy(this._obervables); this.#__privateHelpersInit = deepCopy(this._helpers); };
  reset     = action(() 	 => { /*recover init-state*/ this.obervables = deepCopy(this.#__privateObervablesInit); this.helpers = deepCopy(this.#__privateHelpersInit); this.constants = deepCopy(this.#__privateHelpersInit); });
  clear 		= action(() 	 => this.clear_all() );
  clear_all = action(() 	 => Object.keys(this.obervables).forEach( (prop) => this.obervables[prop] = deepCopy(this.#__privateObervablesInit[prop]) ) );
  clear_obj = action((obj) => this[obj] = deepCopy(this.#__privateObervablesInit[obj]) );

  _constants = {
    genderREADONLY: ["unknown", "male", "female", ],
  }

  // init of all observables
  _obervables = {
    user: {
      userid: null,
      servertoken: null,

      accountstatus: [],
      memberstatus: [],

      createdAt: 0,
      updatedAt: 0,
    },
    usercard: {
      email: null,
      phonenumber: null,
    },
  };

  _helpers = {
  };


  // setters and getters
  get const() { return this.constants; }
  set const(v) { runInAction(() => { this.constants = v; }) }


  get isAuthenticated() {
    return Boolean(this.isValidUser && this.isValidUserProfile);
  }

  // user / user-credentials
  get user() { return this._obervables.user; }
  set user(v) { runInAction(() => { this._obervables.user = v; }) }

      // user-validation
      get isValidUser() {
        if (global.DEBUG_AUTH_FAKE_ISVALIDUSER) return true;
        return Boolean(!!this.user.servertoken && !!this.user.userid)
      }

      get userid() { return this.user.userid; }
      set userid(v) { runInAction(() => { this.user.userid = v; }) }

      get servertoken() { return this.user.servertoken; }
      set servertoken(v) { runInAction(() => { this.user.servertoken = v; }) }

      get accountstatus() { return this.user.accountstatus; }
      set accountstatus(v) { runInAction(() => { this.user.accountstatus = v; }) }

      get memberstatus() { return this.user.memberstatus; }
      set memberstatus(v) { runInAction(() => { this.user.memberstatus = v; }) }

      get createdAt() { return this.user.createdAt; }
      set createdAt(v) { runInAction(() => { this.user.createdAt = v; }) }

      get updatedAt() { return this.user.updatedAt; }
      set updatedAt(v) { runInAction(() => { this.user.updatedAt = v; }) }

  // usercard
  get usercard() { return this.obervables.usercard }
  set usercard(o) { runInAction(() => { this.obervables.usercard = o }) }

      // user-validation
      get isValidUserProfile() {
        if (global.DEBUG_AUTH_FAKE_ISVALIDPROFILE) return true;
        return true; //Boolean(!!this.usercard.email && !!this.usercard.phonenumber)
      }

      get email() { return this.usercard.email; }
      set email(v) { runInAction(() => { this.usercard.email = v; }) }

      get phonenumber() { return this.usercard.phonenumber; }
      set phonenumber(v) { runInAction(() => { this.usercard.phonenumber = v; }) }



  doAuthLogout = async () => {
		global.log("USER:: doAuthLogout:: ", this.userid,)
    // send logout signal to server
    //await this.apiCALL_DBUsers_logout(this.userid, this.servertoken);

    // clear local persistent store
    await deletePersistentDatabase();

    // clear store
	  this.clear_all();
  };


  doAuthLogin = async (userdataFromServer) => {
  	const {userid, servertoken, accountstatus, memberstatus, createdAt, updatedAt,} = userdataFromServer || {};

		global.log("store.user:: doAuthLogin:: ", this.userid, userid,);
  	
  	if (userid !== this.userid) {
	  	await this.doAuthLogout();
  	};

  	if (userid && servertoken) {
	  	this.userid 			= userid;
	  	this.servertoken  = servertoken;
	  	this.memberstatus = Array.from(memberstatus); // [...memberstatus]; // shallow copy only
	  	this.accountstatus= Array.from(accountstatus); // [...accountstatus]; // shallow copy only
	  	this.createdAt  	= createdAt;
	  	this.updatedAt  	= updatedAt;

	  	//const {err, res} = await this._getUsercard(this.userid, this.userid, this.servertoken);
	  	//if (!err) this.usercard = Object.assign(this.usercard || {}, res);

	    await saveToPersistentDatabase();
  	};
  };


  getOwnFromServer = async () => {
  	if (!this.userid || !this.servertoken) return;

	  const {err, res} = await this._getUser(this.userid, this.userid, this.servertoken);
	  if (!err) { 
	  	this.user = Object.assign(this.user || {}, res);
	  	
	  	//const {err, res} = await this._getUsercard(this.userid, this.userid, this.servertoken);
	  	//if (!err) this.usercard = Object.assign(this.usercard || {}, res);

	    await saveToPersistentDatabase();
	  };
  };


  _getUser = async (targetuserid, userid, servertoken) => {
		let res = null;
		let err = null;
		try {
			const ioRoute = "auth/userstore/get/user";
			const req = {
				targetuserid,
				userid,
				servertoken,
			}
    	res = await store.socketio.emitWithTimeout(ioRoute, req,);
		} catch (error) {
			err = error;
		}

		global.log("store.user:: getUser:: ", targetuserid, userid, err, res)
  	return { err, res };
  };


  saveOwnToServer = async () => {
  	if (!this.userid || !this.servertoken) return;
	  //await this._saveOwnUserToServer(this.userid, this.servertoken, this.user);
  };


  /*
  _saveOwnUserToServer = async (userid, servertoken, obj) => {
  	if (!userid || !servertoken) return;
	  return await this._saveOwnUser(userid, servertoken, obj);
  };


  _saveUserOwn = async (userid, servertoken, obj) => {
		let res = null;
		let err = null;
		const targetuserid = userid;
		try {
			const ioRoute = "auth/userstore/user/update";
			const req = {
				targetuserid,
				userid,
				servertoken,
				obj,
			}
    	res = await store.socketio.emitWithTimeout(ioRoute, req,);
		} catch (error) {
			err = error;
		}

		global.log("store.user:: saveUserOwn:: ", targetuserid, userid, err, res)
  	return { err, res };
  };
  */
};

decorate(Store, {
  _obervables: observable,
  _helpers: observable,
});

export default Store;
