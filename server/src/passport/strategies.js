const passport = require('passport');

const { Strategy: FacebookStrategy } = require('passport-facebook');
//const { Strategy: TwitterStrategy } = require('passport-twitter');
//const { Strategy: GithubStrategy} = require('passport-github');
//const { OAuth2Strategy: GoogleStrategy } = require('passport-google-oauth');


const FACEBOOK_CONFIG = {
  clientID: process.env.FACEBOOK_KEY || "",
  clientSecret: process.env.FACEBOOK_SECRET || "",
  profileFields: ['id', 'emails', 'name', 'picture.width(250)'],
  callbackURL:  process.env.NODE_ENV === "production" ? process.env.FACEBOOK_CALLBACK_PROD : process.env.FACEBOOK_CALLBACK_DEV;
};

/*
const TWITTER_CONFIG = {
  consumerKey: process.env.TWITTER_KEY || "",
  consumerSecret: process.env.TWITTER_SECRET || "",
  callbackURL: twitterURL,
}

const GOOGLE_CONFIG = {
  clientID: process.env.GOOGLE_KEY || "",
  clientSecret: process.env.GOOGLE_SECRET || "",
  callbackURL: googleURL,
}

const GITHUB_CONFIG = {
  clientID: process.env.GITHUB_KEY || "",
  clientSecret: process.env.GITHUB_SECRET || "",
  callbackURL: githubURL,
}
*/

module.exports = () => {  

  // Allowing passport to serialize and deserialize users into sessions
  passport.serializeUser((user, cb) => cb(null, user))
  passport.deserializeUser((obj, cb) => cb(null, obj))
  
  // The function that is called when an OAuth provider sends back user 
  // information.  Normally, you would save the user to the database here
  // in a callback that was customized for each provider.
  const callback = (accessToken, refreshToken, profile, cb) => cb(null, profile)

  // Adding each OAuth provider's strategy to passport
  passport.use(new FacebookStrategy(FACEBOOK_CONFIG, callback))
  //passport.use(new TwitterStrategy(TWITTER_CONFIG, callback))
  //passport.use(new GoogleStrategy(GOOGLE_CONFIG, callback))
  //passport.use(new GithubStrategy(GITHUB_CONFIG, callback))
}
