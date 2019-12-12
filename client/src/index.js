import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';

import AppLoadingScreen from './AppLoadingScreen';
const AppLandingPage = React.lazy(() => import('./AppLandingPage')); //import AppRouter from "ui/AppRouter"; // react-router

const startApp = () => {
  //<React.StrictMode><AppLandingPage /></React.StrictMode>

  //screen.orientation.lock('portrait')
  //var rotate = 0 - window.orientation;
  //setAttribute("transform:rotate("+rotate+"deg);-ms-transform:rotate("+rotate+"deg);-webkit-transform:rotate("+rotate+"deg)", "style");

  ReactDOM.render((
    <React.Suspense fallback={<AppLoadingScreen />}>
      <AppLandingPage />
    </React.Suspense>
  ), document.getElementById('root'));
  //ReactDOM.createRoot(document.getElementById('root')).render(<AppProvider />); // concurrent React react16.7

  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: https://bit.ly/CRA-PWA
  const swConfig = {
  	onUpdate: (registration) => { // At this point, the updated precached content has been fetched, but the previous service worker will still serve the older content until all client tabs are closed
  		console.log("SW onUpdate:: ", registration);
  		alert("New Version Available. Close App To Refresh.");
		  serviceWorker.unregister(); // unregister to refresh 
  	},
  	onSuccess: (registration) => { // "Content is cached for offline use.
  		console.log("SW onSuccess:: ", registration);
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
