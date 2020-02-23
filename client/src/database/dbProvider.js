import * as Datastore from 'nedb';

// client-side nedb stores in localstorage: indexeddb, localstorage, ...
export const createDatastore = (fname, onDBError) => {
  return new Datastore({ filename: fname, autoload: true, timestampData: true, onload: onDBError });

  /*
  this.db.ensureIndex({ fieldName: 'authUser', unique: true }, function (err) {
    if (err) global.ddd("app.js:: db.ensureIndex failed with error: ", err)
  });     // Using a unique constraint with the index
  */
}

export const createDatastoreASYNC = (fname) => {
  return new Promise( (resolve, reject) => {
    const db = createDatastore(fname, (err) => {
      if (err) return reject(err);
      resolve(db);
    }); // ... and "autoload"
  });
}

// find key "store" in "db"
export const dbFindOneASYNC = (db, store) => {
  return new Promise( (resolve, reject) => {
    db.findOne({ storename: store }, (err, doc) =>  {
      if (err) return reject(err);
      resolve(doc);
    });
  });
}

export const updatedbASYNC = (db, store, obj) => {
  return new Promise( (resolve, reject) => {
    let query = { storename: store };
    let insertObject = { storename: store, storedata: obj, updatedAt: new Date() };
    db.update(query, insertObject, { upsert: true }, (err, numAffected, affectedDocuments, upsert) => {
      //*                      If update was an upsert, upsert flag is set to true
      //*                      affectedDocuments can be one of the following:
      //*                        * For an upsert, the upserted document
      //*                        * For an update with returnUpdatedDocs option false, null
      //*                        * For an update with returnUpdatedDocs true and multi false, the updated document
      //*                        * For an update with returnUpdatedDocs true and multi true, the array of updated documents
      if (err) return reject(err);
      resolve(affectedDocuments);
    });
  });
}

export const removedbASYNC = (db, store) => {
  return new Promise( (resolve, reject) => {
    let query = { storename: store };
    db.remove(query, { multi: true }, (err, numRemoved) => {
      if (err) return reject(err);
      resolve(numRemoved);
    });
  });
}

/*
// save "obj" to key "store" in "db"
const savetodbASYNC = (db, store, obj) => {
  return new Promise( (resolve, reject) => {
    db.findOne({ storename: store }, (err, doc) =>  {
      if (err) return reject(err);
      let insertObject = { storename: store, storedata: obj, updatedAt: Date.now(), };
      if (!doc) {
        db.insert( insertObject, (err, doc) => {
          if (err) return reject(err);
          resolve(doc);
        });
      } else {
        let query = { storename: store };
        db.update(query, insertObject, { upsert: true }, (err, doc) => {
          if (err) return reject(err);
          resolve(doc);
        });
      }
    });
  });
}
*/
