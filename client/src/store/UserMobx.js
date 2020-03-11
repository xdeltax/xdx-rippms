import {decorate, observable, runInAction, /*toJS,*/} from 'mobx';
import MobxPrototype from "./MobxPrototype";

import * as localDatabase from "localDatabase/index.js"; // loadAppData, saveAppData, deleteAppData

//import store from "store";
import * as userAPI from "api/userAPI.js";

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
    usercard: {
      test: "hallo",
    },
    userobject: {

    },
  };

  _helpers = {
  };


  // user-validation
  get isValidUser() {
    if (global.DEBUG_AUTH_FAKE_ISVALIDUSER) return true;
    return Boolean(!!this.user.servertoken && !!this.user.userid)
  }

  get isValidUsercard() {
    if (global.DEBUG_AUTH_FAKE_ISVALIDUSER) return true;
    return Boolean(true);
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

  get usercard() { return this._obervables.usercard; }
  set usercard(v) { runInAction(() => { this._obervables.usercard = v; }) }

  get userobject() { return this._obervables.userobject; }
  set userobject(v) { runInAction(() => { this._obervables.userobject = v; }) }


  doAuthLogout = async () => {
    try {
	    global.log("USER:: doAuthLogout:: ", this.userid,)

      // send logout signal to server
      await userAPI.logoutUserFromServer(this.userid, this.servertoken);

    } catch (error) {
    } finally {
      // clear local persistent store
  		await localDatabase.deleteAppData();

      // clear store
  	  this.clear_all_observables();
    }
  };


  // routeLogin.js -> oAuth.js -> Server -> oAuth.js -> routeLogin.js -> success / failed -> store.user.doAuthLogin(...)
  doAuthLogin = async (socketid, provider, error,authCallbackObjectFromServer) => {
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

  	//const { } = usercard || {};
    //const { } = userobject || {};

		global.log("store.user:: doAuthLogin:: ", this.userid, userid, authCallbackObjectFromServer);

  	if (this.userid !== null && userid !== this.userid) {
	  	await this.doAuthLogout();
  	};

  	if (userid && servertoken) {
      runInAction(() => { // refresh in a block
        /*
  	  	this.userid 			= userid;
  	  	this.servertoken  = servertoken;
  	  	this.memberstatus = Array.from(memberstatus);  // [...memberstatus]; // shallow copy only
  	  	this.accountstatus= Array.from(accountstatus); // [...accountstatus]; // shallow copy only
  	  	this.createdAt  	= createdAt;
  	  	this.updatedAt  	= updatedAt;
        usercard = {
          test2: "login",
        }
        */

        this.merge_all_observables({
          user: user || {},
          usercard: usercard || {},
          userobject: userobject || {},
        });
      }, false);

      // save to local persistent store
	    await localDatabase.saveAppData();
  	};
  };









  // used in AppLandingPage @ componentDidMount
  getUserStoreFromServerANDMergeWithStore = async () => {
  	if (!this.userid || !this.servertoken) return;

	  const {err, res} = await userAPI.getUserStoreFromServer(this.userid, this.userid, this.servertoken);

	  if (!err) {
	  	const {
        //userid,
	  		user,
	  		usercard,
        userobject,
	  	} = res || {};

      runInAction(() => {
        this.merge_all_observables({
          user: user || {},
          usercard: usercard || {},
          userobject: userobject || {},
        }, false);
      });

      await localDatabase.saveAppData();
	  };

    if (err) {
      runInAction(() => {
        this.clear_all_observables();
      });
    }
  	//global.log("+++++++3 getUserStoreFromServerANDMergeWithStore:: ", err, res)
  	return { err: err, res: res };
  };


	// used in AppLandingPage @ componentWillUnmount
  saveUserStoreToServer = async (newProps) => {
  	if (!this.userid || !this.servertoken) return;

    if (!newProps) {
      newProps = {
      	name: this.name,
      	email: this.email,
      	phonenumber: this.phonenumber,
      };
    }
	  /*const {err, res} = */await userAPI.updateOwnUserPropsToServer(newProps, this.userid, this.servertoken);
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
});

export default MobxUser;
