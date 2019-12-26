import {decorate, observable, action, runInAction, toJS,} from 'mobx';
import ProtoStore from "./protoStore";
import deepCopy from 'tools/deepCopyObject';
import deepMerge from 'tools/deepMergeObject';

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
    usercard: {
    	gender: null,
      email: null,
      phonenumber: null,
    },
  };

  _helpers = {
  };


  // setters and getters
  get const() { return this.constants; }
  set const(v) { runInAction(() => { this.constants = v; }) }

  // usercard
  get usercard() { return this.obervables.usercard }
  set usercard(o) { runInAction(() => { this.obervables.usercard = o }) }

      // user-validation
      get isValid() {
        if (global.DEBUG_AUTH_FAKE_ISVALIDPROFILE) return true;
        return true; //Boolean(!!this.usercard.email && !!this.usercard.phonenumber)
      }

      get gender() { return this.usercard.gender; }
      set gender(v) { runInAction(() => { this.usercard.gender = v; }) }

      get email() { return this.usercard.email; }
      set email(v) { runInAction(() => { this.usercard.email = v; }) }

      get phonenumber() { return this.usercard.phonenumber; }
      set phonenumber(v) { runInAction(() => { this.usercard.phonenumber = v; }) }



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


  _getUsercard = async (targetuserid, userid, servertoken) => {
		let res = null;
		let err = null;
		try {
			const ioRoute = "auth/store/usercard/get";
			const req = {
				targetuserid,
				userid,
				servertoken,
			}
    	res = await store.socketio.emitWithTimeout(ioRoute, req,);
		} catch (error) {
			err = error;
		}

		global.log("store.usercard:: getUsercard:: ", targetuserid, userid, err, res)
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
			const ioRoute = "auth/store/usercard/update";
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
