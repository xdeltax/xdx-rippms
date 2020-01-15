import {clog, } from "../tools/consoleLog.mjs";

import passport from 'passport';
import passportFacebook from 'passport-facebook'
import passportGoogle from 'passport-google-oauth20';


// setting up the passport middleware for each of the OAuth providers
export const passportFacebookAuth = passport.authenticate('facebook', { session: false, }); // disable req.session.passport
export const passportGoogleAuth   = passport.authenticate('google'  , { scope: ['profile'], session: false, }); // disable req.session.passport
//const passportLocalAuth    = passport.authenticate('local'   , { session: false, successRedirect: '/local.io.callback', failureRedirect: '/', }); // disable req.session.passport


// *** Configure the Facebook strategy for use by Passport.
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
const passportStrategyFacebookConfig = {
  clientID			: process.env.FACEBOOK_KEY,
  clientSecret	: process.env.FACEBOOK_SECRET,
  profileFields	: ['id', 'emails', 'name', 'picture.width(250)'],
  callbackURL		: process.env.FACEBOOK_CALLBACK,
  enableProof		: true, // enable app secret proof
};

const passportStrategyGoogleConfig = {
  clientID			: process.env.GOOGLE_CLIENT_ID,
  clientSecret	: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL		: process.env.GOOGLE_CALLBACK,
  enableProof		: true, // enable app secret proof
};

/*
const passportStrategyLocalConfig = {
  usernameField: "username",
  passwordField: "password",
};
*/

// ===============================================
// passport:: trigger callback after verification
// ===============================================
const verifyCallback = async (accessToken, refreshToken, profile, cb) => {
  profile.accessToken = accessToken;
  profile.refreshToken = refreshToken;
  cb(null, profile);
}

/*
// ===============================================
// passport:: auth against server database
// ===============================================
const PassportFacebookStrategy = passportFacebook.Strategy;
passport.use(new PassportFacebookStrategy(passportStrategyFacebookConfig, verifyCallback));

const PassportGoogleStrategy = passportGoogle.Strategy;
passport.use(new PassportGoogleStrategy  (passportStrategyGoogleConfig, verifyCallback));
*/
export const passportFacebookStrategy = () => {
  const PassportFacebookStrategy = passportFacebook.Strategy;
  const strategy = new PassportFacebookStrategy(passportStrategyFacebookConfig, verifyCallback);
  return strategy;
}

export const passportGoogleStrategy = () => {
  const PassportGoogleStrategy = passportGoogle.Strategy;
  const strategy = new PassportGoogleStrategy  (passportStrategyGoogleConfig, verifyCallback);
  return strategy;
}


// ===============================================
// passport:: middleware to parse query to session
// ===============================================
// custom middleware allows us to attach the socket id to the session. with the socket id attached we can send back the right user info to the right socket
export const passportInjectSession = (req, res, next) => {
  // parse req.query and store in session for use in passportAuthCallback
  // from client http://serverurl:serverport/facebook.io?sid={socket.id}&fp={fphash}&un={username}
  const socketid = (req && req.query) ? req.query.sid : null;
  const fingerprinthash = (req && req.query) ? req.query.fp : null;
  const uid = (req && req.query) ? req.query.uid : null;
  req.session.socketid = socketid;
  req.session.fingerprinthash = fingerprinthash;
  req.session.uid = uid;
  //clog("***(1) passportInjectSession:: ", socketid, req.query, req.session,)
  next();
};


// ===============================================
// passport:: send auth-success to client
// ===============================================
export const passportAuthCallback = async (req, res) => {
  // req.user from passport.use() -> cb(null, user)
  // req.session from passportInjectSession()
  // req.testing from app.use()
  const {
    user, 		// injected from passport.authenticate()
    session, 	// injected from passport / passportInjectSession
  } = req;

  const {
    socketid, // socketid from client-call
    fingerprinthash, // from client
    uid, // from client
  } = session || { };

  const {
    provider, // "facebook", "google", "local"
    accessToken,
    refreshToken,
    id,
    name,
    photos,
    emails,
    username,
  } = user || { };

  if (socketid && provider) { // valid: (provider === "google" || provider === "facebook" || provider === "local")) {
    const _providerid = id ? id : null;
    const _providertoken =	refreshToken ? refreshToken : accessToken ? accessToken : null;
    const	_uid = uid ? uid : null; // client-data
    const _fingerprinthash = fingerprinthash ? fingerprinthash : null; // client-data

    let res = null;
    // query db -> update or create db
    const {err, res: res_user} = await DBUsers.loginWithProvider(provider, _providerid, _providertoken, _uid, _fingerprinthash);
    if (!err && res_user) {
      res = {
        user: res_user,
        usercard: null,
      };

      // query usercard
      const {err: err_usercard, res: res_usercard} = await DBUsercards.getUsercard(res_user.userid, res_user.userid, res_user.servertoken);
      if (!err_usercard) {
        res.usercard = res_usercard;
      }
      //global.log(`***(X) passportAuthCallback:: /${provider}.io.callback:: STEP2:: `, err_usercard, res_usercard);
    }

    // send error or (full) user-object to client -> OAuth.js -> RouteLogin.js -> onAuthSuccess / onAuthFailed -> store.user.doAuthLogin(user)
    const ioRoute = `client.oauth.${provider}.io`;
    io.in(socketid).emit(ioRoute, err, res); // emit to client:: userobject OR null

    clog(`*** passportAuthCallback:: /${provider}.io.callback:: `, ioRoute, socketid, err, res.user.userid );
  }
  res.status(200).end();
};
