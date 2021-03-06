import { configure, /*toJS*/ } from 'mobx';
//import { install } from '@material-ui/core/styles';

//import '@ionic/core/css/core.css';
//import '@ionic/core/css/ionic.bundle.css'; // kills scroll-events.
//import {setupConfig, } from '@ionic/react';

////////////////////////////////////////////////////////////////////////////////
// global helpers
// set new globals -> accessible in whole project without require
global.now          = () => new Date(); // Thu Oct 31 2019 10:45:09 GMT+0100
global.nowTimePretty= () => global.now().toLocaleTimeString(); // 10:47:05
global.nowDatePretty= () => global.now().toLocaleDateString(); // 31.10.2019
global.nowUnix      = () => global.now() / 1000; // 1572515109.941

global.absRandom    = (value) => Math.floor(value * Math.random());
global.randomHash   = (value) => "hash" + global.absRandom(100000000);

global.consoleLog   = require('tools/debug/consoleLog');
global.consoleWarn  = require('tools/debug/consoleWarn');
global.consoleInfo  = require('tools/debug/consoleInfo');
global.consoleError = require('tools/debug/consoleError');
global.log   = ( ...restArgs ) => { global.consoleLog  (global.nowTimePretty(), restArgs); };
global.debug = ( ...restArgs ) => { global.consoleLog  (global.nowTimePretty(), restArgs); };
global.warn  = ( ...restArgs ) => { global.consoleWarn (global.nowTimePretty(), restArgs); };
global.info  = ( ...restArgs ) => { global.consoleInfo (global.nowTimePretty(), restArgs); };
global.error = ( ...restArgs ) => { global.consoleError(global.nowTimePretty(), restArgs); };

////////////////////////////////////////////////////////////////////////////////
// global.app-config
//
global.APPCONFIG_HANDSHAKEPROTOCOLVERSION = 10000; // v1.00.00

global.APPCONFIG_FACEBOOK_API_VERSION = "v3.1";
global.APPCONFIG_FACEBOOK_APPID = process.env.REACT_APP_FB_APPID;

////////////////////////////////////////////////////////////////////////////////
// global debug-vars

//if (process.env.NODE_ENV === "development") 
{
  global.DEBUG_SHOW_DEBUGOBJECTPRETTY = true;

  global.DEBUG_AUTH_ISVALIDUSER = false; // store.user.isValidUser()
  global.DEBUG_AUTH_ISVALIDPROFILE = false; // store.user.isValidUserProfile()
  global.DEBUG_AUTH_ALLOW_FAKE_IDS = true; // store.user.loginWithFacebook(fakeUser, fakeProfile)

  global.DEBUG_DISABLE_PERSISTENSAVEONCLOSEAPP = false; // persistent:: saveToPersistentDatabase()
  global.DEBUG_DISABLE_PERSISTENLOADONOPENAPP = false; // persistent:: loadFromPersistentDatabase()

  global.DEBUG_DISABLE_SOCKETCONNECT = true; // store.init() -> this.socketio.connect()
  //global.DEBUG_AUTH_FAKE_SERVERRESPONSE = false; // store.user.loginWithFacebook(fakeUser, fakeProfile)
  //DEBUG_DISABLE_REQUIREFACEBOOKTOLOGIN = false;
  //DEBUG_DISABLE_REQUIRESERVERTOKEN = false; // used in routes/socketio
  //DEBUGMODE_MOCK_A_USER = false;
}

/*
////////////////////////////////////////////////////////////////////////////////
// IONIC-config
setupConfig({ // https://ionicframework.com/docs/react/config
  rippleEffect: true,
  mode: 'md'
});
*/
////////////////////////////////////////////////////////////////////////////////
// MOBX-config
configure({ enforceActions: "always" });

// material UI
//install(); // material-ui styles
