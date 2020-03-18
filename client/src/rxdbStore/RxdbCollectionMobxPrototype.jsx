import {decorate, /*computed, action, autorun, */ runInAction, observable, toJS, } from 'mobx';
import socketio from 'api/socket'; // socket
import deepCopy from 'tools/deepCopyObject';
//import deepMerge from 'tools/deepMergeObject';

class RxdbCollectionMobxPrototype {
  get collectionName(){ return this._collectionName; }
  get isObserved() { return this._isObserved; }

  constructor(isObserved, database, collectionName, rxdbSchema, memorySchema, migrationStrategies) {
    this._unsavedChanges = false;

    this._isObserved = isObserved || true;
    this._db = database || null;
    this._collectionName = collectionName || null;
    this._rxdbSchema = rxdbSchema || { };
    this._memorySchema = memorySchema || { };
    this._migrationStrategies = migrationStrategies || null;
    this._collection = null;

    this._socket = socketio;

    this._serverIsMaster = false;

    // init mobx-observable with default-data from memorySchema
    this.syncRxdbToMemory(); //if (isObserved) { runInAction(() => { this._mobx = deepCopy(memorySchema) || { }; }); } else { this._data = deepCopy(memorySchema) || { }; }

    return this; // return collection
  }

  async initCollection(isReactive) {
    // 1) create or open collection
    await this.createCollection(this._rxdbSchema, this._migrationStrategies);
    // 2) if collection is empty -> create database-document from mobx-data
    if (await this.count() < 1) await this.createupdateDocument(this.memory2json, true); // if database is empty -> create database-document from mobx
    // 3) make collection reactive to changes in database --> if collection changes, update mobx/data-data
    if (isReactive) await this.subscribeToCollection(); // make collection changes reactive -> send to mobx on collection-data-change
    //await this.subscribeToProperties("updatedAt");
  }

  destroy() {
    this.unsubscribeFromCollection();
  }

  // ===============================================
  // mobx-observable-operations (READ-Operations)
  // ===============================================
  get mobx()      { return this._mobx; }  // mobx readonly -> all write operations only to database
  get mobx2json() { return toJS(this._mobx); }  // mobx readonly -> all write operations only to database
	//set mobx(v) { runInAction(() => { this._mobx = v; }) }

  get data()      { return this._data; }  // data readonly -> all write operations only to database
  get data2json() { return deepCopy(this._data) || { }; }  // data readonly -> all write operations only to database

  // same as this.getProp but without failsafe!  this.getProp.unknownprop will fail!!!
  get memory()      { return (this.isObserved) ? this._mobx : this._data; }  // data readonly -> all write operations only to database
  get memory2json() { return (this.isObserved) ? toJS(this._mobx) : deepCopy(this._data) || { }; }  // data readonly -> all write operations only to database

  // same as this.memory but with failsafe!  this.getProp.unknownprop will not fail
  get getProps()  { return this.getProp }
  get getProp()   { return this.memory || { }; }

  get getall() { return (this.isObserved) ? toJS(this._mobx) : this._data };
  getAll() { return this.getall };

  // ===============================================
  // rxdb-collection-operations (WRITE-Operations)
  // ===============================================
  get db() { return this._db; }
  //set db(v){ this._db = v; }

  get collection() { return this._collection }
  //set collection(v){ this._collection = v}

  get socket() { return this._socketio }

  async createupdateDocument(doc, ignore) {
    await this.collection.upsert(doc); // create or replace database-document
    if (!ignore) this._unsavedChanges = true;
  }

  async setProps(prop, value) { return await this.setProp(prop, value) }
  async setProp(prop, value) { // const x = await rxdbStore.user.setProp("card.test", 111 ); -> set _mobx: { card: {test:111} }
    //global.log("XXXXX", prop, value, this.getProp[prop], this.getProp.updatedAt)
    try {
      const tempdoc = await this.collection.findOne().exec();
      const resultdoc = await tempdoc.atomicSet(prop, value);
      if (resultdoc) {
        const resultDocJSON = resultdoc.toJSON();
        if (this.isObserved) {
          runInAction(() => { this._mobx = resultDocJSON; }); // pre-sync to be fast (dont wait for subscribeToCollection-sync)
        } else {
          this._data = resultDocJSON; // pre-sync to be fast (dont wait for subscribeToCollection-sync)
        };
        //global.log("setProp:: ", this._data)
        this._unsavedChanges = true;
        return resultDocJSON;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
    /*
    //optimistic fast-sync:: runInAction(() => { this._mobx[prop] = val; });
    this.collection.findOne().exec().then(tempdoc => {
      tempdoc.atomicSet(prop, value).then(result => {
        if (result) {
          if (this.isObserved) {
            runInAction(() => { this._mobx = result.toJSON(); }); // pre-sync to be fast (dont wait for subscribeToCollection-sync)
          } else {
            this._data = result.toJSON(); // pre-sync to be fast (dont wait for subscribeToCollection-sync)
          };
          //global.log("setProp:: ", this._data)
          this._unsavedChanges = true;
          return true;
        } else {
          return false;
        }
      });
    });
    */
  }


  // ===============================================
  // rxjs / mobx sync-operations
  // ===============================================
  syncMemoryToRxdb = async () => {
    await this.createupdateDocument(this.memory2json, true);
  };

  syncRxdbToMemory = async () => {
    const doc = (!this.collection) ? null : await this.collection.findOne().exec();
    if (this.isObserved) {
      runInAction(() => { this._mobx = (doc) ? doc.toJSON() : deepCopy(this._memorySchema) || { }; });
    } else {
      this._data = (doc) ? doc.toJSON() : deepCopy(this._memorySchema) || { };
    }
  };


  // ===============================================
  // rxjs-observable-operations
  // ===============================================
  unsubscribeFromCollection() { // sync any changes of the local rxbd-database to mobx
    if (this._sub) this._sub.unsubscribe();
  }

  async subscribeToCollection() { // sync any changes of the local rxbd-database to mobx
    // find the document (its by design always only one)
    const doc = this.collection.findOne();
    // subscribe to all changes of the rxdb-document
    this._sub = doc.$.subscribe(newdoc => {
      if (newdoc) {
        if (this.isObserved) {
          runInAction(() => {
            // convert rxrdDocument to plain json-object and copy to mobx-observable
            this._mobx = newdoc.toJSON(); // deepCopy(newdoc.toJSON());
            //global.log("subscribeToCollection", newdoc.toJSON(), this.mobx2json)
          });
        } else {
            // convert rxrdDocument to plain json-object and copy to data-observable
            this._data = newdoc.toJSON(); // deepCopy(newdoc.toJSON());
            //global.log("subscribeToCollection", newdoc.toJSON(), this.data2json)
        };
      };
    });
  }

  /*
  async subscribeToProperties(prop) {
    const doc = await this.collection.findOne().exec();
    doc.get$(prop).subscribe(newprop => { runInAction(() => {
      if (this.isObserved) this._mobx[prop] = newprop else this._data[prop] = newprop;
    })});
  }
  */


  // ===============================================
  // rxjs-collection-operations
  // ===============================================
  async syncCollectionWithServer(syncURL, dbName) {
    //this._collection.sync({ remote: syncURL + dbName + '/' });     // enable replication
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

    return true;
  }

  async removeAllDocuments() {
    if (!this.collection) return null;
    const query = this.collection.find();
    const removedDocs = await query.remove();
    await this.syncRxdbToDatabase();
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









/*
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

const memorySchema = {
  _id: "client",
}

const migrationStrategies {
  1: function(oldDoc) { // 1 means, this transforms data from version 0 to version 1
         oldDoc.time = new Date(oldDoc.time).getTime(); // string to unix
         return oldDoc;
       }
}
*/