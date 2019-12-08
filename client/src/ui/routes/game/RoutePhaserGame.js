import React from 'react';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';

import Toolbar from '@material-ui/core/Toolbar';

import HeaderNavigationToolbar from "ui/components/header/HeaderNavigationToolbar";

import store from 'store';

const styles = theme => ({
  root: {

  },
});

export default withRouter( withStyles(styles)( observer( class extends React.Component {
  state = {
  }
  render() {
    global.log("RoutePhaserGame:: render:: ", this.props);
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
        color: store.system.colors.auth.text,
        background: store.system.colors.auth.background,
      }}>
        <HeaderNavigationToolbar label="Phaser 3" hide={!store.system.app.header.visible}
          //backButtonIcon={<LogoutICON style={{ transform: "scaleX(-1)" }} />}
          onBackButtonClick={ () => history.goBack() }
        />
        {store.system.app.header.visible && (<Toolbar disableGutters variant="dense" />) /* extra padding for content below HeaderNavigationToolbar */ }

        <div>
          PHASER
        </div>

        {store.system.app.bottomNavigation.visible && (<Toolbar disableGutters style={{ marginBottom: 25, }} />) /* extra padding for content below HeaderNavigationToolbar */ }
      </div>
    );
  }
})));
