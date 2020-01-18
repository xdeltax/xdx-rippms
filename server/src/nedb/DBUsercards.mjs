import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);

import fse from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

import Datastore from 'nedb-promises';
import Joi from '@hapi/joi';

import {abs_path, } from "../basepath.mjs";
import {unixtime,} from "../tools/datetime.mjs";
import {isERROR, isSUCCESS, } from "../tools/isErrorIsSuccess.mjs";
import joiValidateFallback from '../tools/joiValidateFallback.mjs';

import {joi_databaseid, joi_userid, joi_servertoken,
        joi_createdAt, joi_updatedAt,
        joi_name, joi_email, joi_phonenumber,
       } from "./joiValidators.mjs";

const joi_schemaObject = Joi.object().keys({
  _id: 					joi_databaseid.optional(),

  // public (store.user)
  userid: 			joi_userid.required(),

  // modifiable
  name: 				joi_name,
  email: 				joi_email,
  phonenumber:  joi_phonenumber,

  createdAt: 		joi_createdAt,
  updatedAt: 		joi_updatedAt,
});


export default class DBUsercards {
  db = null;

  constructor(...props) {
    clog("DBUsercards:: constructor:: ", ...props);
    this.db = null;
  }

  static collectionName() { return 'usercards'; }

  static databasePath()   { return process.env.DATABASE_NEDB ? abs_path("../" + process.env.DATABASE_NEDB) : null; }

  static async connect(url) { // static method (not affected by instance) -> called with classname: DBGeoData.load
		fse.ensureDirSync(this.databasePath(), { mode: 0o0600, });
    this.db = Datastore.create(path.join(this.databasePath(), this.collectionName() + ".txt"));
		this.db.persistence.setAutocompactionInterval(5);

    await this.db.ensureIndex({ fieldName: 'userid',  unique: true, }); // index for quick searching the userid
  }; // of load

  static close() { return ; }

  static async _getINTERNAL(valid_userid, isOWN) {
    const dbResultLimited = (item) => { // keep or drop props
      // const dbGallery = array.map(( {propsToDrop1, propsToDrop2, ...keepAttrs}) => keepAttrs)
      // const dbGallery = array.map(( {propsToKeep1, propsToKeep2, } ) => ( {propsToKeep1, propsToKeep2, } ))
      // filter item
      let { // get from object
        userid,
        updatedAt,
        createdAt,
        name,
        email,
        phonenumber,
      } = item;
      // modify object
      //fname = (viewgroup==="all") ? fname : fblur;
      return { // set to new object
        userid,
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
      //clog("DBUsercards:: _getINTERNAL:: ERROR:: ", error)
      return null;
    }
  }


	static async getUsercard(unsafe_targetuserid, unsafe_userid, unsafe_servertoken) {
    try {
			const valid_targetuserid= joiValidateFallback(unsafe_targetuserid, null, joi_userid);
			const valid_userid      = joiValidateFallback(unsafe_userid      , null, joi_userid);
	    const valid_servertoken = joiValidateFallback(unsafe_servertoken , null, joi_servertoken);
			if (!valid_targetuserid || !valid_userid || !valid_servertoken) throw isERROR(1, "DBUsercards: getUsercard", "usercard query failed", "invalid id or token");

      const isOWN = (valid_userid === valid_targetuserid); // check if OWN-stuff is requestd -> more info is returned

      const thisObject = await this._getINTERNAL(valid_targetuserid, isOWN); // result will be different (reduced) for isOWN = false

	  	return isSUCCESS(thisObject);
	  } catch (error) {
	  	return isERROR(99, "DBUsercards: getUsercard", "usercard query failed", error);
	  }
	}


	// only OWN allowed!
	static async updateProps(unsafe_targetuserid, unsafe_userid, unsafe_servertoken, unsafe_props) {
    const now = unixtime();
    try {
			const valid_targetuserid= joiValidateFallback(unsafe_targetuserid, null, joi_userid);
			const valid_userid      = joiValidateFallback(unsafe_userid      , null, joi_userid);
	    const valid_servertoken = joiValidateFallback(unsafe_servertoken , null, joi_servertoken);
			if (!valid_targetuserid || !valid_userid || !valid_servertoken) throw isERROR(1, "DBUsercards: updateProps", "update usercard failed", "invalid id or token");

      const isOWN = (valid_userid === valid_targetuserid); // check if OWN-stuff is requestd -> more info is returned
			if (!isOWN) throw isERROR(2, "DBUsercards: updateProps", "update usercard failed", "invalid user",);

		  // ===============================================
	    // load userobject from database
		  // ===============================================
      let thisObject = await this._getINTERNAL(valid_targetuserid, isOWN); // result will be different (reduced) for isOWN = false

	    const isNewObject = Boolean(!thisObject);

		  // ===============================================
	    // create object if not found in database
		  // ===============================================
	    if (isNewObject) {
	    	thisObject = {
	        //_id: (unique hash) generated by database

	        userid: valid_targetuserid, // hash of facebook-id

	        createdAt: now,
	        //updatedAt: Date.now() / 1000,
	    	}
	    }

		  // ===============================================
	    // validate / manipulate props of object
		  // ===============================================
		  const _validateProperty = (_unsafe_obj, _prop, _joi_validate) => (_unsafe_obj.hasOwnProperty(_prop)) ? joiValidateFallback(_unsafe_obj[_prop], null, _joi_validate) : null;

		  let v;
		  let c = 0;
		  v = _validateProperty(unsafe_props, "name", joi_name); if (v !== null) { c++; thisObject.name = v; }
		  v = _validateProperty(unsafe_props, "email", joi_email); if (v !== null) { c++; thisObject.email = v; }
		  v = _validateProperty(unsafe_props, "phonenumber", joi_phonenumber); if (v !== null) { c++; thisObject.phonenumber = v; }
		  if (c <= 0) throw isERROR(3, "DBUsercards: updateProps", "update usercard failed", "nothing to update");

	    thisObject.updatedAt = now;

		  // ===============================================
	    // validate data-object
		  // ===============================================
	    const valid_object = joiValidateFallback(thisObject, null, joi_schemaObject);
	    if (!valid_object) throw isERROR(4, "DBUsercards: updateProps", "update usercard failed", "invalid schema");

		  // ===============================================
	    // save userobject to database
		  // ===============================================
	    const numReplace = await this.updateFull( {userid: valid_targetuserid}, valid_object);
	    if (numReplace !== 1) throw isERROR(5, "DBUsercards: updateProps", "update usercard failed", "invalid update count");

	  	return isSUCCESS(valid_object);
	  } catch (error) {
	  	return isERROR(99, "DBUsercards: updateProps", "update usercard failed", error);
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
