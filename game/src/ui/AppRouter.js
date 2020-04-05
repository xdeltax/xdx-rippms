import React from 'react';
import { toJS }  from 'mobx';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';
import {Route, Redirect, Switch, withRouter, } from 'react-router-dom';
//import { useHistory, useLocation, } from "react-router-dom";

import Modal from '@material-ui/core/Modal';
import Fade from '@material-ui/core/Fade';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowDownICON from '@material-ui/icons/KeyboardArrowDown';

import ScrollToTop from "ui/components/helpers/ScrollToTop";

//import BottomNavigation from 'ui/components/bottom/BottomNavigation';

// unprotected routes -> no authentication needed
import FreeRouteNoMatch from "ui/routes/free/NoMatch.js";
import FreeRouteStartScreen from "ui/routes/free/StartScreen.js";
import FreeRouteGame from 'ui/routes/free/GameContainer.js';

// protected routes -> access needs authentication
import AuthRouteLogout from "ui/routes/auth/Logout.js";
import AuthRouteHome from "ui/routes/auth/Home.js";
//import AuthRouteAccount from "ui/routes/protected/RouteAccount";

//import { updateRouteLocation } from "watchers/onRouteLocationChange";

import memStore  from 'memStore'; // memory-store (non-persistent, non-reactive)

//============================================================================//
import debuglog from "debug/consolelog"; const clog = debuglog("AppRouter.js");
//============================================================================//

const styles = theme => ({
  root: {
  },
  expandIcon: {
    transition: theme.transitions.create('transform', {duration: theme.transitions.duration.shortest}),
    '&:hover': {
      // Disable the hover effect for the IconButton,
      // because a hover effect should apply to the entire Expand button and
      // not only to the IconButton.
      backgroundColor: 'transparent'
    },
    transform: 'rotate(0deg)',
      '&$expanded': {
        transform: 'rotate(180deg)'
      },
  },
  // This is required for the '&$selected' selector to work
  expanded: {},
});

export default withRouter( withStyles(styles)( observer( class extends React.Component {
  state = {
  }

  constructor(props) {
    super(props);
    const { startRoute, history } = props;
    // REDIRECT TO startRoute (if present)
    startRoute && clog("constructor:: STARTROUTE:: ", toJS(startRoute), startRoute.pathname, history.location.pathname, )
    startRoute && props.history && (history.location.pathname !== startRoute.pathname) && history.push(startRoute.pathname);
  }

  getSnapshotBeforeUpdate(prevProps, prevState) { // called right before every render
    //updateRouteLocation(this.props.location.pathname, prevProps.location.pathname );

    return null; // return snapshot
  }

  componentDidUpdate(prevProps, prevState, snapshot) { // only called on updates (not called on first launch)
    // use getSnapshotBeforeUpdate!!!
  }

  render() {
    const {
      classes,  // withStyles(styles)
      //history, // withRouter()
      location,
      //startRoute, // used in constructor to set initial route
    } = this.props;

    clog("### render:: ", this.props, location.pathname);

    const isAuthenticated = false;
    const isValidProfile  = true;
    const phaserGameVisible = Boolean(location.pathname === "/game/phaser");

    return (
      <React.Fragment>
        <div id="routecontainer" className={classes.root} style={{
          position: "relative",
          height: "100%",
          width: "100%",
          textAlign: "center",
          color: memStore.color.app.text,
          background: memStore.color.app.background,
        }}>
          <ScrollToTop />
          <Switch>
            <Route exact path="/"         render={routeProps => !isAuthenticated ? <FreeRouteStartScreen {...routeProps}/> : <Redirect to="/auth/home"/>}/>

            <Route exact path="/start"    render={routeProps => !isAuthenticated ? <FreeRouteStartScreen {...routeProps}/> : !isValidProfile ? <Redirect to="/register"/> : <Redirect to="/auth/home"/>}/>
            <Route exact path="/register" render={routeProps => <FreeRouteNoMatch/>}/>
            <Route exact path="/game"     render={routeProps => <FreeRouteGame {...routeProps}/>}/>
            <Route exact path="/home"     render={routeProps => <AuthRouteHome {...routeProps}/>}/>
            <Route exact path="/logout"   render={routeProps => <AuthRouteLogout {...routeProps}/>}/>

            <Route exact path="/auth/home" render={routeProps => isAuthenticated ? <AuthRouteHome {...routeProps}/> : <Redirect to="/start"/>}/>

            <Route component={FreeRouteNoMatch}/>
          </Switch>
        </div>
      </React.Fragment>
    ); // of return
  }; // of render
}))); // of class
