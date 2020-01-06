"use strict";
var jwt = require('jsonwebtoken');

module.exports.sign = (userid, provider, providerid, hash) => {
  const jwtPayload = {
    usid: userid,
    pvd: provider,
    pid: providerid,
    hash: hash,
  }; // exp: Math.floor(Date.now() / 1000) + jwtExpiration,
  const jwtSecret = process.env.JWT_SECRET_PASSWORD;
  const jwtExpiration = '7d'; // 60 * 60; // Signing a token with 1 hour of expiration
  const jwtOptions = {
    jwtid: 'id1',             // -> jti: "id1"
    expiresIn: jwtExpiration, // -> exp: 155148373      60*60, "1h", "7d",
    issuer: 'xdx',            // -> iss: "xdx"
    audience: 'member',       // -> aud: "testuser"
    subject: 'x',       // -> sub: "hello"
  }
  return jwt.sign( jwtPayload, jwtSecret, jwtOptions );
}

module.exports.verify = (jwtServertoken) => {
  //global.log("decodedecode:", jwt.decode(jwtServertoken))
  const jwtVerifyOptions = {
    jwtid: 'id1',
    issuer: 'xdx',
    audience: 'member',
    subject: 'x',
    complete: true,
    clockTolerance: 120,
    maxAge: '30d',
    //ignoreExpiration: true,
  }
  const jwtSecret = process.env.JWT_SECRET_PASSWORD;
  try {
    const jwtPayloadDecoded =  jwt.verify(jwtServertoken, jwtSecret, jwtVerifyOptions);
    //global.log("jwt.verify jwtPayloadDecoded::", jwtPayloadDecoded)
    return true;
  } catch (error) {
    //global.log("jwt.verify ERROR ", error)
    //throw Error("Invalid Servertoken:: " + error);
    return false;
  }
}

module.exports.decode = (jwtServertoken) => {
  try {
    return jwt.decode(jwtServertoken);
  } catch (error) {
    //global.log("jwt.decode ERROR ", error)
    //throw Error("Invalid Servertoken:: " + error);
    return null;
  }
}
