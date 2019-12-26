import React from 'react';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';
import {Route, Redirect, Switch, withRouter, } from 'react-router-dom';

import 'typeface-roboto'; // "Roboto"
import 'typeface-indie-flower'; // fontFamily: 'Indie Flower'
import 'typeface-rock-salt'; // fontFamily: 'Rock Salt'

import Modal from '@material-ui/core/Modal';
import Fade from '@material-ui/core/Fade';

import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowDownICON from '@material-ui/icons/KeyboardArrowDown';

//import tryFallback from "tools/tryFallback";

import ScrollToTop from "ui/components/helpers/ScrollToTop";

import BottomNavigation from 'ui/components/bottom/BottomNavigation';

import RouteNoMatch from "ui/routes/RouteNoMatch";

// unprotected routes -> no authentication needed
import RouteLogin from "ui/routes/login/RouteLogin";
import RouteRegister from "ui/routes/login/RouteRegister";

import RoutePixiGame from "ui/routes/game/RoutePixiGame";

// protected routes -> access needs authentication
import AuthRouteLogout from "ui/routes/auth/RouteLogout";
import AuthRouteHome from "ui/routes/auth/RouteHome";
import AuthRouteAccount from "ui/routes/auth/RouteAccount";

import ReactContainerPhaserGame from 'ui/components/game/ReactContainerPhaserGame';

import { updateRouteLocation } from "watchers/onRouteLocationChange";
import store from 'store'; // mobx-store


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

    // REDIRECT TO startRoute (if present)
    props.startRoute && global.log("AppRouter:: constructor:: STARTROUTE:: ", props.startRoute, );
    props.startRoute && props.history && (props.history.location.pathname !== props.startRoute) && props.history.push(props.startRoute);
  }

  getSnapshotBeforeUpdate(prevProps, prevState) { // called right before every render
    updateRouteLocation(this.props.location.pathname, prevProps.location.pathname );
    return null; // return snapshot
  }

  componentDidUpdate(prevProps, prevState, snapshot) { // only called on updates (not called on first launch)
    // use snapshot
  }

  render() {
    const {
      classes,  // withStyles(styles)
      //history, // withRouter()
      location,
      //startRoute, // used in constructor to set initial route
    } = this.props;

    const RenderAGetMyHiddenToolbarBackArrowDownIconButton = () => (
      // display a button to click -> unhide top-toolbar (and navigation if auth-path)
      <div style={{ position: "fixed", right: 0, top: 0, }}>
        <IconButton color="inherit" style={{ flexGrow: 0, }}  onClick={(event) => {
          store.set("system.app.header.visible", true);
          store.set("system.app.bottomNavigation.visible", true);
        }}>
          <KeyboardArrowDownICON />
        </IconButton>
      </div>
    );

    const phaserGameVisible = Boolean(location.pathname === "/game/phaser") /*store.system.app.game.visible*/
    //const pixiGameVisible = Boolean(location.pathname === "/game/pixi") /*store.system.app.game.visible*/

    global.log("AppRouter:: render:: location.pathname:: ", location.pathname, );

    return (
      <React.Fragment>
        <div id="routecontainer" className={classes.root} style={{
          position: "relative",
          height: "100%",
          width: "100%",
          textAlign: "center",
          color: store.system.colors.app.text,
          background: store.system.colors.app.background,
        }}>
          <ScrollToTop />

          <Switch>
            <Route exact path="/"             render={ (routeProps) => store.isAuthenticated ? <Redirect to="/auth/home" /> : <Redirect to="/login" /> } />

            <Route exact path="/login"        render={ (routeProps) => !store.user.isValid ? (<RouteLogin {...routeProps } />) : !store.usercard.isValid ? <Redirect to="/register" /> : <Redirect to="/auth/home" /> } />
            <Route exact path="/register"     render={ (routeProps) => !store.user.isValid ? (<Redirect to="/login" />) : store.usercard.isValid ? (<Redirect to="/" />) : (<RouteRegister {...routeProps } />) } />
            <Route exact path="/logout"       render={ (routeProps) => (<AuthRouteLogout {...routeProps } />) } />
            <Route exact path="/game/pixi"    render={ (routeProps) => (<RoutePixiGame {...routeProps } />) } />
            <Route exact path="/game/phaser"  render={ (routeProps) => (null/*<RoutePhaserGame {...routeProps } />*/)} />

            <Route exact path="/auth/home"    render={ (routeProps) => store.isAuthenticated ? <AuthRouteHome {...routeProps } /> : <Redirect to="/login" /> } />
            <Route exact path="/auth/account" render={ (routeProps) => store.isAuthenticated ? <AuthRouteAccount {...routeProps } /> : <Redirect to="/login" /> } />

            <Route component={RouteNoMatch} />
          </Switch>
        </div>

        {!store.system.app.header.visible && <RenderAGetMyHiddenToolbarBackArrowDownIconButton />}
        {store.isAuthenticated && <BottomNavigation hide={!store.system.app.bottomNavigation.visible} /> }

        <Modal id="phasergame" keepMounted // modal container for the game (stays mounted all the time)
          open={phaserGameVisible} disableEscapeKeyDown={true} disablePortal={true} disableScrollLock={true} hideBackdrop={true}
          style={{ outline: 0, border: 0, backgroundColor: "transparent", }}
        >
          <Fade timeout={0} mountOnEnter exit={true} in={phaserGameVisible} direction={phaserGameVisible ? "up" : "right"} >
					 <React.Fragment>
              <ReactContainerPhaserGame gameVisible={phaserGameVisible} style={{ backgroundColor: "transparent", padding:0, margin:0, height:"100%", }} />
              {!store.system.app.header.visible && <RenderAGetMyHiddenToolbarBackArrowDownIconButton />}
              {store.isAuthenticated && <BottomNavigation hide={!store.system.app.bottomNavigation.visible} /> }
 						</React.Fragment>
          </Fade>
        </Modal>
      </React.Fragment>
    ); // of return
  }; // of render
}))); // of class

/*
<Route path="/:tab(sessions)" component={RouteLogin} exact={true} />
<Route path="/:tab(sessions)/:id" component={RouteLogin} />
<Route path="/:tab(speakers)" component={RouteRegister} exact={true} />
<Route path='/facebook' component={() => { window.location.href = `${global.serverURL}/facebook.io?socketid=${store.socketio.socket.id}`; return null; }}/>

*/