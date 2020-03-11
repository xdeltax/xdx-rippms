import React from 'react';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';

import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';

import HeaderNavigationToolbar from "ui/components/header/HeaderNavigationToolbar";

//import tryFallback from "tools/tryFallback";

import store from 'store';

const styles = theme => ({
  root: {

  },
  button: {
    margin: 5,
  },
  fontIndieItalic: {
    fontFamily: 'Indie Flower',
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    width:"100%",
    textShadow: "0px 2px 1px rgba(0,0,0,0.3)",
    fontStyle: "italic",
    fontWeight: 900,
    color: "rgba(255,255,255,1.0)"
  },
});

export default ( withStyles(styles)( observer( class extends React.Component {
  state = {
  }
  render() {
    global.log("RouteAccount:: render:: ", this.props);
    const {
      classes,  // withStyles(styles)
      history,  // router:: history: {length: 50, action: "POP", location: {…}, createHref: ƒ, push: ƒ, …} -> router-history::  history.push('/dashboard/users/1');
      //location, // router:: location: {pathname: "/login", search: "", hash: "", state: undefined, key: "whjdry"}
      //match,    // router:: match: {path: "/login", url: "/login", isExact: true, params: {…}}
    } = this.props;

    return (
      <div className={classes.root} style={{
        position: "relative",
        overflow: "auto",
        height: "100%",
        width: "100%",
        color: store.appState.colors.auth.text,
        background: store.appState.colors.auth.background,
      }}>
        <HeaderNavigationToolbar label="Account" hide={!store.appState.app.header.visible}
          //backButtonIcon={<LogoutICON style={{ transform: "scaleX(-1)" }} />}
          onBackButtonClick={ () => history.goBack() }
        />
        {store.appState.app.header.visible && (<Toolbar disableGutters variant="dense" />) /* extra padding for content below HeaderNavigationToolbar */ }

        <div>
          <Button color="primary" variant="outlined" onClick={ (event) => {
              event.preventDefault();
              history && history.push('/logout');
            }}
            style={{margin: 10, minWidth: "30%"}}
          >
            Logout
          </Button>
        </div>

        {store.appState.app.bottomNavigation.visible && (<Toolbar disableGutters style={{ marginBottom: 25, }} />) /* extra padding for content below HeaderNavigationToolbar */ }
      </div>
    );
  }
})));
