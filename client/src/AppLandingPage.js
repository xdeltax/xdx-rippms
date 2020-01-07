import React from 'react';
import { toJS, }  from 'mobx';
import { observer, }  from 'mobx-react';
import { HashRouter/*BrowserRouter*/ as Router, } from 'react-router-dom';

import CssBaseline from '@material-ui/core/CssBaseline';

import Typography from '@material-ui/core/Typography';

import { loadFromPersistentDatabase, saveToPersistentDatabase, } from "persistentdb";

import { watchOnlineOfflineStatus, unwatchOnlineOfflineStatus } from "watchers/onOnlineOfflineChange";
import { watchConnectionStatus, unwatchConnectionStatus } from "watchers/onConnectionChange";
import { watchOrientationStatus, unwatchOrientationStatus } from "watchers/onOrientationChange";
import { watchVisibilityStatus, unwatchVisibilityStatus } from "watchers/onVisibilityChange";

import DEBUGOBJECTPRETTY from 'ui/components/debug/DEBUGOBJECTPRETTY';
import ErrorBoundary from "ui/components/errorhandler/ErrorBoundary";
import GlobalSpinner from "ui/components/spinner/GlobalSpinner";
import AppLoadingScreen from "./AppLoadingScreen";

import store from 'store'; // mobx-store

const AppRouter = React.lazy(() => import('ui/AppRouter'));

export default ( observer( class extends React.Component {
  state = {
    hasError: false,
    isLoading: true,
    statusText: "",
  }

  constructor(props) {
    super(props);

    global.log("AppLandingPage:: constructor:: ", global.nowDatePretty(), global.nowTimePretty(), )

    store.showSpinner("loading");
  }

  /*
    don.t do anything app-related between constructor and componentDidMount because
    componentWillUnmount is async since r.v16 and could finish inbetween constructor and ...didmount.
  */

  componentDidMount = async () => {
    try {
		  // ===============================================
		  // load store-data from client-storage
		  // ===============================================
	    this.setState({ statusText: "load persistent app-states" })
	    global.log("AppLandingPage:: onAppLoadEvent:: load app-state from persistent", );
	    await loadFromPersistentDatabase(); // save is on onUnloadEvent

		  // ===============================================
		  // add watchers
		  // ===============================================
      // Event listeners are only safe to add *after* mount, so they won't leak if mount is interrupted or errors.
      global.log("AppLandingPage:: componentDidMount:: register event-listeners", );
      this.setState({ statusText: "register event-listeners" })
      watchConnectionStatus();
      watchOnlineOfflineStatus();
      watchOrientationStatus();
      watchVisibilityStatus();
      
      window.addEventListener('beforeunload', this.handleLeavePageMessage, {once: true});

		  // ===============================================
		  // watch socket for first connection to server
		  // ===============================================
			store.socketio.onSocketConnect = async (socket, isConnected) => {
				global.log("AppLandingPage:: onSocketConnect:: ", socket.id)
			  // ===============================================
			  // update store-data (from persistent load) with fresh data from server-database (if there is a valid userid and a valid servertoken)
			  // ===============================================
		    //global.log("!!!!!!!!!!!!!!!!!1 AppLandingPage:: onAppLoadEvent:: load user-data from server", store.user.userid);
		    if (store.user.isValid) {
		    	const resObj = await store.user.getUserStoreFromServerANDMergeWithStore();
		    	global.log("AppLandingPage:: onAppLoadEvent:: getUserStoreFromServerANDMergeWithStore", resObj);
		    }
			}

			store.socketio.onSocketForceLogout = async () => {
		    global.log("AppLandingPage:: onAppLoadEvent:: onSocketForceLogout:: trigger logout!", );
			  // ===============================================
			  // force logout if a verification of the servertoken failed in a server-request
			  // ===============================================
				store.user.doAuthLogout();
			}

			store.socketio.onSocketErrorMessageFromServer = async (error) => {
			  // ===============================================
			  // all errormessages from server 
			  // ===============================================
		    global.log("AppLandingPage:: onAppLoadEvent:: onSocketErrorMessageFromServer:: error", error);
			}

		  // ===============================================
			// connect socket to server
		  // ===============================================
		  if (!global.DEBUG_DISABLE_SOCKETCONNECT) {
				const socketProtokoll = process.env.REACT_APP_SOCKETIO_HANDSHAKEVERSION || 10000;
				const appVersion = process.env.REACT_APP_APPVERSION || 0;
				global.log("index:: startApp:: connect socket. ", socketProtokoll, appVersion);
				store.socketio.connect(global.serverURL, socketProtokoll, appVersion);
			} else {
				global.log("index:: startApp:: DEBUG DEBUG DEBUG:: connect to socket is DISABLED!!! ", global);		
			}

      //this.setState({ statusText: "sleep 2" })
      //await store.sleep(5000);
    } finally {
      // do not load / init <AppRouter> until loading app-state is finished
      this.setState({ statusText: "", isLoading: false, })
      store.hideSpinner();
    }
  } // of componentDidMount


  componentWillUnmount = async () => { // fired (or not) after "beforeunload"-event
	  // ===============================================
	  // save store-data to client-storage
	  // ===============================================
    global.log("AppLandingPage:: onAppUnloadEvent:: saveToPersistentDatabase", )
    saveToPersistentDatabase();

	  // ===============================================
	  // save store-data to server-database
	  // ===============================================
    global.log("AppLandingPage:: onAppUnloadEvent:: saveUserToServerDatabase", store.user.userid)
    await store.user.saveUserStoreToServer();

	  // ===============================================
	  // remove watchers
	  // ===============================================
    global.log("AppLandingPage:: componentWillUnmount:: removeEventListeners", )
    unwatchConnectionStatus();
    unwatchOnlineOfflineStatus();
    unwatchOrientationStatus();
    unwatchVisibilityStatus();
    
    global.log("AppLandingPage:: componentWillUnmount:: EXIT!", )
    window.removeEventListener('beforeunload', this.handleLeavePageMessage);
  } // of componentWillUnmount


  handleLeavePageMessage(event) {
  	if (true === false)
    if (event) {
      global.log("onUnloadEvent:: confirmationMessage");

      event.preventDefault();

      const confirmationMessage = 'exit page?';
      event.returnValue = confirmationMessage;      // Gecko, Trident, Chrome 34+
      return confirmationMessage;                   // Gecko, WebKit, Chrome <34
    };
  }


  render() {
    global.log("AppLandingPage:: render()", toJS(store.user));
    // start up sequence is set to get a fast "First Content Paint" / "First Meaningful Paint"
    //  immediately: show animated loading-image from "./public/index.html"
    //  load reactjs from server
    //  show (<LoadingScreen />) from render()
    //  init app, init mobx-store, register event-listeners, load app-state from persistent, query database for updates
    //  show (<LoadingScreen />) from Lazy / Suspense until <AppRouter> is loaded from server

    const LoadingScreen = () => ( // defined in ./public/index.html <- className="first-screen" and src="./firstscreen.png"
      <React.Fragment>
        <div className="first-screen" style={{overflow: "hidden",}}>
          <img width="60%" src="./firstscreen.png" alt=" loading application ... " />
        </div>
        <Typography variant="h6" style={{ position: "absolute", bottom: 0, width: "100%", textAlign: "center", }}>{this.state.statusText}</Typography>
      </React.Fragment>
    );

    return (
      <React.Fragment>
        <GlobalSpinner show={store.isSpinnerVisible} hint={store.hint} />
        {this.state.isLoading ? <LoadingScreen /> : (
        <React.Fragment>
          <div style={{
            overflow: "hidden",
            position: "absolute",
            height: "100%",
            width: "100%",
            margin: 0,
            padding: 0,
            //minWidth: store.system.app.size.minWidth,
            //minHeight: store.system.app.size.minHeight,
            //maxWidth: store.system.app.size.maxWidth,
            //maxHeight: store.system.app.size.maxHeight,            
            color: store.system.colors.app.text,
            background: store.system.colors.app.background,
          }}>
            <CssBaseline />
            <ErrorBoundary>
              <React.Suspense fallback={<LoadingScreen />}>
                <Router><AppRouter startRoute={store.system.app.watchers.route.pathname || null} /></Router>
              </React.Suspense>
              {/*(this.state.isLoading) ? ( <LoadingScreen /> ) : ( <Router><AppRouter /></Router> )*/}
            </ErrorBoundary>
          </div>

          {global.DEBUG_SHOW_DEBUGOBJECTPRETTY &&
          <DEBUGOBJECTPRETTY startHidden opacity={0.5}
            style={{ zIndex: '98765', /*minHeight: 32,*/ maxHeight: "75%", overflow: "auto", textAlign: "left", position: "absolute", top: "auto", bottom: 0, width: "100%", }}
            title={[
              "DEBUG", ` v01 ${process.env.REACT_APP_APPVERSION} ${Math.floor(99*Math.random())}`,
              " s:", `${store.socketio.isConnected?1:0}`,
              " l:", `${store.loadingNowStatus?1:0}`,

              " c:", `${store.system.app.watchers.connection.isOnline?1:0}`,

              " a", `${store.isAuthenticated?1:0}`,
              "/", `${store.user.isValid?1:0}`,
              "/", `${store.usercard.isValid?1:0}`,

              " id:",`${store.user.userid}`,
              " [o:", `${store.system.app.watchers.orientation.angle}`,
              " t:", `${store.system.app.watchers.connection.type}`,
              " l:", `${store.system.app.watchers.route.pathname}`,
              "]", ``,
            ]}
            titleColors={["white", "cyan", "yellow", "cyan", ]}
            data={{
            	debugTime: global.debugTime(),
            	appVersion: process.env.REACT_APP_APPVERSION,
            	fingerprint: global.fingerprint.hash,
              loadingNowStatus: store.loadingNowStatus,
              isConnected: Boolean(store.socketio.isConnected),

              isAuthenticated: store.isAuthenticated,
              isValidUser: store.user.isValid,
              isValidUsercard: store.usercard.isValid,

              userid: store.user.userid,
              servertoken: store.user.servertoken,

              storeUser: store.user.get_all(),
              storeUsercard: store.usercard.get_all(),
              storePhaser: store.phaser.get_all(),
              storePixi: store.pixi.get_all(),
              //storeSocketIO: store.socketio.get_all(),
              storeSystem: store.system.get_all(),
            }}
          />
          }
        </React.Fragment>
        )}
      </React.Fragment>
    ); // of return
  }; // of render

})); // of class
