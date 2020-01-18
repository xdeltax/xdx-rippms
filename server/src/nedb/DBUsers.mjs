import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);

import fse from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

import Datastore from 'nedb-promises';
//import mongo from 'mongodb';

import Joi from '@hapi/joi';

import {abs_path, } from "../basepath.mjs";
import {unixtime,} from "../tools/datetime.mjs";
import {isERROR, isSUCCESS, } from "../tools/isErrorIsSuccess.mjs";
import * as jwt from '../tools/jwt.mjs';
import joiValidateFallback from '../tools/joiValidateFallback.mjs';

import {joi_databaseid, joi_userid, joi_servertoken,
        joi_memberstatus, joi_accountstatus, joi_createdAt, joi_updatedAt,
        joi_uid, joi_fingerprint, joi_provider, joi_providerid, joi_providertoken, joi_forcenew,
        joi_name, joi_email, joi_phonenumber,
       } from "./joiValidators.mjs";

const accountstatusREADONLY = ["default", "owner", "admin", "moderator", "reviewer", "hidden", "locked", "blocked", "banned", "removed", "disbanded" ];
const memberstatusREADONLY  = ["default", "vip", "vip+", "idle", ];


const joi_schemaObject = Joi.object().keys({
  _id: 					joi_databaseid.optional(),

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


export default class DBUsers {
  client = null;
  db = null;
  collection = null;

  constructor(...props) {
    this.client = null;
    this.db = null;
    this.collection = null;
  }

  static isMongoDB() { return process.env.DATABASE_TYPE === "mongodb"; }
  static databaseURL() { return this.isMongoDB() ? process.env.DATABASE_MOBGO_URL : process.env.DATABASE_NEDB_URL || ""; }
  static databaseName() { return this.isMongoDB() ? process.env.DATABASE_MONGO_DATABASENAME : process.env.DATABASE_NEDB_DATABASENAME || ""; }
  static collectionName() { return 'users'; }

  static async connect() { // static method (not affected by instance) -> called with classname: DBGeoData.load
    if (this.isMongoDB()) { // use mongodb //var url = 'mongodb://localhost:27017/test';
      // mongodb://[username:password@]host1[:port1][,...hostN[:portN]][/[database][?options]]
      const mongodbURL = path.join(this.databaseURL(), this.databaseName());
      const MongoClient = mongo.MongoClient;
      this.client = await MongoClient.connect(mongodbURL, { useNewUrlParser: true }).catch(err => {
        clog("mongodb:: connect:: ERROR:: ", err);
        this.client = null;
      });
      if (!this.client) { this.db = null; return false; }

      try {
        this.db = client.db(this.databaseName());
        this.collection = await db.collection(this.collectionName());
        await this.collection.createIndex({ fieldName: 'userid',  unique: true, }); // index for quick searching the userid
        return true;
      } catch (err) {
        clog("mongodb:: ERROR:: ", res);
        this.close();
        return false;
      }

    } else { // use nedb
      const nedbDatabasePath = this.databaseURL() ? abs_path(path.join("..", this.databaseURL(), this.databaseName())) : null;
      if (!nedbDatabasePath) { this.collection = null; return false; }
	    fse.ensureDirSync(nedbDatabasePath, { mode: 0o0600, });

      this.client = nedbDatabasePath;
      this.db = path.join(nedbDatabasePath, this.collectionName() + ".txt");
      this.collection = Datastore.create(this.db); // datastore == collection
	    this.collection.persistence.setAutocompactionInterval(5);
      await this.collection.ensureIndex({ fieldName: 'userid',  unique: true, }); // index for quick searching the userid

      clog("XXXXXXXXXXXX", this.isMongoDB(), this.client, this.db);

      return true;
    }
  }; // of load

  static close() {
    if (this.client) this.client.close();
    this.client = null;
    this.db = null;
    this.collection = null;
  }


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
    try {
      const dbResultFull = await this.findOne({ "userid": valid_userid, },); // not found -> null
      // if isOwn -> return full database entry; if !isOwn -> return limited dataset only
      if (dbResultFull && dbResultFull.hasOwnProperty("userid"))
      return (isOWN) ? dbResultFull : dbResultLimited(dbResultFull);
    } catch (error) { // fail silent
      //clog("DBUser:: _getINTERNAL:: ERROR:: ", error)
      return null;
    }
  }


	static async loginWithProvider(unsafe_provider, unsafe_providerid, unsafe_providertoken, unsafe_uid, unsafe_fingerprinthash) { // create or update database
    const now = unixtime();
		try {
		  // ===============================================
		  // normalize input
		  // ===============================================
	    const valid_provider = joiValidateFallback(unsafe_provider, null, joi_provider);
			if (!valid_provider || (valid_provider !== "facebook" && valid_provider !== "google")) throw isERROR(1, "DBUsers: loginWithProvider", "login failed", "invalid provider");

			// user-id
			// facebook: '578539382222863', (15)
			// google: '115290744429011912108', (21)
	    const valid_providerid = joiValidateFallback(unsafe_providerid, null, joi_providerid);
			if (!valid_providerid) throw isERROR(2, "DBUsers: loginWithProvider", "login failed", "invalid provider-id");

			// accesstoken
			// facebook: 'EAAFSPeTSCKkBAJ6M6eGAJViYu1UwuKF9eumKV1cr2hMrEEehOayxGSgQhQmUBLZBsz3rc8ZAy4aurHOKUHZBqYt6XZCCZAedzXA6Mo9aJGCGZBAyApXLoReCDtzXOHWAAlUyflQ5ZCcwhW4lHN7z5M88QrICD7UeZBKup3a94gj8dAZDZD',
			// google: 'ya29.ImC2B0PovckRp-dr-k9SjTCBHSfwcxNEamphbOgVx0Z4POrqEo7IfnT7YCF6hTGwzZJnWKNAzEwjV29QmPwfIqtjUlkdgqnnfLBxDa8A-xrvKlC5Z9NXXk0LVq2GpjCL1lk',
	    const valid_providertoken = joiValidateFallback(unsafe_providertoken, null, joi_providertoken);
			if (!valid_providertoken) throw isERROR(3, "DBUsers: loginWithProvider", "login failed", "invalid provider-token");

	  	// fingerprint of client-device:: '47a95917591229e99a2417d27fbc32147' (32, alphanum:: a-z, A-Z, and 0-9)
	    const valid_fingerprinthash = joiValidateFallback(unsafe_fingerprinthash, "", joi_fingerprint);

			// fake-username(-extension) for debugging:: 'fakeusername1',
	    const valid_uid = joiValidateFallback(unsafe_uid, "", joi_uid, /*options*/null, /*dontLogError*/true);

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
	    const valid_object = joiValidateFallback(thisObject, null, joi_schemaObject);
	    if (!valid_object) throw isERROR(4, "DBUsers: loginWithProvider", "login failed", "invalid schema");

		  // ===============================================
	    // update user in database
		  // ===============================================
	    const numReplace = await this.updateFull( {userid: valid_object.userid}, valid_object);
	    if (numReplace !== 1) throw isERROR(5, "DBUsers: loginWithProvider", "login failed", "invalid update count");

		  // ===============================================
	    // get user from database (own -> true)
		  // ===============================================
      const loadedObject = await this._getINTERNAL(valid_object.userid, true); // result will be different (reduced) for isOWN = false

	  	return isSUCCESS(loadedObject);
	  } catch (error) {
	  	return isERROR(99, "DBUsers: loginWithProvider", "login failed", error);
	  }
	}


	static async getUser(unsafe_targetuserid, unsafe_userid, unsafe_servertoken) {
    try {
			const valid_targetuserid= joiValidateFallback(unsafe_targetuserid, null, joi_userid);
			const valid_userid      = joiValidateFallback(unsafe_userid      , null, joi_userid);
	    const valid_servertoken = joiValidateFallback(unsafe_servertoken , null, joi_servertoken);
			if (!valid_targetuserid || !valid_userid || !valid_servertoken) throw isERROR(1, "DBUsers: getUser", "user query failed", "invalid id or token");

      const isOWN = (valid_userid === valid_targetuserid); // check if OWN-stuff is requestd -> more info is returned

      const thisObject = await this._getINTERNAL(valid_targetuserid, isOWN); // result will be different (reduced) for isOWN = false

	  	return isSUCCESS(thisObject);
	  } catch (error) {
	  	return isERROR(99, "DBUsers: getUser", "user query failed", error);
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
    const now = unixtime();
    try {
			const valid_targetuserid= joiValidateFallback(unsafe_targetuserid, null, joi_userid);
			const valid_userid      = joiValidateFallback(unsafe_userid      , null, joi_userid);
	    const valid_servertoken = joiValidateFallback(unsafe_servertoken , null, joi_servertoken);
			if (!valid_targetuserid || !valid_userid || !valid_servertoken) throw isERROR(1, "DBUsers: updateProps", "update user failed", "invalid id or token");

      const isOWN = (valid_userid === valid_targetuserid); // check if OWN-stuff is requestd -> more info is returned
			if (!isOWN) throw isERROR(2, "DBUsers: updateProps", "update user failed", "invalid user",);

		  // ===============================================
	    // load userobject from database
		  // ===============================================
      let thisObject = await this._getINTERNAL(valid_targetuserid, isOWN); // result will be different (reduced) for isOWN = false
			if (!thisObject) throw isERROR(3, "DBUsers: updateProps", "update user failed", "user not found",);

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
		  const _validateProperty = (_unsafe_obj, _prop, _joi_validate) => (_unsafe_obj.hasOwnProperty(_prop)) ? joiValidateFallback(_unsafe_obj[_prop], null, _joi_validate) : null;
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
		  if (c <= 0) throw ERROR(4, "DBUsers: updateProps", "update user failed", "nothing to update");

	    thisObject.updatedAt = now;

		  // ===============================================
	    // validate data-object
		  // ===============================================
	    const valid_object = joiValidateFallback(thisObject, null, joi_schemaObject);
	    if (!valid_object) throw isERROR(5, "DBUsers: updateProps", "update user failed", "invalid user-object");

		  // ===============================================
	    // save userobject to database
		  // ===============================================
	    const numReplace = await this.updateFull( {userid: valid_targetuserid}, valid_object);
	    if (numReplace !== 1) throw isERROR(6, "DBUsers: updateProps", "update user failed", "invalid update count");

	  	return isSUCCESS(valid_object);
	  } catch (error) {
	  	return isERROR(99, "DBUsers: updateProps", "update user failed", error);
	  }
	}


  //////////
  // database
  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  static async count(query)                           { return await this.collection.count(query) }
  static async countAll()                             { return await this.count( {} ) }

  static async find(query, projection)                { return await this.collection.find(query, projection || {} ) }   // return cursor
  static async findOne(query, options)                { return await this.collection.findOne(query, options) }          // return element
  static async findAll()                              { return await this.find( {} , {} ) }

  // https://github.com/louischatriot/nedb/wiki/Updating-documents
  // update:: A new document will replace the matched docs
  // options:: multi (defaults to false) which allows the modification of several documents if set to true
  //        :: upsert (defaults to false) if you want to insert a new document corresponding to the update rules if your query doesnt match anything
  static async updateFull(query, obj)                 { return await this.collection.update(query, obj, { upsert: true }) }  // numreplaced

  // modifiers: The modifiers create the fields they need to modify if they don't exist, and you can apply them to subdocs. Available field modifiers are $set to change a field's value and $inc to increment a field's value. To work on arrays, you have $push, $pop, $addToSet, and the special $each. See examples below for the syntax.
  static async updateMod(query, modifiers )           { return await this.collection.update(query, modifiers, { upsert: true }) } // numreplaced

  static async insertNew(obj)                         { return await this.collection.insert(obj) }                 // return element with its new _id

  static async deleteMany(query)                      { return await this.collection.remove(query, { multi: true } ) }  // return how many where deleted
  static async deleteOne(query)                       { return await this.collection.remove(query, {} ) }               // return how many where deleted
}
