"use strict";

const Datastore = require('nedb-promises');

const validator = require('validator');
const Joi = require('@hapi/joi');
const JoiValidateThrow = requireX('tools/joivalidatethrow');

const fbGraphAPI = require('fbgraph');

const crypto = require('crypto');
const jwt = requireX('tools/auth/jwt');

const accountstatusREADONLY = ["default", "owner", "admin", "moderator", "reviewer", "hidden", "locked", "blocked", "banned", "removed", "disbanded" ];
const memberstatusREADONLY  = ["default", "vip", "vip+", "idle", ];

const schemaUser = Joi.object().keys({
  //_id
  userid : Joi.string().alphanum().min(30).max(50).normalize().required(),
  logintype : Joi.string().trim().min(1).max(99).required(),
  fbuserid : Joi.string().trim().min(1).max(99).required(),
  fbtoken : Joi.string().trim().min(1).max(299).required(),

  memberstatus : Joi.array().items( Joi.number().integer().min(0).max(99).optional() ).optional(),
  accountstatus : Joi.array().items( Joi.number().integer().min(0).max(99).optional() ).optional(),

  fbemail: Joi.string().max(256).email().allow("").allow(null).normalize().optional().default(""),
  email: Joi.string().max(256).email().allow("").allow(null).normalize().optional().default(""),
  phonenumber: Joi.string().max(64).allow("").allow(null).normalize().optional().default(""),

  servertoken : Joi.string().trim().min(1).max(399).required(),
  forcenew : Joi.string().trim().min(1).max(99).optional(),
  createdAt : Joi.date().optional(),
  updatedAt : Joi.date().optional(),
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
      this.db = Datastore.create(this.databasePath() + this.collectionName() + ".db");

      await this.db.ensureIndex({ fieldName: 'userid', }); // index for quick searching the userid
      await this.db.ensureIndex({ fieldName: 'fbuserid', }); // index for quick searching the userid

      return this.db;
    } catch (error) { throw new Error(this.collectionName() + error); }
    return false;
  }; // of load


  // SERVER-LOGIN -> get facebook-id and facebook-token -> create userid and servertoken
  static async loginWithFacebook(req, res) { // call from /client/DBServer -> apiCALL_getServerTokenFromFacebookToken
    //global.log("DBUsers:: loginWithFacebook:: req:: ", req)
    try {
      const now = new Date() / 1000;

      const clientip = validator.escape(req.clientip || ""); // requestIp.getClientIp(mainreq);

      // unverified input from client
      const { // header-content
        logintype : req_logintype,          // === "facebook"
        fbuserid : req_fbuserid,            // userid from facebook (numbers only) or userid from fb + ".FAKE" + number (to force server to create a new user in debugging)
        fbaccesstoken : req_fbaccesstoken,
        authorization : req_authorization,  // === ""
      } = req.headers;

      const {
        //fbmail: req_fbmail,
        //fbname: req_fbname,
      } = req.body;

      const {
        //useridtarget: req_useridtarget,
      } = req.params;

      // *****************************************************************************************************************

      // verify and normalise (and strip unknown elements) for further use; throw on error
      if (req_logintype !== "facebook") throw new Error("db(1): invalid client request header");
      if (req_authorization !== "") throw new Error("db(2): invalid client request header");
      const valid_fbuserid      = JoiValidateThrow(req_fbuserid      , Joi.string().trim().min(1).max(50).alphanum().normalize().required(), "db(3): invalid client request header: " ); // return valid object or throw
      const valid_fbaccesstoken = JoiValidateThrow(req_fbaccesstoken , Joi.string().min(30).max(499).alphanum().normalize().required(), "db(4): invalid client request header: " ); // return valid object or throw
      //const valid_fbmail        = JoiValidateThrow(req_fbmail        , Joi.string().max(256).email().allow("").allow(null).normalize().optional().default(""), "db(5): invalid client request header: " ); // return valid object or throw
      //const valid_fbname        = JoiValidateThrow(req_fbname        , Joi.string().max(256).allow("").normalize().optional(), "db(6): invalid client request header: " ); // return valid object or throw

      // *****************************************************************************************************************

      // check for DEBUG_FAKE (userid + ".FAKE")
      const fakePos = valid_fbuserid.indexOf("FAKE", 1); // -1 if no FAKE
      const valid_fbuserid_withoutFAKE = (fakePos < 0) ? valid_fbuserid : valid_fbuserid.slice(0, fakePos); // remove ".FAKE"

      // validate facebook token
      //const fbGraphAPI = requireX('tools/auth/fbGraphAPI');
      fbGraphAPI.setAccessToken(valid_fbaccesstoken);
      fbGraphAPI.setOptions({ timeout: 3000, pool: { maxSockets:  Infinity }, headers: { /*connection:  "keep-alive"*/ } });
      const fbGraphAPI_getAsync = async (command) => { return new Promise( (resolve, reject) => { fbGraphAPI.get(command, (err, res) => { if (err) reject(err); resolve(res); }); }); }
      const fbResponse_me = await fbGraphAPI_getAsync("me?fields=id,email,name,picture"); // returns: id, name, email, picture, ...

      // *****************************************************************************************************************

      // validate facebook id (and accestoken) by requesting "me" with fb-accesstoken
      let { id: req_me_id, /*name: req_me_name,*/ email: req_me_email, } = fbResponse_me;

      const valid_me_fbuserid   = JoiValidateThrow(req_me_id      , Joi.string().trim().min(1).max(50).alphanum().normalize().required(), "(3)invalid client request header: " ); // return valid object or throw
      const valid_me_fbemail    = JoiValidateThrow(req_me_email   , Joi.string().max(256).email().allow("").allow(null).normalize().optional().default(""), "(5)invalid client request header: " ); // return valid object or throw

      if (!valid_me_fbuserid
        || valid_me_fbuserid !== valid_fbuserid_withoutFAKE
      ) throw new Error("invalid facebook profile response");

      // *****************************************************************************************************************

      // create a unique userid from the hashed facebook id (same fb-id generates always the same userid)
      const userid_created = crypto.createHash('sha1').update(JSON.stringify(valid_fbuserid)).digest('hex');

      // check if user already exists (and get user data for login-count then)
      let thisUser = await this.findOne( { "userid": userid_created, }, ); // not found -> null

      let isnewuser = (!thisUser) ? true : false;

      // create new user-account in server-database if user not found
      if (isnewuser) {
        //////////////////////////////
        // CREATE NEW USER: user not found -> create user, set token and login-count = 1
        //////////////////////////////
        thisUser = {
          //_id: (unique hash) generated by database
          userid: userid_created, // hash of facebook-id

          accountstatus: [0],
          memberstatus: [0],

          logintype: "facebook", // login-method used
          fbuserid: valid_fbuserid,
          fbemail: valid_me_fbemail,

          email: valid_me_fbemail,
          phonenumber: "",

          forcenew: "0", // set this to anything else to force the servertoken of this user to be invalid -> new login with fb
          //servertoken: "", // will be generated later
          createdAt: now,
          //updatedAt: Date.now() / 1000,
        };
      }

      //global.log("DBUsers:: loginWithFacebook:: thisUser::", thisUser, isnewuser,)
      if (thisUser.userid !== userid_created) throw new Error("invalid user-id");
      if (thisUser.fbuserid !== valid_fbuserid) throw new Error("invalid facebook user-id");


      ////////////////////////////////////////////////////////////////////////////////
      // SERVERTOKEN -> create servertoken
      ////////////////////////////////////////////////////////////////////////////////
      const hash = crypto.createHash('sha1').update(JSON.stringify(thisUser.forcenew + valid_fbaccesstoken)).digest('hex');
      const jwtservertoken = jwt.sign(thisUser.userid, thisUser.fbuserid, hash);

      //////////////////////////////
      // UPDATE USER: with new servertoken and (new) fb-accesstoken
      //////////////////////////////
      // update (old) db-entry with new faceboot-token
      thisUser.servertoken = jwtservertoken;
      thisUser.fbtoken = valid_fbaccesstoken;
      thisUser.updatedAt = now; // Date.now() / 1000;

      // *****************************************************************************************************************

      const valid_user = JoiValidateThrow(thisUser, schemaUser, "db(x): invalid client request header: ", {abortEarly: true, convert: true, allowUnknown: false, stripUnknown: true, } );

      // *****************************************************************************************************************

      const numReplace = await this.updateFull( {userid: valid_user.userid}, valid_user);
      if (numReplace !== 1)
      throw new Error("failed to add user to database");

      // *****************************************************************************************************************

      // return to client in "result"
      const returnObject = {
        isnewuser: isnewuser,           // if newUser -> client redirect to Login_Register else to Profile_Account
        user: valid_user,
      }

      global.log("DBUsers:: loginWithFacebook:: returnObject:: ", returnObject.user.userid)
      return ( { status: "ok", result: returnObject, } );
    } catch(error) {
      global.log("DBUsers:: loginWithFacebook:: ERROR:: ", error)
      return ( { status: "DBUsers:: loginWithFacebook:: error-message:: " + error.message, result: null, } );
    }
  }; // of loginWithFacebook


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
