import React from 'react';
//import { toJS, }  from 'mobx';
import { observer, }  from 'mobx-react';
import { HashRouter/*BrowserRouter*/ as Router, } from 'react-router-dom';

import CssBaseline from '@material-ui/core/CssBaseline';

import Typography from '@material-ui/core/Typography';

import * as watchers from "watchers/index.js";
import * as localDatabase from "localDatabase/index.js";

import ErrorBoundary from "ui/components/errorhandler/ErrorBoundary";
import GlobalSpinner from "ui/components/spinner/GlobalSpinner";
import AppLoadingScreen from "./AppLoadingScreen";

import DEBUGOBJECTPRETTY from 'ui/components/debug/DEBUGOBJECTPRETTY';

import socketio from 'api/socket'; // socket

import store from 'store'; // mobx-store
import rxdbStore from 'rxdbStore'; // rxdb-database

const AppRouter = React.lazy(() => import('ui/AppRouter'));


export default ( observer( class extends React.Component {
  state = {
    isLoading: true,
    statusText: "",
  }

  constructor(props) {
    super(props);

    global.log("AppLandingPage:: constructor:: ", global.nowDatePretty(), global.nowTimePretty(), )

    store.appActions.showSpinner("loading");
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
      await localDatabase.loadAppData();	    //todo: await loadFromPersistentDatabase(); // save is on onUnloadEvent


		  // ===============================================
		  // add watchers
		  // ===============================================
      // Event listeners are only safe to add *after* mount, so they won't leak if mount is interrupted or errors.
      global.log("AppLandingPage:: componentDidMount:: register event-listeners", );
      this.setState({ statusText: "register event-listeners" })
      watchers.start();

      window.addEventListener('beforeunload', this.handleLeavePageMessage, {once: true});

		  // ===============================================
		  // watch socket for first connection to server
		  // ===============================================
			socketio.onSocketConnect = async (socket, isConnected) => {
				global.log("AppLandingPage:: onSocketConnect:: ", socket.id)
			  // ===============================================
			  // update store-data (from persistent load) with fresh data from server-database (if there is a valid userid and a valid servertoken)
			  // ===============================================
		    if (rxdbStore.user.getProp.isValidUser === true) {
		    	const resObj = await rxdbStore.user.syncUserDataFromServer();
		    	global.log("AppLandingPage:: onAppLoadEvent:: updateUserDataFromServer:: ", resObj);
		    }
			}

			socketio.onSocketForceLogout = async () => {
		    global.log("AppLandingPage:: onAppLoadEvent:: onSocketForceLogout:: trigger logout!", );
			  // ===============================================
			  // force logout if a verification of the servertoken failed in a server-request
			  // ===============================================
				await rxdbStore.user.doAuthLogout();
			}

			socketio.onSocketErrorMessageFromServer = async (error) => {
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
				socketio.connect(global.serverURL, socketProtokoll, appVersion);
			} else {
				global.log("index:: startApp:: DEBUG DEBUG DEBUG:: connect to socket is DISABLED!!! ", global);
			}

      //this.setState({ statusText: "sleep 2" })
      //await store.sleep(5000);
    } finally {
      // do not load / init <AppRouter> until loading app-state is finished
      this.setState({ statusText: "", isLoading: false, })
      store.appActions.hideSpinner();
    }
  } // of componentDidMount


  componentWillUnmount = async () => { // fired (or not) after "beforeunload"-event
	  // ===============================================
	  // save store-data to client-storage
	  // ===============================================
    global.log("AppLandingPage:: onAppUnloadEvent:: saveToPersistentDatabase", )
    await localDatabase.saveAppData(); //todo: saveToPersistentDatabase();

	  // ===============================================
	  // save store-data to server-database
	  // ===============================================
    const syncResult = await rxdbStore.user.syncUserDataToServer();
    global.log("AppLandingPage:: onAppUnloadEvent:: syncUserDataToServer:: ", syncResult)

	  // ===============================================
	  // remove watchers
	  // ===============================================
    global.log("AppLandingPage:: componentWillUnmount:: removeEventListeners", )
    watchers.stop();

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
    // start up sequence is set to get a fast "First Content Paint" / "First Meaningful Paint"
    //  immediately: show animated loading-image from "./public/index.html"
    //  load reactjs from server
    //  show (<LoadingScreen />) from render()
    //  init app, init mobx-store, register event-listeners, load app-state from persistent, query database for updates
    //  show (<LoadingScreen />) from Lazy / Suspense until <AppRouter> is loaded from server

    const LoadingScreen = () => ( // defined in ./public/index.html <- className="first-screen" and src="./firstscreen.png"
      <React.Fragment>
        <AppLoadingScreen />
        <Typography variant="h6" style={{ position: "absolute", bottom: 0, width: "100%", textAlign: "center", }}>{this.state.statusText}</Typography>
      </React.Fragment>
    );

    return (
      <React.Fragment>
        <GlobalSpinner show={store.appActions.spinner.isSpinnerVisible} hint={store.appActions.spinner.hintText} />
        {this.state.isLoading ? <LoadingScreen /> : (
          <React.Fragment>
            <div style={{
              overflow: "hidden",
              position: "absolute",
              height: "100%",
              width: "100%",
              margin: 0,
              padding: 0,
              //minWidth: store.appState.app.size.minWidth,
              //minHeight: store.appState.app.size.minHeight,
              //maxWidth: store.appState.app.size.maxWidth,
              //maxHeight: store.appState.app.size.maxHeight,
              color: store.get("appstate.colors.app.text", "black"), //store.appState.colors.app.text,
              background: store.get("appstate.colors.app.background", ), //store.appState.colors.app.background,
            }}>
              <CssBaseline />
              <ErrorBoundary>
                <React.Suspense fallback={ <LoadingScreen /> }>
                  <Router><AppRouter startRoute={ store.get("appstate.app.watchers.route.pathname", "") } /></Router>
                </React.Suspense>
              </ErrorBoundary>
            </div>

            {global.DEBUG_SHOW_DEBUGOBJECTPRETTY &&
              <DEBUGOBJECTPRETTY startHidden opacity={0.5}
                style={{ zIndex: '98765', /*minHeight: 32,*/ maxHeight: "75%", overflow: "auto", textAlign: "left", position: "absolute", top: "auto", bottom: 0, width: "100%", }}
                title={[
                  "DEBUG", ` v01 ${process.env.REACT_APP_APPVERSION} ${Math.floor(99*Math.random())}`,
                  " s:", `${store.appState.app.watchers.socket.isConnected?1:0}`,
                  " l:", `${store.appActions.loadingNowStatus?1:0}`,

                  " c:", `${store.appState.app.watchers.connection.isOnline?1:0}`,

                  " a", `${rxdbStore.user.isAuthenticated ? 1 : 0}`,
                  "/", `${rxdbStore.user.isValidUser ? 1 : 0}`,

                  " [o:", `${store.appState.app.watchers.orientation.angle}`,
                  " t:", `${store.appState.app.watchers.connection.type}`,
                  " l:", `${store.appState.app.watchers.route.pathname}`,
                  "]", ``,
                ]}
                titleColors={["white", "cyan", "yellow", "cyan", ]}
                data={{
                	debugTime: global.debugTime(),
                	appVersion: process.env.REACT_APP_APPVERSION,
                	fingerprint: global.fingerprint.hash,
                  loadingNowStatus: store.appActions.loadingNowStatus,
                  isSocketConnected: Boolean(store.appState.app.watchers.socket.isConnected),

                  _1: "___________________________________________",
                  userid: rxdbStore.user.getProp.auth.userid,
                  updatedAt: rxdbStore.user.getProp.auth.updatedAt,
                  UserCollection_mobx: rxdbStore.user.getAll(),
                  UserCollection_rxdb: rxdbStore.user.collection2json(),

                  _2: "___________________________________________",
                  isAuthenticated: rxdbStore.user.isAuthenticated,
                  isValidUser: rxdbStore.user.isValidUser,
                  isValidUsercard: rxdbStore.user.isValidUsercard,

                  _3: "___________________________________________",
                  storeGame: store.game.get_all_observables(),
                  storegameMap: store.gameMap.get_all(),

                  _4: "___________________________________________",
                  storeAppState: store.appState.get_all_observables(),
                }}
              />
            }
          </React.Fragment>
        )}
      </React.Fragment>
    ); // of return
  }; // of render

})); // of class
