import { configure, /*toJS*/ } from 'mobx';
import {unixtime} from "tools/datetime";
//import { install } from '@material-ui/core/styles';
import debuglog from "debug/consolelog.js";

//import '@ionic/core/css/core.css';
//import '@ionic/core/css/ionic.bundle.css'; // kills scroll-events.
//import {setupConfig, } from '@ionic/react';

////////////////////////////////////////////////////////////////////////////////
// global helpers
// set new globals -> accessible in whole project without require
global.launchTime   = new Date();
global.now          = () => new Date(); // Thu Oct 31 2019 10:45:09 GMT+0100
global.nowTimePretty= () => global.now().toLocaleTimeString(); // 10:47:05
global.nowDatePretty= () => global.now().toLocaleDateString(); // 31.10.2019
global.nowUnix      = () => global.now() / 1000; // 1572515109.941
global.nowunix      = () => global.nowUnix();

global.absRandom    = (value) => Math.floor(value * Math.random());
global.randomHash   = (value) => "hash" + global.absRandom(100000000);
global.random       = (range) => Math.floor((range || 100) * Math.random());

global.consoleLog   = require('debug/bind/consoleLog');
global.consoleWarn  = require('debug/bind/consoleWarn');
global.consoleInfo  = require('debug/bind/consoleInfo');
global.consoleError = require('debug/bind/consoleError');

const _clog = debuglog("");

//global.debugTime= () => `${global.nowTimePretty()} (${global.now()-global.launchTime} ms)`;
//global.clog   = ( ...restArgs ) => { global.consoleLog  (global.debugTime(), ...restArgs); };
global.clog     = ( mainArg, ...restArgs ) => { _clog(mainArg, ...restArgs); };
global.log      = ( mainArg, ...restArgs ) => { _clog(mainArg, restArgs); };
//global.log   = ( ...restArgs ) => { global.consoleLog  (global.debugTime(), restArgs); };
//global.debug = ( ...restArgs ) => { global.consoleLog  (global.debugTime(), restArgs); };
//global.warn  = ( ...restArgs ) => { global.consoleWarn (global.debugTime(), restArgs); };
global.info  = ( ...restArgs ) => { global.consoleInfo (global.debugTime(), restArgs); };
global.error = ( ...restArgs ) => { global.consoleError(global.debugTime(), restArgs); };


//if (process.env.NODE_ENV === "development") { }
global.DEBUG_SHOW_DEBUGOBJECTPRETTY = true;  // in ./AppLandingPage.js
global.DEBUG_AUTH_FAKE_ISVALIDUSER  = false; // in ./rxdbStore/UserCollection.js
global.DEBUG_DISABLE_SOCKETCONNECT  = true;  // in ./AppLandingPage.js
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
