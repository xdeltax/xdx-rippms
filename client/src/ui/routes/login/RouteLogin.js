import React from 'react';
import { toJS } from 'mobx';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import OAuth from 'ui/components/auth/OAuth'
//import tryFallback from "tools/tryFallback";

import socketio from 'api/socket'; // socket

import store from 'store';
import rxdbStore from 'rxdbStore'; // rxdb-database

import * as localDatabase from "localDatabase/index.js";
import * as serverAPI from "api/serverAPI.js";

// assets
import AppLogo from 'assets/applogo.svg';
import FacebookLogo from 'assets/Facebook_Logo_(2019)_144x144.png';
//import InstagramLogo from 'assets/Instagram_Logo_2016.svg';
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

  onAuthSuccess = async (socketid, provider, userdataFromServer) => {
  	//global.log("OAuth:: Success:: Callback:: ", socketid, provider, userObject);
    // userdataFromServer = {
    //   status: "login with provider",
    //   provider: provider,
    //   socketid: socketid,    //
  	//	 user: { ... }
    //   usercard ...
  	// }
    await rxdbStore.user.doAuthLogin(socketid, provider, null, userdataFromServer);
  }

  onAuthFailed = async (socketid, provider, error) => {
  	//global.log("OAuth:: Failed:: Callback:: ", socketid, provider, error);
    await rxdbStore.user.doAuthLogin(socketid, provider, error, null);
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
        color: store.appState.colors.login.text,
        background: store.appState.colors.login.background,
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

        <div>
          <Button variant="outlined" onClick={()=> localDatabase.saveAppData(true) }>saveToPersistentDatabase</Button>
          <Button variant="outlined" onClick={()=> { store.appActions.showSpinner("test the spinner", 5000) }}>show Spinner</Button>

          <Button variant="outlined" onClick={()=> serverAPI.testServerResponse("hello from button") }>test server response</Button>

          <Button variant="outlined" onClick={async () => {
            const x = await rxdbStore.user.collection.findOne().exec();
            global.log("DATABASE DUMP:: ", x, rxdbStore, rxdbStore.user, await rxdbStore.user.collection2json());
          }}>rxdb dump database</Button>

          <Button variant="outlined" onClick={async () => {
            const c = await rxdbStore.user.count();
            const x = await rxdbStore.user.mobx2json;
            const y = await rxdbStore.user.collection2json();
            const ydocs = y.docs;
            global.log("GETGETGET:: ", toJS(x), y, ydocs, c);
          }}>get</Button>

          <Button variant="outlined" onClick={async () => {
            const rnd = global.random(100);
            global.log("SET:: ", rnd)
            const x = await rxdbStore.user.setProp("updatedAt", rnd);

            //const x = await rxdbStore.user.setProp("card.test2", global.random(100) );
            //global.log("COUNT:: ", await rxdbStore.user.count());
            //global.log("x", x, rxdbStore.user.getProp.updatedAt)

            //const xx = await rxdbStore.user.setProp("card.test", global.random(100) );
            //global.log("xx", xx, rxdbStore.user.mobx2json)
          }}>set</Button>

          <Button variant="outlined" onClick={async () => {
            const x = await rxdbStore.user.mobx;
            global.log("XXXXXXXXXXXXX", toJS(x))
          }}>{rxdbStore.user.getProp.updatedAt || "XXX"}</Button>
        </div>

      </div>
    ) // of return
  } // of render
}))); // of class
