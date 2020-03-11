import {unixtime} from "../../tools/datetime.mjs";

export const injectStats = (req, res) => {
  if (res && req) res._callstats = {
    timeclientout: req._timeclientout || null,// inject new Date() at (client)time the client sends the request to the server
    timeserverin : req._timeserverin || null, // inject new Date() at (server)time the server received the client-call
    timeserverout: unixtime(),               // inject new Date() at (server)time the server sends the result back to the client
  };
  return res;
}
