//import debuglog from "../../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import mongo from 'mongodb';

export const mongoCollection = async (client, databaseName, collectionName) => {
  const collection = await client.db(databaseName).collection(collectionName);
  return (collection) ? collection : null;
}

export const mongoConnect = async (url) => {
  const MongoClient = mongo.MongoClient;
  const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    //reconnectTries: 60,
    //reconnectInterval: 1000,
    poolSize: 10,
    bufferMaxEntries: 0
  }
  const client = await MongoClient.connect(url, options).catch(err => {
    //clog("client connection:: ERROR:: ", err);
    //return null;
    throw new Error(err);
  });
  //clog("client connection:: SUCCESS:: ", client);
  return client;
};
