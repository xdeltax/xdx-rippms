import {clog, } from "../tools/consoleLog.mjs";

const joiValidateFallback = (value, fallback, schema, options, dontLogError ) => {
  try {
    const res = schema.validate(value, options || {abortEarly: true, convert: true, allowUnknown: false, stripUnknown: true, } );
    if (res.error) throw new Error(res.error);
    return res.value;
  } catch (error) {
  	!dontLogError && clog("joiValidateFallback:: ", value, error);
    return fallback;
  }
}

export default joiValidateFallback;
