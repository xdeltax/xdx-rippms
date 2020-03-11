import {decorate, /*computed, action, autorun, */ runInAction, observable, toJS, } from 'mobx';
import deepCopy from 'tools/deepCopyObject';
//import deepMerge from 'tools/deepMergeObject';

const rxdbSchema = {
  version: 0,
  title: "rxdb user schema",
  description: "blablabla",
  type: "object",
  keyCompression: false,
  properties: {
    _id:      { type: "string", primary: true }, // primary: unique, indexed, required (only string, number, integer)
    int:      { type: "integer", default: 20, min: 0, max: 90, },
    num:      { type: "number", index: true, },
    str:      { type: "string", },
    secret:   { type: "string", encrypted: true, },
    updatedAt:{ type: "number", },
    createdAt:{ type: "number", final: true },
  },
  required: ["updatedAt", ], // required for every document
  //attachments: { "encrypted": false }, // allow attachments (binaries); optional: encrypt with password
};

class RxdbCollectionMobxPrototype {
  get collectionName(){ return this._collectionName; }

  constructor(database, collectionName, rxdbSchema, mobxSchema, migrationStrategies) {
    this._unsavedChanges = false;

    this._db = database || null;
    this._collectionName = collectionName || null;
    this._rxdbSchema = rxdbSchema || { };
    this._mobxSchema = mobxSchema || { };
    this._migrationStrategies = migrationStrategies || null;
    this._collection = null;

    // init mobx-observable with zeroes
    //runInAction(() => { this._mobx = deepCopy(mobxSchema) || { }; });
    this.syncRxdbToMobx();

    return this; // return collection
  }

  async initCollection(isReactive) {
    await this.createCollection(this._rxdbSchema, this._migrationStrategies);

    if (await this.count() < 1) await this.createupdateDocument(this.mobx2json, true); // if database is empty -> create database-document from mobx

    if (isReactive) await this.subscribeToCollection(); // make collection changes reactive -> send to mobx on collection-data-change
    //await this.subscribeToProperties("updatedAt");
  }

  // ===============================================
  // mobx-observable-operations (READ-Operations)
  // ===============================================
  get mobx()      { return this._mobx; }  // mobx readonly -> all write operations only to database
  get mobx2json() { return toJS(this._mobx); }  // mobx readonly -> all write operations only to database
	//set mobx(v) { runInAction(() => { this._mobx = v; }) }

  get getProp()   { return this._mobx || {}; }  // same as this.mobx but with failsafe!  this.getProp.unknownprop will not fail

  getAll = () => toJS(this._mobx);

  // ===============================================
  // rxdb-collection-operations (WRITE-Operations)
  // ===============================================
  get db() { return this._db; }
  //set db(v){ this._db = v; }

  get collection() { return this._collection }
  //set collection(v){ this._collection = v}

  createupdateDocument = async (doc, ignore) => {
    await this.collection.upsert(doc); // create or replace database-document
    if (!ignore) this._unsavedChanges = true;
  }

  async setProp(prop, value) { // const x = await rxdbStore.user.setProp("card.test", 111 ); -> set _mobx: { card: {test:111} }
    //global.log("XXXXX", prop, val, this.getProp.prop, this.getProp.updatedAt)
    //optimistic fast-sync:: runInAction(() => { this._mobx[prop] = val; });
    this.collection.findOne().exec().then(tempdoc => {
      tempdoc.atomicSet(prop, value).then(result => {
        if (result) runInAction(() => { this._mobx = result.toJSON(); }); // pre-sync to be fast (dont wait for subscribeToCollection-sync)
        global.log("setProp to mobx:: ", result.toJSON())
      })
      this._unsavedChanges = true;
    });
  }

  // ===============================================
  // rxjs / mobx sync-operations
  // ===============================================

  syncMobxToRxdb = async () => {
    await this.createupdateDocument(this.mobx2json, true);
  };

  syncRxdbToMobx = async () => {
    const doc = (!this.collection) ? null : await this.collection.findOne().exec();
    runInAction(() => { this._mobx = (doc) ? doc.toJSON() : deepCopy(this._mobxSchema) || { }; });
  };

  // ===============================================
  // rxjs-observable-operations
  // ===============================================
  async subscribeToCollection() { // sync any changes of the local rxbd-database to mobx
    // find the document (its by design always only one)
    const doc = this.collection.findOne();
    // subscribe to all changes of the rxdb-document
    doc.$.subscribe(newdoc => { newdoc && runInAction(() => {
      // convert rxrdDocument to plain json-object and copy to mobx-observable
      this._mobx = newdoc.toJSON(); // deepCopy(newdoc.toJSON());
      global.log("subscribeToCollection", newdoc.toJSON(), this.mobx2json)
    });});
  }

  /*
  async subscribeToProperties(prop) {
    const doc = await this.collection.findOne().exec();
    doc.get$(prop).subscribe(newprop => { runInAction(() => {
      this._mobx[prop] = newprop;
    })});
  }
  */

  // ===============================================
  // rxjs-collection-operations
  // ===============================================
  async syncCollectionWithServer(syncURL, dbName) {
    this._collection.sync({ remote: syncURL + dbName + '/' });
  }

  async createCollection(schema, migrationStrategies) {
    this._collection = await this.db.collection({
      name: this.collectionName,
      schema: schema,
      pouchSettings: {}, // (optional)
      statics: {}, // (optional) // ORM-functions for this collection
      methods: {}, // (optional) ORM-functions for documents
      attachments: {}, // (optional) ORM-functions for attachments
      options: {}, // (optional) Custom paramters that might be used in plugins
      migrationStrategies: migrationStrategies || {}, // (optional)
      autoMigrate: true, // (optional)
    });
    //console.dir(this.collection);

    // enable replication
    //this.collection.sync({ remote: syncURL + dbName + '/' });

    return true;
  }

  removeAllDocuments = async () => {
    if (!this.collection) return null;
    const query = this.collection.find();
    const removedDocs = await query.remove();
    await this.syncRxdbToMobx();
    return (Array.isArray(removedDocs)) ? removedDocs.length : 0;
  }


  // ===============================================
  // collection-api
  // ===============================================

  async getCollectionByName(collectionName) {
    return this.db[collectionName || this.collectionName];
  }

  async removeCollection() {
    return (!this.collection) ? null : await this.collection.remove();
  }

  async collection2json() { // export collection to json
    return (!this.collection) ? null : await this.collection.dump(true);
  }

  async json2collection(json) {  // import json to collection
    if (this.collection) await this.collection.importDump(json);
  }

  async count() {
    return (!this.collection) ? 0 : (await this.collection.find().exec()).length;
  }

  async findAll(obj) {  // import json to collection
    return (!this.collection) ? null : await this.collection.find().exec(); // return array
  }

  async find(obj) {  // import json to collection
    return (!this.collection) ? null : await this.collection.find(obj).exec(); // return array
  }

  async findOne(obj) {  // import json to collection
    return (!this.collection) ? null : await this.collection.findOne(obj).exec(); // return object
  }

  /*
  // database adapter
  async count(query)                 { return (!this._collection) ? null : await this._collection.countDocuments(query) : await this.collection.count(query); }
  async countAll()                   { return await this.count( {} ) }

  async find(query, projection)      { return (!this._collection) ? null : await this._collection.find(query, projection || {} ) }   // return cursor
  async findOne(query, options)      { return (!this._collection) ? null : await this._collection.findOne(query, options) }          // return element
  async findAll()                    { return (!this._collection) ? null : await this._collection.find().exec(); }

  //async updateReplace(query, obj)    { return (!this._collection) ? null : await this._collection.update(query, obj, { upsert: true }) }  // numreplaced
  //async updateMod(query, modifiers)  { return (!this._collection) ? null : await this._collection.update(query, modifiers, { upsert: true }) } // numreplaced

  async insertNewOrReplace(obj)      { return (!this._collection) ? null : await this._collection.upsert(obj) }  // return element with its new _id

  async insertNew(obj)               { return (!this._collection) ? null : await this._collection.insert(obj) }  // return element with its new _id
  async insertNewBulk(arrayOfObj)    { return (!this._collection) ? null : await this._collection.bulkInsert(arrayOfObj) }

  //async deleteMany(query)            { return (!this._collection) ? null : await this._collection.remove(query, { multi: true } ) }  // return how many where deleted
  //async deleteOne(query)             { return (!this._collection) ? null : await this._collection.remove(query, {} ) }               // return how many where deleted
  */

  //async createIndex(_prop, _isUnique){ this.isMongoDB() ? await this._collection.createIndex({ _prop: 1, }, { unique: _isUnique, }) : await this.collection.ensureIndex({ fieldName: _prop,  unique: _isUnique }) }

  //////////////////////////////////////////////////////////////////////////////
}

decorate(RxdbCollectionMobxPrototype, {
  _mobx: observable,
});

export default RxdbCollectionMobxPrototype;


//https://rxdb.info/rx-schema.html#example
/*
const dbSchema = {
  keyCompression: true, // set this to true, to enable the keyCompression
  title: "hero schema",
  version: 0,
  description: "describes a simple hero",
  type: "object",
  properties: {
      name: { type: "string", primary: true }, // primary: unique, indexed, required
      color: { type: "string", index: true }, // create index for this field
      test: { type: "integer", default: 20}
      "healthpoints": {
          "type": "number",
          "min": 0,
          "max": 100
      },
      "secret": {
          "type": "string",
          "encrypted": true
      },
      "birthyear": {
          "type": "number",
          "final": true,
          "min": 1900,
          "max": 2050
      },
      "skills": {
          "type": "array",
          "maxItems": 5,
          "uniqueItems": true,
          "items": {
              "type": "object",
              "properties": {
                  "name": {
                      "type": "string"
                  },
                  "damage": {
                      "type": "number"
                  }
              }
          }
      }
  },

  required: ["color"], // required for every document
  attachments: { "encrypted": false } // allow attachments (binaries); optional: encrypt with password
};
*/



//const rxdbApp = new RXDBApp();
//export default rxdbApp;

/*
const attachment = await myDocument.putAttachment({
    id,     // string, name of the attachment like 'cat.jpg'
    data,   // (string|Blob|Buffer) data of the attachment
    type    // (string) type of the attachment-data like 'image/jpeg'
});

const attachment = myDocument.getAttachment('cat.jpg');

const attachment = myDocument.getAttachment('cat.jpg');
await attachment.remove();

const attachment = myDocument.getAttachment('cat.jpg');
const blobBuffer = await attachment.getData();

const attachment = await myDocument.getAttachment('cat.jpg');
const data = await attachment.getStringData();

*/
