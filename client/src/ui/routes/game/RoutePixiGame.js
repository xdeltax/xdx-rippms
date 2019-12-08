import React from 'react';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';

import HeaderNavigationToolbar from "ui/components/header/HeaderNavigationToolbar";

import ReactContainerPixiGame from 'ui/components/game/ReactContainerPixiGame';

import store from 'store';

const styles = theme => ({
  root: {
  },
});

export default withRouter( withStyles(styles)( observer( class extends React.Component {
  state = {
  }
  componentDidMount = async () => {

  }
  render() {
    global.log("RoutePhaserGame:: render:: ", this.props);
    const {
      classes,  // withStyles(styles)
      history,  // history: {length: 50, action: "POP", location: {…}, createHref: ƒ, push: ƒ, …} -> router-history::  history.push('/dashboard/users/1');
      //location, // location: {pathname: "/login", search: "", hash: "", state: undefined, key: "whjdry"}
      //match,    // match: {path: "/login", url: "/login", isExact: true, params: {…}}
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
        <HeaderNavigationToolbar label="Pixi.JS v5" hide={!store.system.app.header.visible}
          onBackButtonClick={ () => { if (history.length > 1) history.goBack(); else history.push("/"); }}
          //noRespawnButton={!store.system.app.game.visible}
        />
        <ReactContainerPixiGame store={store} />
      </div>
    );
  }
})));
