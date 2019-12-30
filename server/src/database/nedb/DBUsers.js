"use strict";
const fse = require('fs-extra');
const Datastore = require('nedb-promises');

const Joi = require('@hapi/joi');
const JoiValidateFallback = requireX('tools/joivalidatefallback');

const crypto = require('crypto');
const jwt = requireX('tools/auth/jwt');

const { SUCCESS, ERROR } = requireX('tools/errorhandler');


const accountstatusREADONLY = ["default", "owner", "admin", "moderator", "reviewer", "hidden", "locked", "blocked", "banned", "removed", "disbanded" ];
const memberstatusREADONLY  = ["default", "vip", "vip+", "idle", ];


const joi_userid = 			Joi.string().alphanum().min(30).max(50).normalize();
const joi_servertoken =	Joi.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/).min(30).max(499).normalize();

const joi_memberstatus =Joi.array().items( Joi.number().integer().min(0).max(99).optional() );
const joi_accountstatus=Joi.array().items( Joi.number().integer().min(0).max(99).optional() );
const joi_createdAt = 	Joi.date();
const joi_updatedAt = 	Joi.date();

// private
const joi_uid = 				Joi.string().allow('').min(0).max(99).alphanum().normalize();
const joi_fingerprint = Joi.string().min(10).max(40).alphanum().normalize();
const joi_provider =    Joi.string().trim().min(1).max(50).alphanum().normalize();
const joi_providerid =  Joi.string().trim().min(1).max(50).alphanum().normalize();
const joi_providertoken=Joi.string().min(30).max(499).normalize();
const joi_forcenew = 		Joi.string().trim().min(1).max(99);

const joi_name = 				Joi.string().alphanum().allow("").max(50).normalize();
const joi_email = 			Joi.string().max(256).email().allow("").allow(null).normalize().default("");
const joi_phonenumber = Joi.string().max(64).allow("").allow(null).normalize().default("");

const joi_schemaObject = Joi.object().keys({
  //_id

  // public (store.user)
  userid: 			joi_userid.required(),
  servertoken: 	joi_servertoken.required(),

  accountstatus:joi_accountstatus,
  memberstatus :joi_memberstatus,
  createdAt: 		joi_createdAt,
  updatedAt: 		joi_updatedAt,

  // private
  uid: 					joi_uid,
 	fphash: 			joi_fingerprint,
	provider:    	joi_provider,
  facebookid:   joi_providerid,
  googleid:    	joi_providerid,
	providertoken:joi_providertoken,
  forcenew: 		joi_forcenew,

  // modifiable
  name: 				joi_name,
  email: 				joi_email,
  phonenumber:  joi_phonenumber,
});


module.exports = class DBUsers {
  static collectionName() { return 'users'; }

  static databasePath()   { return global.abs_path("../" + process.env.DATABASE_NEDB); }


  static async _getINTERNAL(valid_userid, isOWN) {
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
        name,
      } = item;
      // modify object
      //fname = (viewgroup==="all") ? fname : fblur;
      return { // set to new object
        userid,
        accountstatus,
        memberstatus,
        updatedAt,
        createdAt,
        name,
      }
    };

    let res;
    try {
      const dbResultFull = await this.findOne( { "userid": valid_userid, }, ); // not found -> null

      // if isOwn -> return full database entry; if !isOwn -> return limited dataset only
      if (dbResultFull && dbResultFull.hasOwnProperty("userid")) 
      res = (isOWN) ? dbResultFull : dbResultLimited(dbResultFull);
    } catch (error) { // fail silent
      //global.log("DBUser:: _getINTERNAL:: ERROR:: ", error)
      res = null;
    } finally {
      return res;
    }
  }



  static async loadDatabase() { // static method (not affected by instance) -> called with classname: DBGeoData.load
    try {
			fse.ensureDir(this.databasePath(), { mode: 0o0700, });
      this.db = Datastore.create(this.databasePath() + this.collectionName() + ".db");

      await this.db.ensureIndex({ fieldName: 'userid', }); // index for quick searching the userid

      return this.db;
    } catch (error) { 
    	throw new Error(this.collectionName() + error); 
    }
  }; // of load


	static async loginWithProvider(unsafe_provider, unsafe_providerid, unsafe_providertoken, unsafe_uid, unsafe_fingerprinthash) { // create or update database
    const now = new Date() / 1000;
		try {
		  // ===============================================
		  // normalize input
		  // ===============================================
	    const valid_provider = JoiValidateFallback(unsafe_provider, null, joi_provider);
			if (!valid_provider || (valid_provider !== "facebook" && valid_provider !== "google")) throw ERROR(1, "login failed", "invalid provider");

			// user-id
			// facebook: '578539389742863', (15)
			// google: '115290746329011912108', (21)
	    const valid_providerid = JoiValidateFallback(unsafe_providerid, null, joi_providerid);
			if (!valid_providerid) throw ERROR(2, "login failed", "invalid provider-id");

			// accesstoken
			// facebook: 'EAAFSPeTSCKkBAJ6M6eGAJViYu1UwuKF9eumKV1cr2hMrEEehOayxGSgQhQmUBLZBsz3rc8ZAy4aurHOKUHZBqYt6XZCCZAedzXA6Mo9aJGCGZBAyApXLoReCDtzXOHWAAlUyflQ5ZCcwhW4lHN7z5M88QrICD7UeZBKup3a94gj8dAZDZD',
			// google: 'ya29.ImC2B0PovckRp-dr-k9SjTCBHSfwcxNEamphbOgVx0Z4POrqEo7IfnT7YCF6hTGwzZJnWKNAzEwjV29QmPwfIqtjUlkdgqnnfLBxDa8A-xrvKlC5Z9NXXk0LVq2GpjCL1lk',
	    const valid_providertoken = JoiValidateFallback(unsafe_providertoken, null, joi_providertoken);
			if (!valid_providertoken) throw ERROR(3, "login failed", "invalid provider-token");

	  	// fingerprint of client-device:: '47a95917591229e99a2417d27fbc32147' (32, alphanum:: a-z, A-Z, and 0-9)
	    const valid_fingerprinthash = JoiValidateFallback(unsafe_fingerprinthash, "", joi_fingerprint); 

			// fake-username(-extension) for debugging:: 'fakeusername1',
	    const valid_uid = JoiValidateFallback(unsafe_uid, "", joi_uid);

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
	    //let thisUser = await this.findOne( { "userid": userid_created, }, ); // not found -> null
      let thisObject = await this._getINTERNAL(userid_created, true); // result will be different (reduced) for isOWN = false

	    const isNewObject = Boolean(!thisObject);

		  // ===============================================
		  // create user-object (if user not in db)
		  // ===============================================
	    // create new user-account in server-database if user not found
	    if (isNewObject) {
	      thisObject = {
	        //_id: (unique hash) generated by database

	        userid: userid_created, // hash of facebook-id
	        //servertoken: "", // will be generated later

	        uid: valid_uid,
	        fphash: valid_fingerprinthash,

	    		provider: valid_provider,
	        //facebookid: valid_providerid,
	        //googleid: valid_providerid,
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
	    switch (valid_provider) {
	    	case "facebook": 	
	    		thisObject.facebookid = valid_providerid; 
	    		break;
	    	case "google": 		
	    		thisObject.googleid = valid_providerid; 
	    		break;
	    	default: 
	    		break;
			}

		  // ===============================================
		  // create new servertoken
		  // ===============================================
	    const hash = crypto.createHash('sha1').update(JSON.stringify(thisObject.forcenew + thisObject.providertoken)).digest('hex');
	    const jwtservertoken = jwt.sign(thisObject.userid, thisObject.provider, valid_providerid, hash); // (payload)

		  // ===============================================
	    // update userdata with new servertoken
		  // ===============================================
	    thisObject.servertoken = jwtservertoken;
	    thisObject.updatedAt = now; 

		  // ===============================================
	    // check userdata
		  // ===============================================
	    const valid_object = JoiValidateFallback(thisObject, null, joi_schemaObject);
	    if (!valid_object) throw ERROR(4, "login failed", "invalid user-object");

		  // ===============================================
	    // update user in database
		  // ===============================================
	    const numReplace = await this.updateFull( {userid: valid_object.userid}, valid_object);
	    if (numReplace !== 1) throw ERROR(5, "login failed", "invalid update count");

		  // ===============================================
	    // get user from database (own -> true)
		  // ===============================================
      const loadedObject = await this._getINTERNAL(valid_object.userid, true); // result will be different (reduced) for isOWN = false

	  	return SUCCESS(loadedObject);
	  } catch (error) {
	  	return ERROR(99, "login failed", error);
	  }
	}


	static async getUser(unsafe_targetuserid, unsafe_userid, unsafe_servertoken) { 
    try {
			const valid_targetuserid= JoiValidateFallback(unsafe_targetuserid, null, joi_userid); 
			const valid_userid      = JoiValidateFallback(unsafe_userid      , null, joi_userid);
	    const valid_servertoken = JoiValidateFallback(unsafe_servertoken , null, joi_servertoken);
			if (!valid_targetuserid || !valid_userid || !valid_servertoken) throw ERROR(1, "user query failed", "invalid id or token");

      const isOWN = (valid_userid === valid_targetuserid); // check if OWN-stuff is requestd -> more info is returned

      const thisObject = await this._getINTERNAL(valid_targetuserid, isOWN); // result will be different (reduced) for isOWN = false

	  	return SUCCESS(thisObject);
	  } catch (error) {
	  	return ERROR(99, "user query failed", error);
	  }
	}


	// only OWN allowed!
	static async updateProps(unsafe_targetuserid, unsafe_userid, unsafe_servertoken, unsafe_props) { 
		/* allowed props:
			 	unsave_obj: { 
					forcenew,
					name,
					email,
					phonenumber,
				}
		*/
    const now = new Date() / 1000;
    try {
			const valid_targetuserid= JoiValidateFallback(unsafe_targetuserid, null, joi_userid); 
			const valid_userid      = JoiValidateFallback(unsafe_userid      , null, joi_userid);
	    const valid_servertoken = JoiValidateFallback(unsafe_servertoken , null, joi_servertoken);
			if (!valid_targetuserid || !valid_userid || !valid_servertoken) throw ERROR(1, "update user failed", "invalid id or token");

      const isOWN = (valid_userid === valid_targetuserid); // check if OWN-stuff is requestd -> more info is returned
			if (!isOWN) throw ERROR(2, "update user failed", "invalid user",);

		  // ===============================================
	    // load userobject from database
		  // ===============================================
      let thisObject = await this._getINTERNAL(valid_targetuserid, isOWN); // result will be different (reduced) for isOWN = false
			if (!thisObject) throw ERROR(2, "update user failed", "user not found",);

			/*
	    const isNewObject = Boolean(!thisObject);

		  // ===============================================
	    // create object if not found in database
		  // ===============================================
	    if (isNewObject) {
	    	thisObject = {
	        //_id: (unique hash) generated by database

	        userid: userid_created, // hash of facebook-id

	        createdAt: now,
	        //updatedAt: Date.now() / 1000,
	    	}
	    }
			*/
		  // ===============================================
	    // manipulate props in object
		  // ===============================================
		  const _validateProperty = (_unsafe_obj, _prop, _joi_validate) => (_unsafe_obj.hasOwnProperty(_prop)) ? JoiValidateFallback(_unsafe_obj[_prop], null, _joi_validate) : null;
		  /*
		  const { 
		  	forcenew: unsafe_forcenew,
		  	name: unsafe_name,
		  	email: unsafe_email,
		  	phonenumber: unsafe_phonenumber,
		  } = unsafe_props || {};

		  const valid_email = 
		  */
		  let v;
		  let c = 0;
		  v = _validateProperty(unsafe_props, "name", joi_name); if (v !== null) { c++; thisObject.name = v; }
		  v = _validateProperty(unsafe_props, "email", joi_email); if (v !== null) { c++; thisObject.email = v; }
		  v = _validateProperty(unsafe_props, "phonenumber", joi_phonenumber); if (v !== null) { c++; thisObject.phonenumber = v; }
		  if (c <= 0) throw ERROR(3, "update user failed", "nothing to update");

	    thisObject.updatedAt = now; 

		  // ===============================================
	    // validate data-object
		  // ===============================================
	    const valid_object = JoiValidateFallback(thisObject, null, joi_schemaObject);
	    if (!valid_object) throw ERROR(4, "update user failed", "invalid user-object");

		  // ===============================================
	    // save userobject to database
		  // ===============================================
	    const numReplace = await this.updateFull( {userid: valid_targetuserid}, valid_object);
	    if (numReplace !== 1) throw ERROR(5, "update user failed", "invalid update count");

	  	return SUCCESS(valid_object);
	  } catch (error) {
	  	return ERROR(99, "update user failed", error);
	  }
	}


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
