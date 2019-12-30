//const Joi = require('@hapi/joi');
module.exports = (value, fallback, schema, options, ) => {
  try {
    const res = schema.validate(value, options || {abortEarly: true, convert: true, allowUnknown: false, stripUnknown: true, } );
    if (res.error) throw new Error(res.error);
    return res.value;
  } catch (error) {
  	//global.log("joiValidateFallback:: ", error);
    return fallback;
  }
}
