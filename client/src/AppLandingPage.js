import React from 'react';
import { toJS, }  from 'mobx';
import { observer, }  from 'mobx-react';
import { HashRouter/*BrowserRouter*/ as Router, } from 'react-router-dom';

import CssBaseline from '@material-ui/core/CssBaseline';

import Typography from '@material-ui/core/Typography';

import { loadFromPersistentDatabase, saveToPersistentDatabase, } from "db/persistent";

import { watchOnlineOfflineStatus, unwatchOnlineOfflineStatus } from "watchers/onOnlineOfflineChange";
import { watchConnectionStatus, unwatchConnectionStatus } from "watchers/onConnectionChange";
import { watchOrientationStatus, unwatchOrientationStatus } from "watchers/onOrientationChange";
import { watchVisibilityStatus, unwatchVisibilityStatus } from "watchers/onVisibilityChange";
import { watchUnloadAppEventAndUpdate, } from "watchers/onAppLoadUnloadEvent";

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

    // some noob checks
    global.info(`INFO:: process.env.NODE_ENV is set to "${process.env.NODE_ENV}".`,);
    global.info(`INFO:: process.env.REACT_APP_SERVERURL is set to "${process.env.REACT_APP_SERVERURL}".`,); // for socket.io
    // attn: socket.io:: .env-file needs url to nodejs-server for socket-connection
    if (!process.env.REACT_APP_SERVERURL ) global.warn(`ATTN:: process.env.REACT_APP_SERVERURL no found! set it in .env`);

    if (!process.env.REACT_APP_APPVERSION) global.warn(`ATTN:: process.env.REACT_APP_APPVERSION no found! set it in .env`);
  }

  /*
    don.t do anything between constructor and componentDidMount.
    componentWillUnmount is async since r.v16 and could finish inbetween.
  */

  componentDidMount = async () => {
    try {
      // 1st load app-state to store -> than register / update listeners in store.
      await this.onAppLoadEvent(); // load app-state from persistent local-db and call server for updates

      // Event listeners are only safe to add *after* mount, so they won't leak if mount is interrupted or errors.
      global.log("AppLandingPage:: componentDidMount:: register event-listeners", );

      this.setState({ statusText: "register event-listeners" })
      watchConnectionStatus();
      watchOnlineOfflineStatus();
      watchOrientationStatus();
      watchVisibilityStatus();
      watchUnloadAppEventAndUpdate(this.onAppUnloadEvent); // -> saveToPersistentDatabase()

      //this.setState({ statusText: "sleep 2" })
      //await store.sleep(5000);
    } finally {
      // do not load / init <AppRouter> until loading app-state is finished
      this.setState({ statusText: "", isLoading: false, })
      store.hideSpinner();
    }
  } // of componentDidMount

  onAppLoadEvent = async () => {
	  // ===============================================
	  // load store-data from client-storage
	  // ===============================================
    this.setState({ statusText: "load persistent app-states" })
    global.log("AppLandingPage:: onAppLoadEvent:: load app-state from persistent", );
    await loadFromPersistentDatabase(); // save is on onUnloadEvent

	  // ===============================================
	  // load store-data from server-database
	  // ===============================================
    this.setState({ statusText: "load persistent app-states" })
    global.log("AppLandingPage:: onAppLoadEvent:: load user-data from server", );
    await store.user.apiCALL_DBUsers_loadUserFromServerDatabase(store.user.userid, store.user.userid, store.user.servertoken);
  }


  onAppUnloadEvent = async (event) => {
	  // ===============================================
	  // save store-data to client-storage
	  // ===============================================
    global.log("AppLandingPage:: onAppUnloadEvent:: saveToPersistentDatabase", )
    saveToPersistentDatabase();

	  // ===============================================
	  // save store-data to server-database
	  // ===============================================
    global.log("AppLandingPage:: onAppUnloadEvent:: saveUserToServerDatabase", store.user.userid)
    await store.user.apiCALL_DBUsers_saveUserToServerDatabase(store.user.userid, store.user.userid, store.user.servertoken);

    global.log("AppLandingPage:: componentWillUnmount:: removeEventListeners", )
    unwatchConnectionStatus();
    unwatchOnlineOfflineStatus();
    unwatchOrientationStatus();
    unwatchVisibilityStatus();

    /*
    if (event) {
      global.log("onUnloadEvent:: EXIT?-Message");
      if (!global.DEBUG_DISABLE_CONFIRMATIONMESSAGEONCLOSE) {
        global.log("onUnloadEvent:: confirmationMessage");
        event.preventDefault();
        const confirmationMessage = '';
        event.returnValue = confirmationMessage;      // Gecko, Trident, Chrome 34+
        return confirmationMessage;                   // Gecko, WebKit, Chrome <34
      }
    }
    */
  }

  componentWillUnmount = async () => { // fired (or not) after "beforeunload"-event
    // saveToPersistentDatabase is called before componentWillUnmount in onAppUnloadEvent!
    await this.onAppUnloadEvent(); // backup

    global.log("AppLandingPage:: componentWillUnmount:: EXIT!", )
  } // of componentWillUnmount


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

              " a", `${store.user.isAuthenticated?1:0}`,
              "/", `${store.user.isValidUser?1:0}`,
              "/", `${store.user.isValidUserProfile?1:0}`,

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
              isAuthenticated: this.isAuthenticated,
              isValidUser: this.isValidUser,
              isValidUserProfile: this.isValidUserProfile,
              userid: store.user.userid,
              servertoken: store.user.servertoken,
              storeUser: store.user.get_all(),
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
