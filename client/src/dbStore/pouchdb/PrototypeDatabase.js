//https://github.com/pgte/pouch-websocket-sync

import debuglog from "../../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import {unixtime} from "../../tools/datetime.mjs";

import PouchDB from 'pouchdb-core';
import Plugin_pouchdb_replication from 'pouchdb-replication';
import Plugin_pouchdb_adapter_http from 'pouchdb-adapter-http';
import Plugin_pouchdb_mapreduce from 'pouchdb-mapreduce';
import Plugin_pouchdb_find from 'pouchdb-find';
import Plugin_pouchdb_adapter_node_websql from 'pouchdb-adapter-node-websql';
//import Plugin_pouchdb_adapter_memory from 'pouchdb-adapter-memory';

export default class DatabasePrototype {
  get databasenName(){ return this._dbName; }
  get db() { return (this._db) ? this._db : null; }

  constructor(dbName, documentSchema, migrationStrategies) {
    this._dbName = dbName || null;
    this.loadPlugins();
    this._db = this.openDatabase(dbName);

    //PouchDB.debug.enable('pouchdb:find');
  }


  // ===============================================
  // event-stuff
  // ===============================================
  async getChanges(options) { // one shot query
    if (!options) options = { };
    options.live = false; // single shot
    return await this.db.changes(options);
  }

  subscribeToChanges(options, onChange, onComplete, onError) { // START: const onListOfChanges = this.subscribeToChanges(); STOP: onListOfChanges.cancel();
    if (!options) options = { };
    options.live = true; // emit future-changes until .cancel()
    options.since = "now";
    options.include_docs = true;
    this._subscribeToChanges = this.db.changes(options) // https://pouchdb.com/api.html#changes
    .on('change', (change) => { onChange && onChange(change); /*clog("change::", change);*/ }) // handle change
    .on('complete', (info) => { onComplete && onComplete(info); /*clog("complete::", info);*/ }) // changes() was canceled
    .on('error',   (error) => { onError && onError(error); /*clog("error::", error);*/ });
  }

  unsubscribeToChanges() {
    if (this._subscribeToChanges) this._subscribeToChanges.cancel();
  }


  // ===============================================
  // document-stuff
  // ===============================================
  async getAllDocuments(options) { // sorted by _id
    if (!options) options = { };
    options.include_docs = true;
    options.attachments = false;
    //options.startkey =
    //options.endkey =
    //options.limit
    //options.key = ""
    //options.keys = ["", "", ]
    return await this.db.allDocs(options); // https://pouchdb.com/api.html#batch_fetch
  }

  async getOneDocumentFailsafe(_id, options) {
    let doc;
    try {
      doc = await this.db.get(_id, options || {});
    } catch(error) {
      doc = null;
    } finally {
      return doc;
    }
  }

  async getOneDocumentWithAttachementFailsafe(_id, options) {
    if (!options) options = { };
    options.attachments = true;
    return await this.getOneDocumentFailsafe(_id, options);
  }

  async upsertDocument(newdoc, options) {
    if (!options) options = { };
    if (!newdoc) throw new Error("not a valid document");

    // check by _id if doc already exist
    const olddoc = await this.getOneDocumentFailsafe(newdoc._id);

    const time = unixtime();
    if (olddoc) newdoc._rev = olddoc._rev; else newdoc.createdAt = time;
    newdoc.updatedAt = time;
    //clog("upsert::2", olddoc, newdoc);

    const response = await this.db.put(newdoc, options);
    //clog("upsert::", olddoc, newdoc, response);

    return await this.getOneDocumentFailsafe(newdoc._id);
  }

  async createDocument(newdoc, options) { // autogenerate _id
    return await this.db.post(doc, options || {});
  }

  async deleteDocument(doc2del) {
    if (!doc2del) throw new Error("not a valid document");
    doc2del._deleted = true;
    return await this.upsertDocument(doc2del);
  }


  // ===============================================
  // attachment-stuff
  // ===============================================
  async addAttachmentToDocument(doc, attachmentId, attachment, type) {
    //This method will update an existing document to add the attachment, so it requires a rev if the document already exists.
    //If the document doesn’t already exist, then this method will create an empty document containing the attachment.
    if (!doc) throw new Error("not a valid document");
    if (!type) type = 'text/plain';
    return await this.db.putAttachment(doc._id, attachmentId, doc._rev, attachment, type);
  }

  async getAttachment(docId, attachmentId, options) {
    //The response will be a Blob object in the browser and a Buffer object in Node.js.
    //See blob-util (https://github.com/nolanlawson/blob-util) for utilities to transform Blobs to other formats, such as base64-encoded strings, data URLs, array buffers, etc.
    if (!options) options = { };
    return await this.db.getAttachment(docId, attachmentId, options);
  }

  async deleteAttachmentFromDocument(doc, attachmentId, options) {
    if (!doc) throw new Error("not a valid document");
    if (!options) options = { };
    return await this.db.removeAttachment(doc._id, attachmentId, doc._rev)
  }

  // The solutions posted here don't work in non-ascii characters (i.e. if you plan to exchange base64 between Node.js and a browser). In order to make it work you have to mark the input text as 'binary'.

  //Buffer.from('Hélló wórld!!', 'binary').toString('base64')
  //This gives you SOlsbPMgd/NybGQhIQ==. If you make atob('SOlsbPMgd/NybGQhIQ==') in a browser it will decode it in the right way. It will do it right also in Node.js via:

  //Buffer.from('SOlsbPMgd/NybGQhIQ==', 'base64').toString('binary')
  //If you don't do the "binary part", you will decode wrongly the special chars.


  // ===============================================
  // index-stuff -> plugin "pouchdb-find" (https://pouchdb.com/guides/mango-queries.html) REQUIRED
  // ===============================================
  async createIndex(index) { // https://pouchdb.com/api.html#create_index
    // db.createIndex({ index: {fields: ['name']} });
    return await this.db.createIndex(index); // { "result": "created" } or { "result": "exists" }
  }

  async queryIndex(request) {
    return await this.db.find(request);
  }


  // ===============================================
  // database-stuff
  // ===============================================
  async closeDatabase() {
    if (this.db) await this.db.close();
    this.db = null;
  }

  async deleteDatabase() { // const response = await dbStore.deleteDatabase("basemaps");
    return (this.db) ? await this.db.remove() : null;
  }

  async info() {
    return (this.db) ? await this.db.info() : null;
  }


  // ===============================================
  // replication-stuff
  // ===============================================
  /*on client:: one-shot replication and than continuous sync
  var url = 'http://localhost:5984/mydb';
  var opts = { live: true, retry: true };

  // do one way, one-off sync from the server until completion
  db.replicate.from(url).on('complete', function(info) {
    // then two-way, continuous, retriable sync
    db.sync(url, opts)
      .on('change', onSyncChange)
      .on('paused', onSyncPaused)
      .on('error', onSyncError);
  }).on('error', onSyncError);
  */

  async replicateTo(target, options) { // single shot
    if (!options) options = { };
    options.live = false;
    return await this.db.replicate.to(target, options) // https://pouchdb.com/api.html#replication
    //For non-live replications, the returned object is also an event emitter as well as a promise, and you can use all the events described above (except for 'paused' and 'active', which only apply to retry replications).
  }

  async replicateFrom(source, options) { // single shot
    if (!options) options = { };
    options.live = false;
    return await this.db.replicate.from(source, options) // https://pouchdb.com/api.html#replication
  }

  startReplicationTo(target, options) {
    this.startReplication(this.db, target, options); // this.db.replicate.to(remoteDB, [options]);
  }

  startReplicationFrom(source, options) {
    this.startReplication(source, this.db, options); // db.replicate.from(remoteDB, [options]);
  }

  stopReplication() {
    if (this._replicate) this._replicate.cancel();
  }

  startReplication(source, target, options) {
    if (!options) options = { };
    options.live = true; // If options.live is true, then this will track future changes and also replicate them automatically
    options.retry= true; // If true will attempt to retry replications in the case of failure (due to being offline), using a backoff algorithm that retries at longer and longer intervals until a connection is re-established, with a maximum delay of 10 minutes. Only applicable if options.live is also true.

    this._replicate = PouchDB.replicate(source, target, options) // https://pouchdb.com/api.html#replication
    .on('change', (info) => { }) // handle change
    .on('paused', (err) => { }) // replication paused (e.g. replication up to date, user went offline)
    .on('active', () => { }) // replicate resumed (e.g. new changes replicating, user went back online)
    .on('denied', (err) => { }) // a document failed to replicate (e.g. due to permissions)
    .on('complete', (info) => { }) // handle complete
    .on('error', (err) => { }) // handle error
    ;//Replication is an event emitter like changes() and emits the 'complete', 'active', 'paused', 'change', 'denied' and 'error'
  }

  startSync(source, target, options) {
    //todo:: this._sync = PouchDB.sync(source, target, options) // https://pouchdb.com/api.html#sync
    // or :: this._sync = this.db.sync(target, options);
  }


  // ===============================================
  // database-config
  // ===============================================
  loadPlugins = () => {
    //PouchDB.plugin(Plugin_pouchdb_adapter_memory);
    PouchDB.plugin(Plugin_pouchdb_adapter_node_websql);
    //PouchDB.plugin(RxDBZSchemaValidateModule);

    PouchDB.plugin(Plugin_pouchdb_adapter_http);
    PouchDB.plugin(Plugin_pouchdb_replication);
    PouchDB.plugin(Plugin_pouchdb_mapreduce);

    PouchDB.plugin(Plugin_pouchdb_find);
  }; // of loadPlugins

  openDatabase = (name) => { // static method (not affected by instance) -> called with classname: DBGeoData.load
    const options = {
      name: name,
      auto_compaction: false,
      size: 100, // Valid increments are 10, 50, 100, 500, and 1000 // On iOS and Safari, if you expect your app to use more than 5MB of space, you will need to request the space up-front from the user
      adapter: 'websql',            // <- storage-adapter
      //adapter: 'memory',
      //password: 'myPassword',     // <- password (optional)
      //multiInstance: true,        // <- multiInstance (optional, default: true)
      //queryChangeDetection: false // <- queryChangeDetection (optional, default: false)
      /*
      fetch: function (url, opts) {
        opts.headers.set('X-Some-Special-Header', 'foo');
        return PouchDB.fetch(url, opts);
      }*/
    };
    return new PouchDB(options);
  }; // of openDatabase


  // ===============================================
  // helpers
  // ===============================================
  forceToJson(doc) {
    return JSON.parse(JSON.stringify(doc));
  }
}
