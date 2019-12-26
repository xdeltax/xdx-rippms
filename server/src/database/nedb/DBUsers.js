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

  // public (store.user)
  userid: 			Joi.string().alphanum().min(30).max(50).normalize().required(),
  servertoken: 	Joi.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/).min(30).max(499).normalize().required(),

  memberstatus :Joi.array().items( Joi.number().integer().min(0).max(99).optional() ).optional(),
  accountstatus:Joi.array().items( Joi.number().integer().min(0).max(99).optional() ).optional(),
  createdAt: 		Joi.date().optional(),
  updatedAt: 		Joi.date().optional(),

  // private
  uid: 					Joi.string().allow('').min(0).max(99).alphanum().normalize().optional(),
 	fphash: 			Joi.string().min(10).max(40).alphanum().normalize().optional(),
  facebookid:   Joi.string().trim().min(1).max(50).alphanum().normalize().optional(),
  googleid:    	Joi.string().trim().min(1).max(50).alphanum().normalize().optional(),
	provider:    	Joi.string().trim().min(1).max(50).alphanum().normalize().required(),
	providertoken:Joi.string().min(30).max(499).normalize().required(),
  forcenew: 		Joi.string().trim().min(1).max(99).optional(),

  //email: 				Joi.string().max(256).email().allow("").allow(null).normalize().optional().default(""),
  //phonenumber: 	Joi.string().max(64).allow("").allow(null).normalize().optional().default(""),
});


module.exports = class DBUsers {
  static collectionName() { return 'users'; }

  static databasePath()   { return global.abs_path("../"+process.env.DATABASE_NEDB); }

  constructor() {

  }

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
	    const valid_providertoken = JoiValidateFallback(providertoken, null, Joi.string().min(30).max(499).normalize().required(), ); 
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
	        //servertoken: "", // will be generated later

	        uid: valid_uid,
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
	    const jwtservertoken = jwt.sign(thisUser.userid, thisUser.provider, valid_providerid, hash); // (payload)


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
			//global.log("XXX1:", provider, isNewUser, valid_user)


		  // ===============================================
	    // update user in database
		  // ===============================================
	    const numReplace = await this.updateFull( {userid: valid_user.userid}, valid_user);
	    if (numReplace !== 1) throw "invalid update count";

			//global.log("XXX2:", provider, isNewUser, thisUser)
			//global.log("XXX3:", provider, isNewUser, valid_user)

	    return ( { err: null, res: valid_user, } );
	  } catch (error) {
	  	const hashcode = createErrorHash(error);
	  	global.log("DBUsers:: loginWithProvider:: ERROR:: ", hashcode, error);
	    return ( { err: `login failed (${hashcode})`, res: null, } );	  	
	  }
	}



	static async getUser(targetuserid, userid, servertoken) { 
    try {
			const valid_targetuserid= JoiValidateFallback(targetuserid, null, Joi.string().min(30).max(50).alphanum().normalize().required(),); 
			const valid_userid      = JoiValidateFallback(userid      , null, Joi.string().min(30).max(50).alphanum().normalize().required(),); 
	    const valid_servertoken = JoiValidateFallback(servertoken , null, Joi.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/).min(30).max(499).normalize().required(),); 
			if (!valid_targetuserid || !valid_userid || !valid_servertoken) throw new Error("invalid input");

      const isOWN = (valid_userid === valid_targetuserid); // check if OWN-stuff is requestd -> more info is returned

      const obj = await this._getUser(valid_targetuserid, isOWN); // result will be different (reduced) for isOWN = false

      global.log("DBUsers:: getUser:: obj:: ", obj)
	    return ( { err: null, res: obj, } );
    } catch(error) {
	  	const hashcode = createErrorHash(error);
	  	global.log("DBUsers:: getUser:: ERROR:: ", hashcode, error);
	    return ( { err: `get user failed (${hashcode})`, res: null, } );
    }
	}


	/*
	// only OWN allowed!
	static async updateUser(targetuserid, userid, servertoken, obj) { 
    try {
			const valid_targetuserid= JoiValidateFallback(targetuserid, null, Joi.string().min(30).max(50).alphanum().normalize().required(),); 
			const valid_userid      = JoiValidateFallback(userid      , null, Joi.string().min(30).max(50).alphanum().normalize().required(),); 
	    const valid_servertoken = JoiValidateFallback(servertoken , null, Joi.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/).min(30).max(499).normalize().required(),); 
			if (!valid_targetuserid || !valid_userid || !valid_servertoken) throw new Error("invalid input");

      const isOWN = (valid_userid === valid_targetuserid); // check if OWN-stuff is requestd -> more info is returned
			if (!isOWN) throw new Error("invalid user");

      const thisUser = await this._getUser(valid_targetuserid, isOWN); // result will be different (reduced) for isOWN = false
			if (!thisUser) throw new Error("user not found");


      if (obj.hasOwnProperty("forcenew")) thisUser.forcenew = JoiValidateFallback(servertoken, "", Joi.string().trim().min(1).max(99),);


	    const numReplace = await this.updateFull( {userid: valid_targetuserid}, thisUser);
	    if (numReplace !== 1) throw "invalid update count";

      global.log("DBUsers:: updateUser:: user:: ", thisUser)
	    return ( { err: null, res: thisUser, } );
    } catch(error) {
	  	const hashcode = createErrorHash(error);
	  	global.log("DBUsers:: updateUser:: ERROR:: ", hashcode, error);
	    return ( { err: `updating user failed (${hashcode})`, res: null, } );
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
