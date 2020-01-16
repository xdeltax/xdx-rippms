import jwt from 'jsonwebtoken';

export const sign = (userid, provider, providerid, hash) => {
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

export const verify = (jwtServertoken) => {
  //clog("decodedecode:", jwt.decode(jwtServertoken))
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
    //clog("jwt.verify jwtPayloadDecoded::", jwtPayloadDecoded)
    return true;
  } catch (error) {
    //clog("jwt.verify ERROR ", error)
    //throw Error("Invalid Servertoken:: " + error);
    return false;
  }
}

export const decode = (jwtServertoken) => {
  try {
    return jwt.decode(jwtServertoken);
  } catch (error) {
    //clog("jwt.decode ERROR ", error)
    //throw Error("Invalid Servertoken:: " + error);
    return null;
  }
}
