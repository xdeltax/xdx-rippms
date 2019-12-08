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
import RoutePhaserGame from "ui/routes/game/RoutePhaserGame";

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
    global.log("AppRouter:: render:: ", this.props, store.user.isAuthenticated, store.user.isValidUser, store.user.isValidUserProfile, )
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

    return (
      <>
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
            <Route exact path="/"             render={ (routeProps) =>
              store.user.isAuthenticated ? <Redirect to="/auth/home" /> : <Redirect to="/login" />
            } />

            <Route exact path="/login"        render={ (routeProps) => !store.user.isValidUser ? (<RouteLogin {...routeProps } />) : !store.user.isValidUserProfile ? <Redirect to="/register" /> : <Redirect to="/auth/home" /> } />
            <Route exact path="/register"     render={ (routeProps) => !store.user.isValidUser ? (<Redirect to="/login" />) : store.user.isValidUserProfile ? (<Redirect to="/" />) : (<RouteRegister {...routeProps } />) } />
            <Route exact path="/logout"       render={ (routeProps) => (<AuthRouteLogout {...routeProps } />) } />
            <Route exact path="/game/pixi"    render={ (routeProps) => (<RoutePixiGame {...routeProps } />) } />
            <Route exact path="/game/phaser"  render={ (routeProps) => (<RoutePhaserGame {...routeProps } />)} />

            <Route exact path="/auth/home"    render={ (routeProps) => store.user.isAuthenticated ? <AuthRouteHome {...routeProps } /> : <Redirect to="/login" /> } />
            <Route exact path="/auth/account" render={ (routeProps) => store.user.isAuthenticated ? <AuthRouteAccount {...routeProps } /> : <Redirect to="/login" /> } />

            <Route component={RouteNoMatch} />
          </Switch>
        </div>

        {!store.system.app.header.visible && <RenderAGetMyHiddenToolbarBackArrowDownIconButton />}
        {store.user.isAuthenticated && <BottomNavigation hide={!store.system.app.bottomNavigation.visible} /> }

        <Modal id="phasergame" keepMounted // modal container for the game (stays mounted all the time)
          open={phaserGameVisible} disableEscapeKeyDown={true} disablePortal={true} disableScrollLock={true} hideBackdrop={true}
          style={{ outline: 0, border: 0, backgroundColor: "transparent", }}
        >
          <Fade timeout={2500} mountOnEnter exit={true} in={phaserGameVisible} direction={phaserGameVisible ? "up" : "right"} >
            <div style={{ height:"100%", width: "100%", }} >
              <ReactContainerPhaserGame gameVisible={phaserGameVisible} style={{ backgroundColor: "transparent", padding:0, margin:0, }} />
              {/* PHASER-GAME::
                  we need to create / render the game container here (at "root"-level of the app).
                  -> init the game here -> otherwise component will restart (and reload all assets) on every UI-change
                  -> "mountOnEnter={true}" -> phaser init-sequence start at first show of component (not at app-start)
                  -> "mountOnEnter={false}" -> phaser init-sequence start at app-start
               */
              }
              {!store.system.app.header.visible && <RenderAGetMyHiddenToolbarBackArrowDownIconButton />}
              {store.user.isAuthenticated && <BottomNavigation hide={!store.system.app.bottomNavigation.visible} /> }
            </div>
          </Fade>
        </Modal>
      </>
    ); // of return
  }; // of render
}))); // of class

/*
<Route path="/:tab(sessions)" component={RouteLogin} exact={true} />
<Route path="/:tab(sessions)/:id" component={RouteLogin} />
<Route path="/:tab(speakers)" component={RouteRegister} exact={true} />
*/