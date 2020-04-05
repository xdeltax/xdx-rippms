import React from 'react';
import {render} from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker.js';

import memStore  from 'memStore'; // memory-store (non-persistent, non-reactive)
import mobxStore from 'mobxStore';// mobx-store (non-persistent, reactive)
import dbStore   from 'dbStore';  // pouchdb-store (persistent on local client)

//import fp2 from "fingerprintjs2";
import promiseToFingerprint from "tools/fingerprint.js";

import AppLoadingScreen from './AppLoadingScreen.js';

//============================================================================//
import debuglog from "debug/consolelog"; const clog = debuglog("index.js");
//============================================================================//

const AppLandingPage = React.lazy(() => import('./AppLandingPage.js'));

require("./globalConfig.js"); // import globals

////////////////////////////////////////////////////////////////////////////////
// global.app-config
//
global.serverURL = process.env.REACT_APP_SERVERTARGET === "localhost" ? process.env.REACT_APP_SERVERURL_LOCALHOST : process.env.REACT_APP_SERVERURL_VPSSERVER;
clog("startApp:: process.env:: ", process.env);

const startApp = async () => {
  //screen.orientation.lock('portrait')
  //var rotate = 0 - window.orientation;
  //setAttribute("transform:rotate("+rotate+"deg);-ms-transform:rotate("+rotate+"deg);-webkit-transform:rotate("+rotate+"deg)", "style");

  // init memory-store
  await memStore.init();

  // init mobx-store
  await mobxStore.init();
  //c.log("index:: startApp:: init mobxStore:: ", mobxStore);

  // init pouchdb-store
  await dbStore.init();
  //clog("index:: startApp:: init dbStore::", dbStore);

  // get fingerprint of client
	global.fingerprint = await promiseToFingerprint({ });	// this is async! about 100 ms...
	clog("fingerprint:: ", global.fingerprint, );

  render((
    <React.Suspense fallback={<AppLoadingScreen />}>
      <AppLandingPage />
    </React.Suspense>
  ), document.getElementById('root'));

  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: https://bit.ly/CRA-PWA
  const swConfig = {
  	onUpdate: (registration) => { // At this point, the updated precached content has been fetched, but the previous service worker will still serve the older content until all client tabs are closed
  		clog("ServiceWorker:: onUpdate:: ", registration);
  		alert("Update Available. Close App To Refresh.");
		  serviceWorker.unregister(); // unregister to refresh
  	},
  	onSuccess: (registration) => { // "Content is cached for offline use.
  		clog("ServiceWorker:: onSuccess:: ", registration);
  		alert("App Successfully Updated.");
  	},
  }
  serviceWorker.register(swConfig);
  //serviceWorker.unregister();
}

// cordova::
// We will later manually (or via a script) copy all files from react apps build folder to Cordova www folder.
// https://stackoverflow.com/questions/43336924/cordova-with-create-react-app
if(!window.cordova) { startApp() } else { document.addEventListener('deviceready', startApp, false) }
