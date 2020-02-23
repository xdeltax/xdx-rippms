import React from 'react';
//import { toJS } from 'mobx';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import OAuth from 'ui/components/auth/OAuth'
//import tryFallback from "tools/tryFallback";

import store from 'store';
import socketio from 'socket'; // socket

// assets
import AppLogo from 'assets/applogo.svg';
import FacebookLogo from 'assets/Facebook_Logo_(2019)_144x144.png';
import InstagramLogo from 'assets/Instagram_Logo_2016.svg';
import GoogleLogo from 'assets/Google_Logo_512x512.svg';

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
  state = {  }

  onAuthSuccess = async (socketid, provider, userObject) => {
  	global.log("OAuth:: Success:: Callback:: ", socketid, provider, userObject);

  	// userObject = {
  	//	 user: { ... }
  	//	 usercard: { ... }
  	// }
  	await store.user.doAuthLogin(userObject);
  }

  onAuthFailed = (socketid, provider, error) => {
  	global.log("OAuth:: Failed:: Callback:: ", socketid, provider, error);
  }

  render() {
    global.log("RouteLogin:: render:: ", this.props);
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
        color: store.appstate.colors.login.text,
        background: store.appstate.colors.login.background,
      }}>
        <div style={{ position: "relative", top: 0, height: "30vh", minHeight: "150px", backgroundColor:"transparent" }}>
          <Typography className={classes.fontIndieItalic} align="center" noWrap style={{fontSize: 72, }}>xdx</Typography>
          <img width="100%" height="100%" src={AppLogo} alt="" />
        </div>

        <div>
					<OAuth buttonText="bind with facebook" uid="" provider="facebook" providerLogo={FacebookLogo} server={global.serverURL} socket={socketio.socket} fingerprint={global.fingerprint} onAuthSuccess={this.onAuthSuccess} onAuthFailed={this.onAuthFailed} />
					<OAuth buttonText="bind with google" uid="" provider="google" providerLogo={GoogleLogo} server={global.serverURL} socket={socketio.socket} fingerprint={global.fingerprint} onAuthSuccess={this.onAuthSuccess} onAuthFailed={this.onAuthFailed} />
					<OAuth buttonText="fake1 with fb" uid="fake1" provider="facebook" providerLogo={FacebookLogo} server={global.serverURL} socket={socketio.socket} fingerprint={global.fingerprint} onAuthSuccess={this.onAuthSuccess} onAuthFailed={this.onAuthFailed} />
          <OAuth buttonText="fake1999 with fb" uid="fake1999" provider="facebook" providerLogo={FacebookLogo} server={global.serverURL} socket={socketio.socket} fingerprint={global.fingerprint} onAuthSuccess={this.onAuthSuccess} onAuthFailed={this.onAuthFailed} />
				</div>


        <div>
          <Button className={classes.button} style={{width:150,height:150}} variant="contained" color="primary" onClick={ async (event) => {
            // pixi-example will render pixi-container only if the pixi-route is called here
            // downside is that it will rerender evertime a route was changed
            history && history.push('/game/pixi');
          }}>
            <Typography className={classes.fontIndieItalic} align="center" noWrap style={{fontSize: 32, }}>PIXI v5</Typography>
          </Button>

          <Button className={classes.button} style={{width:150, height:150}} variant="contained" color="primary" onClick={ async (event) => {
            // phase explampe will render phaser-container hidden at app start and pause the game until this "route" is called
            // no rendering of a container(-route) here because container is already rendered in AppRouter on app-start
            // but hidden to keep the game-assets and running or paused in background. otherwise it would be destroyed and re-init on gui-change
            history && history.push('/game/phaser');
          }}>
            <Typography className={classes.fontIndieItalic} align="center" noWrap style={{fontSize: 32, }}>phaser</Typography>
          </Button>
        </div>


          <Button className={classes.button} variant="contained" color="primary" onClick={ async (event) => {
					  // ===============================================
					  // load store-data from server-database
					  // ===============================================
					  store.user.userid = "66f57373e76612339caf72ee103c4a52db256481";
					  store.user.servertoken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2lkIjoiNjZmNTczNzNlNzY2MTIzMzljYWY3MmVlMTAzYzRhNTJkYjI1NjQ4MSIsInB2ZCI6ImZhY2Vib29rIiwicGlkIjoiNTczOTI5Mzg5NzQyODYzIiwiaGFzaCI6IjJkZjYzYmQ5NWMwMTM5ZWEyN2MyZTJkMzlkYjgwYzA1OWNmN2U2OTEiLCJpYXQiOjE1Nzc2NzQyMjgsImV4cCI6MTU3ODI3OTAyOCwiYXVkIjoibWVtYmVyIiwiaXNzIjoieGR4Iiwic3ViIjoieCIsImp0aSI6ImlkMSJ9.tOja7fzkxSZzrDoqNplHUQ0wWGgR4EV5NXvRJ2_97s0";
				    const resObj = await store.user.getUserStoreFromServerANDMergeWithStore();
				    global.log("getUserStoreFromServerANDMergeWithStore:: resObj:: ", resObj);
          }} >
          	GETUSERSTORE
          </Button>


      </div>
    ) // of return
  } // of render
}))); // of class
