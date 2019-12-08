//const Joi = require('@hapi/joi');
module.exports = (value, schema, message, options) => {
  try {
    //const res = Joi.validate(value, schema, options || {abortEarly: true, convert: true, allowUnknown: false, stripUnknown: true, } );
    const res = schema.validate(value, options || {abortEarly: true, convert: true, allowUnknown: false, stripUnknown: true, } );
    //global.log("VALIDATE:: ", res)
    if (res.error) throw new Error( (message && message) + res.error);
    return res.value;
  } catch (error) {
    throw error;
  }
}
