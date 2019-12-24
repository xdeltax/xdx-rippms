"use strict";

const fse = require('fs-extra');

const Datastore = require('nedb-promises');

const validator = require('validator');
const Joi = require('@hapi/joi');
const JoiValidateThrow = requireX('tools/joivalidatethrow');
const JoiValidateFallback = requireX('tools/joivalidatefallback');

//const fbGraphAPI = require('fbgraph');

const crypto = require('crypto');
const jwt = requireX('tools/auth/jwt');
const createErrorHash = requireX('tools/errorHash');

const accountstatusREADONLY = ["default", "owner", "admin", "moderator", "reviewer", "hidden", "locked", "blocked", "banned", "removed", "disbanded" ];
const memberstatusREADONLY  = ["default", "vip", "vip+", "idle", ];

const schemaUser = Joi.object().keys({
  //_id
  userid: 			Joi.string().alphanum().min(30).max(50).normalize().required(),
  uid: 					Joi.string().allow('').min(0).max(99).alphanum().normalize().optional(),
 	fphash: 			Joi.string().min(10).max(40).alphanum().normalize().optional(),
  servertoken: 	Joi.string().trim().min(1).max(399).required(),
  email: 				Joi.string().max(256).email().allow("").allow(null).normalize().optional().default(""),
  phonenumber: 	Joi.string().max(64).allow("").allow(null).normalize().optional().default(""),
  facebookid:   Joi.string().trim().min(1).max(50).alphanum().normalize().optional(),
  googleid:    	Joi.string().trim().min(1).max(50).alphanum().normalize().optional(),
	provider:    	Joi.string().trim().min(1).max(50).alphanum().normalize().required(),
	providertoken:Joi.string().min(30).max(499).alphanum().normalize().required(),
  forcenew: 		Joi.string().trim().min(1).max(99).optional(),
  createdAt: 		Joi.date().optional(),
  updatedAt: 		Joi.date().optional(),

  memberstatus : Joi.array().items( Joi.number().integer().min(0).max(99).optional() ).optional(),
  accountstatus: Joi.array().items( Joi.number().integer().min(0).max(99).optional() ).optional(),
});


module.exports = class DBUsers {
  static collectionName() { return 'users'; }

  static databasePath()   { return global.abs_path("../"+process.env.DATABASE_NEDB); }

  constructor() {

  }


  //////////
  // init / load database at startup of nodejs
  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  static async load() { // static method (not affected by instance) -> called with classname: DBGeoData.load
    try {
			fse.ensureDir(this.databasePath(), { mode: 0o0700, });
      this.db = Datastore.create(this.databasePath() + this.collectionName() + ".db");

      await this.db.ensureIndex({ fieldName: 'userid', }); // index for quick searching the userid

      return this.db;
    } catch (error) { throw new Error(this.collectionName() + error); }
    return false;
  }; // of load



	static async loginWithProvider(provider, providerid, providertoken, uid, fingerprinthash) { // create or update database
    const now = new Date() / 1000;
		try {
		  // ===============================================
		  // normalize input
		  // ===============================================
	    const valid_provider = JoiValidateFallback(provider, null, Joi.string().min(1).max(30).alphanum().normalize().required(), ); 
			if (!valid_provider || (valid_provider !== "facebook" && valid_provider !== "google")) throw "invalid provider";

			// user-id
			// facebook: '573929389742863', (15)
			// google: '115290779649011912108', (21)
	    const valid_providerid = JoiValidateFallback(providerid, null, Joi.string().trim().min(1).max(50).alphanum().normalize().required(), ); 
			if (!valid_providerid) throw "invalid provider-id";

			// accesstoken
			// facebook: 'EAAFSPeVOQKkBAJ6M6eGAJViYu1UwuKF9eumKV1cr2hMrEEehOayxGSgQhQmUBLZBsz3rc8ZAy4aurHOKUHZBqYt6XZCCZAedzXA6Mo9aJGCGZBAyApXLoReCDtzXOHWAAlUyflQ5ZCcwhW4lHN7z5M88QrICD7UeZBKup3a94gj8dAZDZD',
			// google: 'ya29.ImC2B0PDxykRp-dr-k9SjTCBHSfwcxNEamphbOgVx0Z4POrqEo7IfnT7YCF6hTGwzZJnWKNAzEwjV29QmPwfIqtjUlkdgqnnfLBxDa8A-xrvKlC5Z9NXXk0LVq2GpjCL1lk',
	    const valid_providertoken = JoiValidateFallback(providertoken, null, Joi.string().min(30).max(499).alphanum().normalize().required(), ); 
			if (!valid_providertoken) throw "invalid provider-token";

	  	// fingerprint of client-device:: '47a9591391229e99a2417d27fbc32147' (32, alphanum:: a-z, A-Z, and 0-9)
	    const valid_fingerprinthash = JoiValidateFallback(fingerprinthash, "", Joi.string().min(10).max(40).alphanum().normalize().optional(), ); 

			// fake-username(-extension) for debugging:: 'fakeusername1',
	    const valid_uid = JoiValidateFallback(uid, "", Joi.string().allow('').min(0).max(99).alphanum().normalize().optional(), ); 

		  // ===============================================
		  // create userid from provider-id and uid 
		  // ===============================================
	    // create a unique userid from the hashed facebook id (same fb-id generates always the same userid)
	    const creationBase = valid_uid + valid_providerid;
	    const userid_created = crypto.createHash('sha1').update(JSON.stringify(creationBase)).digest('hex');

		  // ===============================================
		  // search db
		  // ===============================================
	    // check if user already exists (and get user data for login-count then)
	    let thisUser = await this.findOne( { "userid": userid_created, }, ); // not found -> null

	    const isNewUser = Boolean(!thisUser);

		  // ===============================================
		  // create user-object (if user not in db)
		  // ===============================================
	    // create new user-account in server-database if user not found
	    if (isNewUser) {
	      thisUser = {
	        //_id: (unique hash) generated by database
	        userid: userid_created, // hash of facebook-id
	        uid: valid_uid,
	        //servertoken: "", // will be generated later

	        fphash: valid_fingerprinthash,

	        //facebookid
	        //googleid

	    		provider: valid_provider,
	    		providertoken: valid_providertoken,

	        forcenew: "0", // set this to anything else to force the servertoken of this user to be invalid -> new login with fb

	        memberstatus: [0],
	        accountstatus: [0],

	        createdAt: now,
	        //updatedAt: Date.now() / 1000,
	      };
	    }


		  // ===============================================
		  // add / update userid of used login provider
		  // ===============================================
	    switch (provider) {
	    	case "facebook": 	
	    		thisUser.facebookid = valid_providerid; 
	    		break;
	    	case "google": 		
	    		thisUser.googleid = valid_providerid; 
	    		break;
	    	default: 
	    		break;
			}


		  // ===============================================
		  // create new servertoken
		  // ===============================================
	    const hash = crypto.createHash('sha1').update(JSON.stringify(thisUser.forcenew + thisUser.providertoken)).digest('hex');
	    const jwtservertoken = jwt.sign(thisUser.userid, thisUser.provider, thisUser.fbuserid, hash); // (payload)


		  // ===============================================
	    // update userdata with new servertoken
		  // ===============================================
	    thisUser.servertoken = jwtservertoken;
	    thisUser.updatedAt = now; 


		  // ===============================================
	    // check userdata
		  // ===============================================
	    const valid_user = JoiValidateFallback(thisUser, null, schemaUser, {abortEarly: true, convert: true, allowUnknown: false, stripUnknown: true, } );
	    if (!valid_user) throw "invalid user-object";


		  // ===============================================
	    // update user in database
		  // ===============================================
	    const numReplace = await this.updateFull( {userid: valid_user.userid}, valid_user);
	    if (numReplace !== 1) throw "invalid update count";

			//global.log("XXX2:", querydata, provider, isNewUser, thisUser)
	    return ( { err: null, res: valid_user, } );
	  } catch (error) {
	  	const hashcode = createErrorHash(error);
	  	global.log("loginWithProvider:: ERROR:: ", hashcode, error);
	    return ( { err: `login failed (${hashcode})`, res: null, } );	  	
	  }
	}


	/*
  // SERVER LOGOUT
  static async logout(req, res) {
    //global.log("DBUsers:: logout:: req:: ", req)
    try {
      const now = new Date() / 1000;

      const clientip = validator.escape(req.clientip || ""); // requestIp.getClientIp(mainreq);

      // servertoken is already verified in socket-event or routes/protected/index -> hash

      // unverified input from client
      const { // header-content
        userid : req_userid,               
        authorization: req_authorization,  
      } = req.headers;

      const {
        //userprofile: req_userprofile,
      } = req.body;

      const {
        //useridtarget: req_useridtarget,
      } = req.params;

      // *****************************************************************************************************************

      const valid_userid        = JoiValidateThrow(req_userid        , Joi.string().min(30).max(50).alphanum().normalize().required(), "(1)invalid client request header: " ); // return valid object or throw
      const valid_authorization = JoiValidateThrow(req_authorization , Joi.string().min(30).max(499).normalize().required(), "(2)invalid client request header: " ); // return valid object or throw

      // *****************************************************************************************************************

      // extract the userid from servertoken
      const decodedServertoken = jwt.decode(valid_authorization);
      // usid: dbUser._id  // fbid: dbUser.fbid  // hash: crypto.createHash('sha1').update(JSON.stringify(dbUser.forcenew + dbUser.fbtoken)).digest('hex');
      if (!decodedServertoken || !decodedServertoken.hasOwnProperty("usid"))
      throw new Error("invalid servertoken");

      // extract userid from validated token (token was already validated in middleware)
      const userid_from_servertoken = decodedServertoken.usid;
      if (!userid_from_servertoken)
      throw new Error("invalid user id from token");

      if (valid_userid !== userid_from_servertoken)
      throw new Error("user id mismatch");

      // *****************************************************************************************************************

      let thisUser = await this.findOne( { "userid": valid_userid, }, ); // not found -> null
      if (!thisUser)
      throw new Error("logout failed (user not found)::", valid_userid);

      thisUser.servertoken = "";
      thisUser.fbtoken = "";
      thisUser.updatedAt = now; // Date.now() / 1000;

      const numReplace = await this.updateFull( {userid: thisUser.userid}, thisUser);
      if (numReplace !== 1)
      throw new Error("failed to logout user from database (update failed)");

      // return to client in "result"
      const returnObject = thisUser;

      global.log("DBUsers:: logout:: returnObject:: ", returnObject)
      return ( { status: "ok", result: returnObject, } );
    } catch(error) {
      global.log("DBUsers:: logout:: ERROR:: ", error)
      return ( { status: "DBUsers:: logout:: error-message:: " + error.message, result: null, } );
    }
  }; // of logout


  // update: email and phonenumber
  static async updateOwn(req, res) {
    //global.log("DBUsers:: updateOwn:: req:: ", req)
    try {
      const now = new Date() / 1000;

      const clientip = validator.escape(req.clientip || ""); // requestIp.getClientIp(mainreq);

      // servertoken is already verified in socket-event or routes/protected/index -> hash

      // unverified input from client
      const { // header-content
        userid : req_userid,        
        authorization: req_authorization, 
      } = req.headers;

      const {
        email: req_email,
        phonenumber: req_phonenumber,
      } = req.body;

      const {
        //useridtarget: req_useridtarget,
      } = req.params;

      // *****************************************************************************************************************

      const valid_userid        = JoiValidateThrow(req_userid        , Joi.string().min(30).max(50).alphanum().normalize().required(), "(1)invalid client request header: " ); // return valid object or throw
      const valid_authorization = JoiValidateThrow(req_authorization , Joi.string().min(30).max(499).normalize().required(), "(2)invalid client request header: " ); // return valid object or throw
      const valid_email         = JoiValidateThrow(req_email         , Joi.string().max(256).email().allow("").allow(null).normalize().require(), "(3)invalid client request header: " ); // return valid object or throw
      const valid_phonenumber   = JoiValidateThrow(req_phonenumber   , oi.string().max(64).allow("").allow(null).normalize().require(), "(4)invalid client request header: " ); // return valid object or throw

      // *****************************************************************************************************************

      // extract the userid from servertoken
      const decodedServertoken = jwt.decode(valid_authorization); // encoding in unprotected/DBUsers
      // usid: dbUser._id  // fbid: dbUser.fbid  // hash: crypto.createHash('sha1').update(JSON.stringify(dbUser.forcenew + dbUser.fbtoken)).digest('hex');
      if (!decodedServertoken || !decodedServertoken.hasOwnProperty("usid"))
      throw new Error("invalid servertoken");

      // extract userid from validated token (token was already validated in middleware)
      const userid_from_servertoken = decodedServertoken.usid;
      if (!userid_from_servertoken)
      throw new Error("invalid user id from token");

      if (valid_userid !== userid_from_servertoken)
      throw new Error("user id mismatch");

      // *****************************************************************************************************************

      let thisUser = await this.findOne( { "userid": valid_userid, }, ); // not found -> null

      thisUser.email = valid_email;
      thisUser.phonenumber = valid_phonenumber;
      thisUser.updatedAt = now; // Date.now() / 1000;

      const numReplace = await this.updateFull( {userid: thisUser.userid}, thisUser);
      if (numReplace !== 1)
      throw new Error("failed to update user");

      // return to client in "result"
      const returnObject = thisUser;

      global.log("DBUsers:: updateOwn:: returnObject:: ", returnObject)
      return ( { status: "ok", result: returnObject, } );
    } catch(error) {
      global.log("DBUsers:: updateOwn:: ERROR:: ", error)
      return ( { status: "DBUsers:: updateOwn:: error-message:: " + error.message, result: null, } );
    }
  }; // of updateOwn

  // internal function
  static async _getUser(valid_userid, isOWN) {
    const dbResultLimited = (item) => { // keep or drop props
      // const dbGallery = array.map(( {propsToDrop1, propsToDrop2, ...keepAttrs}) => keepAttrs)
      // const dbGallery = array.map(( {propsToKeep1, propsToKeep2, } ) => ( {propsToKeep1, propsToKeep2, } ))
      // filter item
      let { // get from object
        userid,
        accountstatus,
        memberstatus,
        updatedAt,
        createdAt,
      } = item;
      // modify object
      //fname = (viewgroup==="all") ? fname : fblur;
      return { // set to new object
        userid,
        accountstatus,
        memberstatus,
        updatedAt,
        createdAt,
      }
    }; // of _getUser

    let res;
    try {
      const dbResultFull = await this.findOne( { "userid": valid_userid, }, ); // not found -> null
      // if isOwn -> return full database entry; if !isOwn -> return limited dataset only
      if (dbResultFull && dbResultFull.hasOwnProperty("userid")) res = (isOWN) ? dbResultFull : dbResultLimited(dbResultFull);
    } catch (error) { // fail silent
      global.log("DBUser:: _getUser:: ERROR:: ", error)
      res = null;
    } finally {
      return res;
    }
  }


  static async getUser(req, res) {
    //global.log(">>>>>>>>>>>> DBUsers:: ", req)
    try {
      const clientip = validator.escape(req.clientip || ""); // requestIp.getClientIp(mainreq);

      // servertoken is already verified in socket-event or routes/protected/index -> hash

      // unverified input from client
      const { // header-content
        userid : req_userid,         
        authorization: req_authorization,  
      } = req.headers;

      const {
      } = req.body;

      const {
        useridtarget: req_useridtarget,
      } = req.params;

      // *****************************************************************************************************************

      const valid_userid        = JoiValidateThrow(req_userid        , Joi.string().min(30).max(50).alphanum().normalize().required(), "(1)invalid client request header: " ); // return valid object or throw
      const valid_authorization = JoiValidateThrow(req_authorization , Joi.string().min(30).max(499).normalize().required(), "(2)invalid client request header: " ); // return valid object or throw
      const valid_useridtarget  = JoiValidateThrow(req_useridtarget  , Joi.string().min(30).max(50).alphanum().normalize().required(), "(2)invalid client request header: " ); // return valid object or throw

      // *****************************************************************************************************************

      // extract the userid from servertoken
      const decodedServertoken = jwt.decode(valid_authorization); // encoding in unprotected/DBUsers
      // usid: dbUser._id  // fbid: dbUser.fbid  // hash: crypto.createHash('sha1').update(JSON.stringify(dbUser.forcenew + dbUser.fbtoken)).digest('hex');
      if (!decodedServertoken || !decodedServertoken.hasOwnProperty("usid"))
      throw new Error("invalid servertoken");

      // extract userid from validated token (token was already validated in middleware)
      const userid_from_servertoken = decodedServertoken.usid;
      if (!userid_from_servertoken)
      throw new Error("invalid user id from token");

      if (valid_userid !== userid_from_servertoken)
      throw new Error("user id mismatch");

      // *****************************************************************************************************************

      const isOWN = (valid_userid === valid_useridtarget); // check if OWN-stuff is requestd -> more info is returned

      // *****************************************************************************************************************

      const returnableUser = await this._getUser(valid_userid, isOWN); // result is different (reduced) for isOWN = false

      // return to client in "result"
      const returnObject = returnableUser;

      global.log("DBUsers:: getUser:: returnObject:: ", returnObject)
      return ( { status: "ok", result: returnObject, } );
    } catch(error) {
      global.log("DBUsers:: getUser:: ERROR:: ", error)
      return ( { status: "DBUsers:: getUser:: error-message:: " + error.message, result: null, } );
    }
  }; // of getUser
*/













  /*
  static async _getUserCard(valid_userid, isOWN) {
    let res = null;
    try {
      const returnableUser = await this._getUser(valid_userid, isOWN); // result is different (reduced) for isOWN = false
      const returnableUserGallery = await DBUserGallery._getUserGallery(valid_userid, isOWN, 0); // result is different (reduced) for isOWN = false
      const returnableUserProfile = await DBUserProfile._getUserProfile(valid_userid, isOWN); // result is different (reduced) for isOWN = false
      const returnableUserLocationTrail = await DBUserLocationTrail._getUserLocationTrail(valid_userid, isOWN); // result is different (reduced) for isOWN = false
      const returnableUserOnlineStatus = await DBOnline._getOnlineStatus(valid_userid, isOWN); // result is different (reduced) for isOWN = false

      res = {
        isOwn: isOwn,
        user: returnableUser,
        userProfile: returnableUserProfile,
        userGallery: returnableUserGallery,
        userLocationTrail: returnableUserLocationTrail,
        userOnlineStatus: returnableUserOnlineStatus,
      }

    } catch (error) {
      res = null;
    } finally {
      return res;
    }
  }

  static async getUserCard(req, res) {
    //global.log(">>>>>>>>>>>> DBUsers:: ", req)
    try {
      const clientip = validator.escape(req.clientip || ""); // requestIp.getClientIp(mainreq);

      // servertoken is already verified in socket-event or routes/protected/index -> hash

      // unverified input from client
      const { // header-content
        userid : req_userid,        
        authorization: req_authorization,  $
      } = req.headers;

      const {
      } = req.body;

      const {
        useridtarget: req_useridtarget,
        simulateResticted: req_simulateResticted, // undefined if not exists, otherwise true or false
      } = req.params;

      // *****************************************************************************************************************

      const valid_userid        = JoiValidateThrow(req_userid        , Joi.string().min(30).max(50).alphanum().normalize().required(), "(1)invalid client request header: " ); // return valid object or throw
      const valid_authorization = JoiValidateThrow(req_authorization , Joi.string().min(30).max(499).normalize().required(), "(2)invalid client request header: " ); // return valid object or throw
      const valid_useridtarget  = JoiValidateThrow(req_useridtarget  , Joi.string().min(30).max(50).alphanum().normalize().required(), "(2)invalid client request header: " ); // return valid object or throw

      // *****************************************************************************************************************

      // *****************************************************************************************************************

      // extract the userid from servertoken
      const decodedServertoken = jwt.decode(valid_authorization); // encoding in unprotected/DBUsers
      // usid: dbUser._id  // fbid: dbUser.fbid  // hash: crypto.createHash('sha1').update(JSON.stringify(dbUser.forcenew + dbUser.fbtoken)).digest('hex');
      if (!decodedServertoken || !decodedServertoken.hasOwnProperty("usid"))
      throw new Error("invalid servertoken");

      // extract userid from validated token (token was already validated in middleware)
      const userid_from_servertoken = decodedServertoken.usid;
      if (!userid_from_servertoken)
      throw new Error("invalid user id from token");

      if (valid_userid !== userid_from_servertoken)
      throw new Error("user id mismatch");

      // *****************************************************************************************************************

      const isOWN = (req_simulateResticted === true) ? false : (valid_userid === valid_useridtarget); // check if OWN-stuff is requestd -> more info is returned

      // *****************************************************************************************************************

      const returnableUserCard = await this._getUserCard(valid_useridtarget, isOWN); // result is different (reduced) for isOWN = false

      // return to client in "result"
      const returnObject = returnableUserCard;

      global.log(">>DBUser:: getUser:: ", returnObject)
      return ( { status: "ok", result: returnObject, } );
    } catch(error) {
      global.log(">>DBUser:: getUser:: ", error)
      return ( { status: error.message, result: null, } );
    }
  }
  /*

  /*
  static async _updateUserCard(valid_userid, req) {
    //userObject:
    //  userid: toJS(this.userid),
    //  onlineStatus: toJS(this.onlineStatus.get_all()),
    //  userProfile: toJS(this.userProfile.get_all()),
    //  userGallery: toJS(this.userGallery.get_all()),
    //  userLocation: toJS(this.userLocation.get_all()),
    //  userFavorites: toJS(this.userFavorites.get_all()),
    let res = null;
    try {
      const _body_userProfile = { userprofile: req.body.userProfile }
      const _req_userProfile = { headers: req.headers, params: req.params, body: _body_userProfile, }
      const userProfile = await require('./database/nedb/DBUserProfile').updateUserProfileOwn(_req_userProfile, res) ) });

      const _body_userGallery = { gallery: req.body.userGallery }
      const _req_userUserGallery = { headers: req.headers, params: req.params, body: _body_userGallery, }
      const userGallery = await require('./database/nedb/DBUserGallery').updateGalleryOwn(req, res) ) });

      const onlineStatus = await require('./database/nedb/DBOnline').updateOnlineStatus(req, res) ) }); // call from /client/DBUserProfile -> apiCALL_DBUserProfile_getUserProfileOwn

      //updates only dynamic triggered:: await require('../../database/nedb/DBUserLocationTrail').updateUserLocationTrailOwn(req, res) ) });


      const returnableUser = await this._getUser(valid_userid, isOWN); // result is different (reduced) for isOWN = false
      const returnableUserGallery = await DBUserGallery._getUserGallery(valid_userid, isOWN, 0); // result is different (reduced) for isOWN = false
      const returnableUserProfile = await DBUserProfile._getUserProfile(valid_userid, isOWN); // result is different (reduced) for isOWN = false
      const returnableUserLocationTrail = await DBUserLocationTrail._getUserLocationTrail(valid_userid, isOWN); // result is different (reduced) for isOWN = false
      const returnableUserOnlineStatus = await DBOnline._getOnlineStatus(valid_userid, isOWN); // result is different (reduced) for isOWN = false


      res = {
        isOwn: isOwn,
        user: returnableUser,
        userProfile: returnableUserProfile,
        userGallery: returnableUserGallery,
        userLocationTrail: returnableUserLocationTrail,
        userOnlineStatus: returnableUserOnlineStatus,
      }

    } catch (error) {
      res = null;
    } finally {
      return res;
    }
  }

  static async updateUserCard(req, res) {
    //global.log(">>>>>>>>>>>> DBUsers:: ", req)
    try {
      const clientip = validator.escape(req.clientip || ""); // requestIp.getClientIp(mainreq);

      // servertoken is already verified in socket-event or routes/protected/index -> hash

      // unverified input from client
      const { // header-content
        userid : req_userid,        
        authorization: req_authorization,  
      } = req.headers;

      const {
        userObject: req_userObject,
      } = req.body;

      const {
        useridtarget: req_useridtarget,
      } = req.params;

      // *****************************************************************************************************************

      const valid_userid        = JoiValidateThrow(req_userid        , Joi.string().min(30).max(50).alphanum().normalize().required(), "(1)invalid client request header: " ); // return valid object or throw
      const valid_authorization = JoiValidateThrow(req_authorization , Joi.string().min(30).max(499).normalize().required(), "(2)invalid client request header: " ); // return valid object or throw
      const valid_useridtarget  = JoiValidateThrow(req_useridtarget  , Joi.string().min(30).max(50).alphanum().normalize().required(), "(2)invalid client request header: " ); // return valid object or throw

      // *****************************************************************************************************************

      // *****************************************************************************************************************

      // extract the userid from servertoken
      const decodedServertoken = jwt.decode(valid_authorization); // encoding in unprotected/DBUsers
      // usid: dbUser._id  // fbid: dbUser.fbid  // hash: crypto.createHash('sha1').update(JSON.stringify(dbUser.forcenew + dbUser.fbtoken)).digest('hex');
      if (!decodedServertoken || !decodedServertoken.hasOwnProperty("usid"))
      throw new Error("invalid servertoken");

      // extract userid from validated token (token was already validated in middleware)
      const userid_from_servertoken = decodedServertoken.usid;
      if (!userid_from_servertoken)
      throw new Error("invalid user id from token");

      if (valid_userid !== userid_from_servertoken)
      throw new Error("user id mismatch");

      // *****************************************************************************************************************

      const isOWN = (valid_userid === valid_useridtarget); // check if OWN-stuff is requestd -> more info is returned

      if (isOWN !== true)
      throw new Error("update operation not allowed for other users");

      // *****************************************************************************************************************

      const returnableUserCard = await this._updateUserCard(valid_useridtarget, req);

      // return to client in "result"
      const returnObject = returnableUserCard;
      global.log(">>DBUser:: getUser:: ", returnObject)
      return ( { status: "ok", result: returnObject, } );
    } catch(error) {
      global.log(">>DBUser:: getUser:: ", error)
      return ( { status: error.message, result: null, } );
    }
  }
  */


  //////////
  // default database operations
  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  static count(query)                           { return this.db.count(query) }
  static countAll()                             { return this.count( {} ) }

  static find(query, projection)                { return this.db.find(query, projection || {} ) }   // return cursor
  static findOne(query, options)                { return this.db.findOne(query, options) }          // return element
  static findAll()                              { return this.find( {} , {} ) }

  // https://github.com/louischatriot/nedb/wiki/Updating-documents
  // update:: A new document will replace the matched docs
  // options:: multi (defaults to false) which allows the modification of several documents if set to true
  //        :: upsert (defaults to false) if you want to insert a new document corresponding to the update rules if your query doesnt match anything
  static updateFull(query, obj)                 { return this.db.update(query, obj, { upsert: true }) }  // numreplaced

  // modifiers: The modifiers create the fields they need to modify if they don't exist, and you can apply them to subdocs. Available field modifiers are $set to change a field's value and $inc to increment a field's value. To work on arrays, you have $push, $pop, $addToSet, and the special $each. See examples below for the syntax.
  static updateMod(query, modifiers )           { return this.db.update(query, modifiers, { upsert: true }) } // numreplaced

  static insertNew(obj)                         { return this.db.insert(obj) }                 // return element with its new _id

  static deleteMany(query)                      { return this.db.remove(query, { multi: true } ) }  // return how many where deleted
  static deleteOne(query)                       { return this.db.remove(query, {} ) }               // return how many where deleted
}
