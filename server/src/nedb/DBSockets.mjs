import fse from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

import Datastore from 'nedb-promises';
import Joi from '@hapi/joi';

import {abs_path, } from "../basepath.mjs";
import {clog, } from "../tools/consoleLog.mjs";
import {unixtime,} from "../tools/datetime.mjs";
import {isERROR, isSUCCESS, } from "../tools/isErrorIsSuccess.mjs";
import joiValidateFallback from '../tools/joiValidateFallback.mjs';


const joi_databaseid= Joi.string().alphanum().allow(null).allow("").max(200).normalize();

//const joi_socketid 	=	Joi.string().alphanum().allow("-").min(10).max(50).normalize();
const joi_socketid  =	Joi.string().regex(/^[A-Za-z0-9-_.+/=]*$/).min(10).max(50).normalize();
const joi_userid 		=	Joi.string().alphanum().min(30).max(50).normalize();

const joi_count 		=	Joi.number().min(0);

const joi_date = Joi.date();


const joi_schemaObject = Joi.object().keys({
  _id: 					joi_databaseid.optional(),

  socketid: 		joi_socketid.required(),
  userid: 			joi_userid.allow(null).optional(),

  //apicalls
  count: 				joi_count,
  countSince: 	joi_date,

  createdAt: 		joi_date,
  updatedAt: 		joi_date,
});


export default class DBSockets {
  db = null;

  constructor(...props) {
    clog("DBSockets:: constructor:: ", ...props);
    this.db = null;
  }

  static collectionName() { return 'sockets'; }

  static databasePath()   { return process.env.DATABASE_NEDB ? abs_path("../" + process.env.DATABASE_NEDB) : null; }

  static stop() { return ; }

  static async _getINTERNAL(valid_socketid, isOWN) {
    const dbResultLimited = (item) => { // keep or drop props
      // const dbGallery = array.map(( {propsToDrop1, propsToDrop2, ...keepAttrs}) => keepAttrs)
      // const dbGallery = array.map(( {propsToKeep1, propsToKeep2, } ) => ( {propsToKeep1, propsToKeep2, } ))
      // filter item
      let { // get from object
      	socketid,
        userid,
        count,
        countSince,
        updatedAt,
        createdAt,
      } = item;
      // modify object
      //fname = (viewgroup==="all") ? fname : fblur;
      return { // set to new object
      	socketid,
        userid,
        count,
        countSince,
        updatedAt,
        createdAt,
      }
    };
    try {
      const dbResultFull = await this.findOne({ "socketid": valid_socketid, },); // not found -> null
      // if isOwn -> return full database entry; if !isOwn -> return limited dataset only
      if (dbResultFull && dbResultFull.hasOwnProperty("socketid"))
      return (isOWN) ? dbResultFull : dbResultLimited(dbResultFull);
    } catch (error) { // fail silent
      //clog("DBSockets:: _getINTERNAL:: ERROR:: ", error)
      return null;
    }
  }


  static async loadDatabase() { // static method (not affected by instance) -> called with classname: DBGeoData.load
		fse.ensureDirSync(this.databasePath(), { mode: 0o0600, });
    this.db = Datastore.create(path.join(this.databasePath(), this.collectionName() + ".txt"));
		this.db.persistence.setAutocompactionInterval(5);

    await this.db.ensureIndex({ fieldName: 'socketid', unique: true, }); // index for quick searching the socketid
    await this.db.ensureIndex({ fieldName: 'userid', unique: false, }); // false because "null" is allowed
  }; // of load


	static async remove(unsafe_socketid) { // create or update database
    const now = unixtime();
		try {
		  // ===============================================
		  // normalize input
		  // ===============================================
	    const safe_socketid = joiValidateFallback(unsafe_socketid, null, joi_socketid);
			if (!safe_socketid) throw isERROR(1, "DBSockets: remove", "remove socket failed", "invalid socket id");

	    const numRemoved = await this.deleteOne({ socketid: safe_socketid });
			//if (!numRemoved !== 1) throw ERROR(2, "remove socket failed", "invalid count: " + numRemoved);

	  	return isSUCCESS(numRemoved);
	  } catch (error) {
	  	return isERROR(99, "DBSockets: remove", "remove socket failed", error);
	  }
	};


	static async createOrUpdate(unsafe_socketid, unsafe_userid, ) { // create or update database
    const now = unixtime();
		try {
		  // ===============================================
		  // normalize input
		  // ===============================================
	    const valid_socketid = joiValidateFallback(unsafe_socketid, null, joi_socketid);
			if (!valid_socketid) throw isERROR(1, "DBSockets: createOrUpdate", "update socket failed", "invalid socket id");

			const valid_userid = joiValidateFallback(unsafe_userid, null, joi_userid, /*options*/null, /*dontLogError*/true);

		  // ===============================================
		  // search db
		  // ===============================================
	    // check if user already exists (and get user data for login-count then)
	    //let thisUser = await this.findOne( { "userid": userid_created, }, ); // not found -> null
      let thisObject = await this._getINTERNAL(valid_socketid, /*isOwn:*/ true); // result will be different (reduced) for isOWN = false

	    const isNewObject = Boolean(!thisObject);

		  // ===============================================
		  // create user-object (if socket.id not in db)
		  // ===============================================
	    // create new user-account in server-database if user not found
	    if (isNewObject || !thisObject.hasOwnProperty("socketid")) {
	      thisObject = {
	        //_id: (unique hash) generated by database
	        socketid: valid_socketid,
	        //userid: safe_userid,

	        count: 0,
	        countSince: now,

	        createdAt: now,
	        //updatedAt: Date.now() / 1000,
	      };
	    }

		  // ===============================================
	    // update userdata with new servertoken
		  // ===============================================
	    thisObject.userid = valid_userid;
	    thisObject.updatedAt = now;

		  // ===============================================
	    // check userdata
		  // ===============================================
	    const valid_object = joiValidateFallback(thisObject, null, joi_schemaObject);
	    //clog("DBSockets:: createOrUpdate:: object:: ", valid_object.userid)
	    if (!valid_object) throw isERROR(2, "DBSockets: createOrUpdate", "update socket failed", "invalid schema");

		  // ===============================================
	    // update user in database
		  // ===============================================
	    const numReplace = await this.updateFull( {socketid: valid_object.socketid}, valid_object);
	    if (numReplace !== 1) throw isERROR(3, "DBSockets: createOrUpdate", "update socket failed", "invalid update count");

		  // ===============================================
	    // get user from database (own -> true)
		  // ===============================================
      const loadedObject = await this._getINTERNAL(valid_object.socketid, /*isOwn:*/ true); // result will be different (reduced) for isOWN = false

	  	return isSUCCESS(loadedObject);
	  } catch (error) {
	  	//clog("DBSockets:: ERROR:: ", unsafe_socketid, error)
	  	return isERROR(99, "DBSockets: createOrUpdate", "update socket failed", error);
	  }
	}


	static async updateCount(unsafe_socketid) {
    const now = unixtime();
		try {
		  // ===============================================
		  // normalize input
		  // ===============================================
	    const valid_socketid = joiValidateFallback(unsafe_socketid, null, joi_socketid);
			if (!valid_socketid) throw isERROR(1, "DBSockets: updateCount", "update api-count failed", "invalid socket id");

		  // ===============================================
		  // search db
		  // ===============================================
      let thisObject = await this._getINTERNAL(valid_socketid, /*isOwn:*/ true); // result will be different (reduced) for isOWN = false
	    if (!thisObject) throw isERROR(2, "DBSockets: updateCount", "update api-count failed", "socket id not found");

      thisObject.count++;

	    const numReplace = await this.updateFull( {socketid: thisObject.socketid}, thisObject);
	    if (numReplace !== 1) throw isERROR(3, "DBSockets: updateCount", "update api-count failed", "invalid update count");

	  	return isSUCCESS(thisObject.count);
	  } catch (error) {
	  	return isERROR(99, "DBSockets: updateCount", "update api-count failed", error);
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
