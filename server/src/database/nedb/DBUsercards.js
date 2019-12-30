"use strict";
const fse = require('fs-extra');
const Datastore = require('nedb-promises');

const Joi = require('@hapi/joi');
const JoiValidateFallback = requireX('tools/joivalidatefallback');

const { SUCCESS, ERROR } = requireX('tools/errorhandler');

const joi_userid = 			Joi.string().alphanum().min(30).max(50).normalize();
const joi_servertoken =	Joi.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/).min(30).max(499).normalize();

const joi_createdAt = 	Joi.date();
const joi_updatedAt = 	Joi.date();

const joi_name = 				Joi.string().alphanum().allow("").max(50).normalize();
const joi_email = 			Joi.string().max(256).email().allow("").allow(null).normalize().default("");
const joi_phonenumber = Joi.string().max(64).allow("").allow(null).normalize().default("");

const joi_schemaObject = Joi.object().keys({
  //_id

  // public (store.user)
  userid: 			joi_userid.required(),

  // modifiable
  name: 				joi_name,
  email: 				joi_email,
  phonenumber:  joi_phonenumber,
});


module.exports = class DBUsercards {
  static collectionName() { return 'usercards'; }
  
  static databasePath()   { return global.abs_path("../" + process.env.DATABASE_NEDB); }


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


	static async getUsercard(unsafe_targetuserid, unsafe_userid, unsafe_servertoken) { 
    try {
			const valid_targetuserid= JoiValidateFallback(unsafe_targetuserid, null, joi_userid); 
			const valid_userid      = JoiValidateFallback(unsafe_userid      , null, joi_userid);
	    const valid_servertoken = JoiValidateFallback(unsafe_servertoken , null, joi_servertoken);
			if (!valid_targetuserid || !valid_userid || !valid_servertoken) throw ERROR(1, "usercard query failed", "invalid id or token");

      const isOWN = (valid_userid === valid_targetuserid); // check if OWN-stuff is requestd -> more info is returned

      const thisObject = await this._getINTERNAL(valid_targetuserid, isOWN); // result will be different (reduced) for isOWN = false

	  	return SUCCESS(thisObject);
	  } catch (error) {
	  	return ERROR(99, "usercard query failed", error);
	  }
	}


	// only OWN allowed!
	static async updateProps(unsafe_targetuserid, unsafe_userid, unsafe_servertoken, unsafe_props) { 
    const now = new Date() / 1000;
    try {
			const valid_targetuserid= JoiValidateFallback(unsafe_targetuserid, null, joi_userid); 
			const valid_userid      = JoiValidateFallback(unsafe_userid      , null, joi_userid);
	    const valid_servertoken = JoiValidateFallback(unsafe_servertoken , null, joi_servertoken);
			if (!valid_targetuserid || !valid_userid || !valid_servertoken) throw ERROR(1, "update usercard failed", "invalid id or token");

      const isOWN = (valid_userid === valid_targetuserid); // check if OWN-stuff is requestd -> more info is returned
			if (!isOWN) throw ERROR(2, "update usercard failed", "invalid user",);

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
	    // manipulate props in object
		  // ===============================================
		  const _validateProperty = (_unsafe_obj, _prop, _joi_validate) => (_unsafe_obj.hasOwnProperty(_prop)) ? JoiValidateFallback(_unsafe_obj[_prop], null, _joi_validate) : null;

		  let v;
		  let c = 0;
		  v = _validateProperty(unsafe_props, "name", joi_name); if (v !== null) { c++; thisObject.name = v; }
		  v = _validateProperty(unsafe_props, "email", joi_email); if (v !== null) { c++; thisObject.email = v; }
		  v = _validateProperty(unsafe_props, "phonenumber", joi_phonenumber); if (v !== null) { c++; thisObject.phonenumber = v; }
		  if (c <= 0) throw ERROR(2, "update usercard failed", "nothing to update");

	    thisObject.updatedAt = now; 

		  // ===============================================
	    // validate data-object
		  // ===============================================
	    const valid_object = JoiValidateFallback(thisObject, null, joi_schemaObject);
	    if (!valid_object) throw ERROR(3, "update usercard failed", "invalid user-object");

		  // ===============================================
	    // save userobject to database
		  // ===============================================
	    const numReplace = await this.updateFull( {userid: valid_targetuserid}, valid_object);
	    if (numReplace !== 1) throw ERROR(4, "update usercard failed", "invalid update count");

	  	return SUCCESS(valid_object);
	  } catch (error) {
	  	return ERROR(99, "update usercard failed", error);
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
