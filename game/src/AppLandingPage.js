import React from 'react';
import { HashRouter/*BrowserRouter*/ as Router, } from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';

import AppLoadingScreen from "./AppLoadingScreen.js";

import ErrorBoundary from "ui/components/errorhandler/ErrorBoundary.js";
import GlobalSpinner from "ui/components/spinner/GlobalSpinner.js";

import DEBUGOBJECTPRETTY from 'ui/components/debug/DEBUGOBJECTPRETTY.js';

import sleeper from 'tools/sleeper.js';

import memStore  from 'memStore'; // memory-store (non-persistent, non-reactive)

//============================================================================//
import debuglog from "debug/consolelog"; const clog = debuglog("AppLandingPage.js");
//============================================================================//

const AppRouter = React.lazy(() => import('ui/AppRouter'));

export default class AppLandingPage extends React.Component {
  state = {
    isLoading: true,
    statusText: "",
  }

  componentDidMount = async () => {
    try {
      this.setState({ statusText: "register event-listeners" })
      await sleeper(2000);
    } finally {
      // do not lazy load / init <AppRouter> until loading app-state is finished
      this.setState({ statusText: "", isLoading: false, })
    }
  }

  componentWillUnmount = async () => { // fired (or not) after "beforeunload"-event
  }

  render() {
    clog("### render:: ", this.props);

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
          <GlobalSpinner tcolor={memStore.color.overlay.text} bcolor={memStore.color.overlay.background} show={this.state.isLoading} hint={this.state.statusText} />
          {this.state.isLoading
          ? <LoadingScreen />
          : <div style={{
              overflow: "hidden",
              position: "absolute",
              height: "100%",
              width: "100%",
              margin: 0,
              padding: 0,
              //minWidth: rxdbStore.app.getProp.config.size.minWidth,
              //minHeight: rxdbStore.app.getProp.config.size.minHeight,
              //maxWidth: rxdbStore.app.getProp.config.size.maxWidth,
              //maxHeight: rxdbStore.app.getProp.config.size.maxHeight,
              color: memStore.color.app.text,
              background: memStore.color.app.background,
            }}>
              <CssBaseline />
              <ErrorBoundary>
                <React.Suspense fallback={ <LoadingScreen /> }>
                  <Router>
                    <AppRouter /*startRoute={ rxdbStore.app.getProp.watcher.route.pathname || "" }*/ />
                  </Router>
                </React.Suspense>
              </ErrorBoundary>
            </div>
          }

          {global.DEBUG_SHOW_DEBUGOBJECTPRETTY &&
              <DEBUGOBJECTPRETTY startHidden opacity={0.5}
                  style={{ zIndex: '98765', /*minHeight: 32,*/ maxHeight: "75%", overflow: "auto", textAlign: "left", position: "absolute", top: "auto", bottom: 0, width: "100%", }}

                  title={[
                    "DEBUG", ` v01 ${process.env.REACT_APP_APPVERSION} ${Math.floor(99*Math.random())}`,
                    " s:", `${"hallo"}`,
                    "]", ``,
                  ]}

                  titleColors={["white", "cyan", "yellow", "cyan", ]}

                  data={{
                    appVersion: process.env.REACT_APP_APPVERSION,
                    fingerprint: global.fingerprint.hash,
                    _1: "___________________________________________",
                    _2: "___________________________________________",
                    _3: "___________________________________________",
                    _4: "___________________________________________",
                  }}
              />
          }
      </React.Fragment>
    );
  }
};
