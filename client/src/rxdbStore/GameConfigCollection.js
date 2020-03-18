import RxdbCollectionMobxPrototype from "./RxdbCollectionMobxPrototype";
//import {unixtime} from "tools/datetime";

// ===============================================
// collection-schema
// ===============================================
const rxdbSchema = {
  version: 0,
  title: "rxdb game schema",
  description: "all about the game",
  type: "object",
  keyCompression: false,
  properties: {
    _id:        { type: "string", primary: true }, // primary: unique, indexed, required

    mapid:      { type: "integer", default: 0, },
    mapstyle:   { type: "integer", default: 0, },
    bufferbytes:{ type: "integer", default: 1, },
    width:      { type: "integer", default: 5000, },
    height:     { type: "integer", default: 5000, },

    updatedAt:  { type: "number", },
  },
  required: ["updatedAt"], // required for every document
  attachments: { "encrypted": false }, // allow attachments (binaries); optional: encrypt with password
};

// ===============================================
// mobx-observables
// ===============================================
const memorySchema = {
  _id: "clientonly",

  mapid: 0,
  mapstyle: 0,
  bufferbytes: 1,
  //tileset: ["", "", "", ""],
  width: 100,

  height: 100,
  updatedAt: 0,
};

const migrationStrategies = null;

export default class RXDBGameDataCollection extends RxdbCollectionMobxPrototype {
  constructor(database, collectionName) {
    const cName = "gameconfig"; // only lowercase allowed
    const isObserved = false;
    super(isObserved, database, collectionName || cName, rxdbSchema, memorySchema, migrationStrategies); // open/create database and create/connect collection

    this._serverIsMaster = false;
  }

  async initCollection() {
    // 1) create or open collection
    // 2) if collection is empty -> create database-document from mobx-data
    // 3) make collection reactive to changes in database --> if collection changes, update mobx/data-data
    await super.initCollection(true); // true = subscribeToCollection = collection is reactive and synced to mobx/data

  }

  // ===============================================
  //
  // rxdb-database-operations
  //
  // ===============================================
  async setProp(prop, value, serverIsMaster) { // const x = await rxdbStore.user.setProp("card.test", 111 ); -> set _mobx: { card: {test:111} }
    /*
    // workflow:: send new value for property to server -> return updated prop from server-database -> change prop with data from server in local database -> sync to mobx
    const {err, res} = (serverIsMaster || this._serverIsMaster)
      ? await this.servercall_sendPropToServer(prop, value, this.getProp.auth.userid, this.getProp.auth.servertoken)
      : { err: null, res: { prop: prop, value: value }};

    if (!err && res.prop === prop) { // set prop in local database (and mobx) with feedback from server
      super.setProp(prop, res.value); // write new value to local-database and mobx-observable
    }
    */
    return await super.setProp(prop, value); // write new value to local-database and mobx-observable
  }

  async addAttachment(buf, name = "default") {
    const myDocument = await this.collection.findOne().exec();
    const attachment = await myDocument.putAttachment({ id: name, data: buf, type: "text/plain" });
      //id,     // string, name of the attachment like 'cat.jpg'
      //data,   // (string|Blob|Buffer) data of the attachment
      //type    // (string) type of the attachment-data like 'image/jpeg'
    return attachment;
  }

  async deleteAttachment(name = "default") {
    const myDocument = await this.collection.findOne().exec();
    const attachment = myDocument.getAttachment(name);
    await attachment.remove();
  }

  async getAttachment(name = "default") {
    const myDocument = await this.collection.findOne().exec();
    const attachment = myDocument.getAttachment(name);
    return attachment;
  }

  async getAttachmentAsString(name = "default") {
    const myDocument = await this.collection.findOne().exec();
    const attachment = myDocument.getAttachment(name);
    return await attachment.getStringData();
  }

  async getAttachmentAsBuffer(name = "default") {
    const myDocument = await this.collection.findOne().exec();
    const attachment = myDocument.getAttachment(name);
    return await attachment.getData();
  }

  // ===============================================
  //
  // client-operations
  //
  // ===============================================
  get isTest() {
    return Boolean(true);
  }


  // ===============================================
  // ===============================================
  //
  // server-API-operations
  //
  // ===============================================
  // ===============================================


  // ===============================================
  // ===============================================
  //
  // socket connection to server
  //
  // ===============================================
  // ===============================================
  servercall_test = async (targetuserid) => {
  };

};
