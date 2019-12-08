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
    auth: {
      userid: null,
      servertoken: null,

      accountstatus: [],
      memberstatus: [],
    },
    facebook: {
      fbuserid: null,
      fbemail: null,
      fbME: null,
    },
    userCard: {
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

  // user / user-credentials
  get auth() { return this._obervables.auth; }
  set auth(v) { runInAction(() => { this._obervables.auth = v; }) }

  get isAuthenticated() {
    return Boolean(this.isValidUser && this.isValidUserProfile);
  }

      // user-validation
      get isValidUser() {
        if (global.DEBUG_AUTH_FAKE_ISVALIDUSER) return true;
        return Boolean(!!this.auth.servertoken && !!this.auth.userid)
      }

      get userid() { return this.auth.userid; }
      set userid(v) { runInAction(() => { this.auth.userid = v; }) }

      get servertoken() { return this.auth.servertoken; }
      set servertoken(v) { runInAction(() => { this.auth.servertoken = v; }) }

      get accountstatus() { return this.auth.accountstatus; }
      set accountstatus(v) { runInAction(() => { this.auth.accountstatus = v; }) }

      get memberstatus() { return this.auth.memberstatus; }
      set memberstatus(v) { runInAction(() => { this.auth.memberstatus = v; }) }


  // usercard
  get userCard() { return this.obervables.userCard }
  set userCard(o) { runInAction(() => { this.obervables.userCard = o }) }

      // user-validation
      get isValidUserProfile() {
        if (global.DEBUG_AUTH_FAKE_ISVALIDPROFILE) return true;
        return Boolean(!!this.userCard.email && !!this.userCard.phonenumber)
      }

      get email() { return this.userCard.email; }
      set email(v) { runInAction(() => { this.userCard.email = v; }) }

      get phonenumber() { return this.userCard.phonenumber; }
      set phonenumber(v) { runInAction(() => { this.userCard.phonenumber = v; }) }


  // facebook
  get facebook() { return this.obervables.facebook; }
  set facebook(o) { runInAction(() => { this.obervables.facebook = o; }) }

      get fbuserid() { return this.facebook.fbuserid; }
      set fbuserid(v) { runInAction(() => { this.facebook.fbuserid = v; }) }

      get fbemail() { return this.facebook.fbemail; }
      set fbemail(v) { runInAction(() => { this.facebook.fbemail = v; }) }

      get fbME() { return this.facebook.fbME; }
      set fbME(v) { runInAction(() => { this.facebook.fbME = v; }) }





  // public
  logout = async (forceFB) => {
    try {
      if (forceFB) store.facebook.askFacebook2Logout();

      // send logout signal to server
      if (this.userid && this.servertoken)
      try {
        await this.apiCALL_DBUsers_logout(this.userid, this.servertoken);
      } catch (error) {
        // fail silent
      }

      // clear local persistent store
      await deletePersistentDatabase();

      return true;
    } finally {
      // clear store
      this.clear();
    }
  }


  loginWithFacebook = async (fakeUser, fakeUserProfile) => { // "user click" must not be "async" otherwise login-popup from facebook will be blocked in browser
    try {
      //store.globalSpinner.show();
      if (global.DEBUG_AUTH_ALLOW_FAKE_IDS) {
        if (fakeUser) this.merge("auth", fakeUser);
        if (fakeUserProfile) this.merge("userCard", fakeUserProfile);
      }
      //global.log("$$$$$$$$$---->", this.isValidUser, Boolean(!!this.auth.servertoken && !!this.auth.userid), this.servertoken, this.userid, this.isValidUserProfile, fakeUser, fakeUserProfile, toJS(this.auth), toJS(this.userCard));

      // open faceboook login dialog
      if (!this.isValidUser) { // no valid userid or servertoken -> logout (clear all) -> login-popup facebook to get fbid and fbtoken
        this.logout();
        /////
        // facebook
        ///////////////
        // OPEN LOGIN-SCREEN FACEBOOK -> ask for fb-userid and fb-accesstoken
        let fb, fbME;

        fb = await store.facebook.askFacebook4Accesstoken(); // fb.init() MUST NOT be "async", thats why init is done in constuctor of RouteLogin
        // fb::
        //  accessToken: authResponse.accessToken,
        //  userID: authResponse.userID,
        //  error: null,
        if (!fb || fb.error || !fb.accessToken || !fb.userID )
        throw new Error("failed to access facebook");

        fbME = await store.facebook.askFacebook4Me("id,email,name,picture");
        global.log("store:: user:: loginWithFacebook:: askFacebook4Accesstoken:: fb, fbME:: ", fb, fbME)

        // DEBUG:: after successfull login to official facebook account -> add some fake to facebook-id to force server to create a new user.
        if (global.DEBUG_AUTH_ALLOW_FAKE_IDS && fakeUser && fakeUser.hasOwnProperty("userid")) {
          fb.userID = fb.userID + "FAKE" + fakeUser.userid;
        }

        const { userID: fbUserID, accessToken: fbAccessToken, } = fb;

        /////
        //  server-call: get or create user and update tokens
        ///////////////
        // search server-database "DBUsers" for fb-userid and create new user and / or return userid and servertoken
        let userObject;
        userObject = await this.apiCALL_DBUsers_loginWithFacebook(fbUserID, fbAccessToken);
        global.log("store:: user:: loginWithFacebook:: askFacebook4Accesstoken:: apiCALL_DBUsers_loginWithFacebook:: ", userObject)
        //userObject
        //  isnewuser: true OR false
        //  user:
        //    accountstatus: [0]
        //    createdAt: "1970-01-19T03:30:08.368Z"
        //    email:
        //    fbemail:
        //    fbtoken:
        //    fbuserid:
        //    forcenew: "0"
        //    logintype: "facebook"
        //    memberstatus: [0]
        //    phonenumber: ""
        //    servertoken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2lkIjoiNjZmNTczNzNlNzY2MTIzMzljYWY3MmVlMTAzYzRhNTJkYjI1NjQ4MSIsImZiaWQiOiI1NzM5MjkzODk3NDI4NjMiLCJoYXNoIjoiYzVlMDA0NTE4NGY5ZjIxOTkzNmNkMzJlMmE2M2IxYWJlMTE5NGU3MiIsImlhdCI6MTU2ODg3NTk2MSwiZXhwIjoxNTY5NDgwNzYxLCJhdWQiOiJtZW1iZXIiLCJpc3MiOiJ4ZHgiLCJzdWIiOiJub3RoaW5nIiwianRpIjoiaWQxIn0.T-zKobehjuSjeWXpekcm-NXMjJbCsvSORKA6pmN9ATw"
        //    updatedAt: "1970-01-19T03:47:55.961Z"
        //    userid: "66f57373e76612339caf72ee103c4a52db256481"

        if (!userObject || !userObject.hasOwnProperty("isnewuser") || !userObject.hasOwnProperty("user"))
        throw new Error("invalid server response (userObject)");

        let { isnewuser: s_isNewUser, user: s_user, /*fbname: s_fbname,*/ /*newuser*/ } = userObject;
        if (!s_user || !s_user.userid || !s_user.servertoken)
        throw new Error("invalid server response (userid / servertoken)");

        /////
        //  mobx: set user and token
        ///////////////
        // check for DEBUG_FAKE
        const fakePos = fbUserID.indexOf("FAKE", 1); // -1 if no FAKE
        const fbuserid_withoutFAKE = (fakePos < 0) ? fbUserID : fbUserID.slice(0, fakePos);

        if (s_isNewUser) ;

        this.userid = s_user.userid;
        this.servertoken = s_user.servertoken;

        this.accountstatus = s_user.hasOwnProperty("accountstatus") ? s_user.accountstatus : [];
        this.memberstatus = s_user.hasOwnProperty("memberstatus") ? s_user.memberstatus : [];

        this.fbemail = s_user.hasOwnProperty("fbemail") ? s_user.fbemail : "";
        this.fbuserid = fbuserid_withoutFAKE;
        this.fbME = fbME;

        this.email = s_user.hasOwnProperty("email") ? s_user.email : s_user.hasOwnProperty("fbemail") ? s_user.fbemail : "";
        this.phonenumber = s_user.hasOwnProperty("phonenumber") ? s_user.phonenumber : "";
      } // !isValidUser

      if (!this.isValidUserProfile) { // no valid userid or servertoken -> logout (clear all) -> login-popup facebook to get fbid and fbtoken
        // call-server for usercard
        await this.apiCALL_DBUsers_loadUserFromServerDatabase(this.userid, this.userid, this.servertoken);

        if (!this.isValidUserProfile) { // no valid userid or servertoken -> logout (clear all) -> login-popup facebook to get fbid and fbtoken
          this.clear_obj("userCard");

          const { picture: fbPicture, } = this.fbME;

          // update Gallery:: get profile-image from facebook and upload to server and return url from server and add to gallery
          const isSilhouette = (fbPicture && fbPicture.hasOwnProperty("data") && fbPicture.data.hasOwnProperty("is_silhouette") && fbPicture.is_silhouette === true)

          if (!isSilhouette) {
            try {
              // http://graph.facebook.com/373932389756869/picture?type=square&height=500&width=500& -> jpeg
              const fbProfileImageURL = `http://graph.facebook.com/${this.fbuserid}/picture?type=square&height=1000&width=1000&`;
              const img = await Jimp.read(fbProfileImageURL);
              /*const imgbase64 = */await img.getBase64Async(Jimp.MIME_JPEG);

              // server-call -> store image in database
              //await this.userCard.userGallery.apiCALL_DBUserGallery_addImageOwnANDupdateStore(this.userid, this.servertoken, "url", imgbase64)

            } catch (error) {
              global.log("store:: user:: loginWithFacebook:: ERROR:: ", error);
            }
          }
        }
      }

      global.log("store:: user:: loginWithFacebook:: isValid:: ", this.isValidUser, this.isValidUserProfile);
      return this.isValidUserProfile;
    } catch (error) {
      global.log("store:: user:: loginWithFacebook:: ERROR:: ", error);
      throw error;
    } finally {
      //store.globalSpinner.hide();
    }
  }


  // api-calls
  apiCALL_DBUsers_logout = async (userid, servertoken) => {
    const socketCall = `/api2/auth/logout`;
    //REST-call:: const url_param = `${process.env.REACT_APP_SERVERURL}/api2/auth/logout`;
    try {
      if (!userid || !servertoken)
      throw new Error("invalid userid / servertoken");

      const headers = {
        //REST-call:: Accept: "application/json", 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
        'userid': userid,
        'authorization': servertoken,
      };
      const params = {
      };
      const body = { // REST-call:: NEED to be all LOWERCASE
        // userid: userid,
      };
      // socket-call::
      const userLoggedOut = await store.socketio.emitWithTimeoutAndConvertStatusToError(socketCall, { headers: headers || {}, body: body || {}, params: params || {}, }, 5000);
      // REST-call:: const options = { method: 'POST', headers: headers, body: JSON.stringify(body), timeout: 5000}; // throw on timeout
      // REST-call:: const result = await fetchWithTimeout(url_param, options, });
      // REST-call:: if (!serverResponse || serverResponse.status !== 200 || serverResponse.ok !== true || serverResponse.statusText !== 'OK') throw new Error("could not connect to server.");
      // REST-call:: const returnObject = await serverResponse.json();
      // REST-call:: if (returnObject.status !== "ok") throw new Error(returnObject.status);
      // REST-call:: returnObject.result = dbProfile,
      // REST-call:: const userLoggedOut = returnObject.result; // from server/DBUserProfile -> getUserProfile

      global.log(`store:: user:: apiCALL_DBUsers_logout:: ${socketCall}:: userLoggedOut:: `, userLoggedOut);
      return userLoggedOut;
    } catch(error) {
      global.log(`store:: user:: apiCALL_DBUsers_logout:: ${socketCall}:: ERROR:: `, error)
      throw error; // return { status: error, result: null, }
    }
  }


  apiCALL_DBUsers_loginWithFacebook = async (fbUserID, fbAccessToken,) => {
    const socketCall = `/api2/token/get`;
    try {
      if (!fbUserID || !fbAccessToken)
      throw new Error("invalid fb-userid / fb-accesstoken");

      const headers = { //Accept: "application/json", 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
        // NEED to be all LOWERCASE
        'logintype': 'facebook',
        'fbuserid': fbUserID, // userid or userid + "FAKE" + number
        'fbaccesstoken': fbAccessToken,
        'authorization': '',
      };
      const params = {
      };
      const body = {
      };
      const userObject = await store.socketio.emitWithTimeoutAndConvertStatusToError(socketCall, { headers: headers || {}, body: body || {}, params: params || {}, }, 5000);

      global.log(`store:: user:: apiCALL_DBUsers_loginWithFacebook:: ${socketCall}:: userObject:: `, userObject);
      return userObject;
    } catch(error) {
      global.log(`store:: user:: apiCALL_DBUsers_loginWithFacebook:: ${socketCall}:: ERROR:: `, error);
      throw error;
    }
  }

  apiCALL_DBUsers_loadUserFromServerDatabase = async (targetuserid, userid, servertoken,) => {

    await saveToPersistentDatabase();
  }

  apiCALL_DBUsers_saveUserToServerDatabase = async (targetuserid, userid, servertoken,) => {

  }


};

decorate(Store, {
  _obervables: observable,
  _helpers: observable,
});

export default Store;
