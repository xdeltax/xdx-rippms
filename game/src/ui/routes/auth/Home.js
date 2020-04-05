import React from 'react';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';

import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import LogoutICON from '@material-ui/icons/ExitToApp';
import AllInclusiveICON from '@material-ui/icons/AllInclusive';

import memStore  from 'memStore'; // memory-store (non-persistent, non-reactive)

//============================================================================//
import debuglog from "debug/consolelog"; const clog = debuglog("Home.js");
//============================================================================//

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
    const {
      classes,  // withStyles(styles)
      history,  // router:: history: {length: 50, action: "POP", location: {…}, createHref: ƒ, push: ƒ, …} -> router-history::  history.push('/dashboard/users/1');
      //location, // router:: location: {pathname: "/login", search: "", hash: "", state: undefined, key: "whjdry"}
      //match,    // router:: match: {path: "/login", url: "/login", isExact: true, params: {…}}
    } = this.props;

    clog("### render:: ", this.props);

    return (
      <div className={classes.root} style={{
        position: "relative",
        overflow: "auto",
        height: "100%",
        width: "100%",
        color: memStore.color.auth.text,
        background: memStore.color.auth.background,
      }}>

        <div>
          <Button color="primary" variant="contained"
            style={{ margin: 5, width: 150, height: 150, background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', }}
            onClick={ async (event) => {
            // implementation variant 1:
            // pixi-example will render pixi-container only if the pixi-route is called here
            // downside is that it will reload and rerender evertime a route was changed
            history && history.push('/game/pixi');
          }}>
            <Typography className={classes.fontIndieItalic} align="center" noWrap style={{fontSize: 32, }}>PIXI v5</Typography>
          </Button>

          <Button color="primary" variant="contained"
            style={{ width: 150, height: 150, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', }}
            onClick={ async (event) => {
            // implementation variant 2:
            // phaser-example will render phaser-container hidden at app start (in AppRouter) and pause the game until this "route" is called
            // no rendering of a container(-route) here because container is already rendered in AppRouter on app-start
            // but hidden to keep the game-assets and running or paused in background. otherwise it would be destroyed and re-init on gui-change
            history && history.push('/game/phaser');
          }}>
            <Typography className={classes.fontIndieItalic} align="center" noWrap style={{fontSize: 32, }}>PHASER 3</Typography>
          </Button>
        </div>

        <Button variant="outlined" onClick={()=> { history.push("/logout") }}>logout</Button>

      </div>
    );
  }
})));
