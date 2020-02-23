import {decorate, observable, runInAction, /*toJS,*/} from 'mobx';
import MobxPrototype from "./MobxPrototype";
import { saveToPersistentDatabase, deletePersistentDatabase, } from "database/persistentDB.js";

import store from "store";
import socketio from 'socket'; // socket

class MobxUser extends MobxPrototype {
  constructor(store) { super(store); /*store init-state of all vars::*/ this.saveInitialState(this._obervables, this._helpers); };

  _constants = {
  }

  // init of all observables
  _obervables = {
    user: {
		  // public (store.user)
      userid: null,
      servertoken: null,

      accountstatus: [],
      memberstatus: [],

      createdAt: 0,
      updatedAt: 0,

			// private
			uid: null,
			fphash: null,
			provider: null,
			facebookid: null,
			googleid: null,
			providertoken: null,
			forcenew: null, // modifiable

			// modifiable
			name: null,
			email: null,
			phonenumber: null,

    },
  };

  _helpers = {
  };


  // user-validation
  get isValid() {
    if (global.DEBUG_AUTH_FAKE_ISVALIDUSER) return true;
    return Boolean(!!this.user.servertoken && !!this.user.userid)
  }

  get const() { return this._constants; }
  set const(v) { runInAction(() => { this._constants = v; }) }

  get helpers() { return this._helpers; }
  set helpers(v) { runInAction(() => { this._helpers = v; }) }

  get user() { return this._obervables.user; }
  set user(v) { runInAction(() => { this._obervables.user = v; }) }

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

      get name() { return this.user.name; }
      set name(v) { runInAction(() => { this.user.name = v; }) }

      get email() { return this.user.email; }
      set email(v) { runInAction(() => { this.user.email = v; }) }

      get phonenumber() { return this.user.phonenumber; }
      set phonenumber(v) { runInAction(() => { this.user.phonenumber = v; }) }


  doAuthLogout = async () => {
    try {
		    global.log("USER:: doAuthLogout:: ", this.userid,)
        // send logout signal to server
        this.logoutUserFromServer(this.userid);

      // clear local persistent store
  		await deletePersistentDatabase();
    } catch (error) {
    } finally {
      // clear store
  	  this.clear_all();
  	  store.usercard.clear_all();
    }
  };


  doAuthLogin = async (userdataFromServer) => {
  	// userObject = {
  	//	 user: { ... }
  	//	 usercard: { ... }
  	// }
  	const {
  		user,
  		usercard,
  	} = userdataFromServer || {};

  	const {
  		userid,
  		servertoken,
  		accountstatus,
  		memberstatus,
  		createdAt,
  		updatedAt,
  	} = user || {};

  	const {
  	} = usercard || {};


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

		  store.usercard.clear_all();
	  	store.usercard.merge_all(usercard);

	    await saveToPersistentDatabase();
  	};
  };


  logoutUserFromServer = async (targetuserid) => {
  	if (!this.userid || !this.servertoken) return;

		let res = null;
		let err = null;
		try {
			const ioRoute = "auth/store/user/logout";
			const req = {
				targetuserid: targetuserid,
				userid: this.userid,
				servertoken: this.servertoken,
			}
	  	global.log("*** logoutUserFromServer:: ", req, socketio.socket.id)
    	res = await socketio.emitWithTimeout(ioRoute, req,);
      // res = { result: true / false, callstats: {xxx}, }
		} catch (error) {
    	err = error;
		} finally {
			global.log("store.user:: logoutUserFromServer:: ", targetuserid, err, res)
	  	return { err: err, res: res };
		}
  };


  _getUserStoreFromServer = async (targetuserid) => {
  	if (!this.userid || !this.servertoken) return;

		let res = null;
		let err = null;
		try {
			const ioRoute = "auth/store/userstore/get";
			const req = {
				targetuserid: targetuserid,
				userid: this.userid,
				servertoken: this.servertoken,
			}
	  	//global.log("*** getUserStoreFromServer:: ", req, socketio.socketID)
    	res = await socketio.emitWithTimeout(ioRoute, req,);
      // res = { user: {xxx}, usercard: {xxx}, callstats: {xxx}, }
      //global.log("***!!!!!!!!!!!!!! getUserStoreFromServer:: ", res, )
		} catch (error) {
    	err = error;
		} finally {
			global.log("store.user:: getUserStoreFromServer:: ", targetuserid, err, res)
	  	return { err: err, res: res };
		}
  };


  getUserFromServer = async (targetuserid) => {
  	if (!this.userid || !this.servertoken) return;

		let res = null;
		let err = null;
		try {
			const ioRoute = "auth/store/user/get";
			const req = {
				targetuserid: targetuserid,
				userid: this.userid,
				servertoken: this.servertoken,
			}
    	res = await socketio.emitWithTimeout(ioRoute, req,);
      // res = { user: {xxx}, callstats: {xxx}, }
		} catch (error) {
    	err = error;
		} finally {
			global.log("store.user:: getUserFromServer:: ", targetuserid, err, res)
	  	return { err: err, res: res };
		}
  };


  updateOwnUserPropsToServer = async (newProps) => {
  	if (!this.userid || !this.servertoken) return;

		let res = null;
		let err = null;
		try {
			const ioRoute = "auth/store/user/update";
			const req = {
				targetuserid: this.userid,
				userid: this.userid,
				servertoken: this.servertoken,
				props: newProps,
			};
    	res = await socketio.emitWithTimeout(ioRoute, req,);
      // res = { user: {xxx}, callstats: {xxx}, }
		} catch (error) {
    	err = error;
		} finally {
			global.log("store.user:: updateOwnUserPropsToServer:: ", this.userid, err, res)
	  	return { err: err, res: res };
		}
  };


  updateOwnUsercardPropsToServer = async (newProps) => {
  	if (!this.userid || !this.servertoken) return;

		let res = null;
		let err = null;
		try {
			const ioRoute = "auth/store/usercard/update";
			const req = {
				targetuserid: this.userid,
				userid: this.userid,
				servertoken: this.servertoken,
				props: newProps,
			};
    	res = await socketio.emitWithTimeout(ioRoute, req,);
      // res = { user: {xxx}, callstats: {xxx}, }
		} catch (error) {
    	err = error;
		} finally {
			global.log("store.user:: updateOwnUserPropsToServer:: ", this.userid, err, res)
	  	return { err: err, res: res };
		}
  };


  // used in AppLandingPage @ componentDidMount
  getUserStoreFromServerANDMergeWithStore = async () => {
  	if (!this.userid || !this.servertoken) return;

  	//global.log("+++++++1 getUserStoreFromServerANDMergeWithStore:: ", this.userid)
	  const {err, res} = await this._getUserStoreFromServer(this.userid);
    // res = {userid: "xxx", user: {}, usercard: {}, }

    //global.log("+++++++2 getUserStoreFromServerANDMergeWithStore:: ", err, res)
	  if (!err) {
	  	const {
        userid,
	  		user,
	  		usercard,
	  	} = res || {};

      //global.log("+++++++++++++++++++X1:: ", store.usercard.get_all())

      runInAction(() => {
        user && store.user.merge_all( {user: user} );
        usercard && store.usercard.merge_all( {usercard: usercard} );
      });

      //global.log("+++++++++++++++++++X4:: ", store.usercard.get_all())

      await saveToPersistentDatabase();
	  };
  	//global.log("+++++++3 getUserStoreFromServerANDMergeWithStore:: ", err, res)
  	return { err: err, res: res };
  };


	// used in AppLandingPage @ componentWillUnmount
  saveUserStoreToServer = async () => {
  	if (!this.userid || !this.servertoken) return;

    const newProps = {
    	name: this.name,
    	email: this.email,
    	phonenumber: this.phonenumber,
    };
	  const {err, res} = await this.updateOwnUserPropsToServer(newProps);
  };

  /*
  _saveUserOwn = async (userid, servertoken, obj) => {
		let res = null;
		let err = null;
		const targetuserid = userid;
		try {
			const ioRoute = "auth/store/user/update";
			const req = {
				targetuserid,
				userid,
				servertoken,
				obj,
			}
    	res = await socketio.emitWithTimeout(ioRoute, req,);
		} catch (error) {
			err = error;
		}

		global.log("store.user:: saveUserOwn:: ", targetuserid, userid, err, res)
  	return { err, res };
  };
  */
};

decorate(MobxUser, {
  _obervables: observable,
  _helpers: observable,
});

export default MobxUser;
