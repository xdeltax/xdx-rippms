import React from 'react';
//import { toJS } from 'mobx';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import OAuth from './OAuth'
//import tryFallback from "tools/tryFallback";

import store from 'store';

import AllInclusiveICON from '@material-ui/icons/AllInclusive';

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

  onAuthSuccess = async (socketid, provider, user) => {
  	global.log("OAuth:: Success:: Callback:: ", socketid, provider, user);

  	await store.user.doAuthLogin(user);
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
        color: store.system.colors.login.text,
        background: store.system.colors.login.background,
      }}>
        <div style={{ position: "relative", top: 0, height: "30vh", minHeight: "150px", backgroundColor:"transparent" }}>
          <Typography className={classes.fontIndieItalic} align="center" noWrap style={{fontSize: 72, }}>xdx</Typography>
          <img width="100%" height="100%" src={AppLogo} alt="" />
        </div>

        <div>
					<OAuth buttonText="bind with facebook" uid="" provider="facebook" providerLogo={FacebookLogo} server={global.serverURL} socket={store.socketio.socket} fingerprint={global.fingerprint} onAuthSuccess={this.onAuthSuccess} onAuthFailed={this.onAuthFailed} />
					<OAuth buttonText="bind with google" uid="" provider="google" providerLogo={GoogleLogo} server={global.serverURL} socket={store.socketio.socket} fingerprint={global.fingerprint} onAuthSuccess={this.onAuthSuccess} onAuthFailed={this.onAuthFailed} />
					<OAuth buttonText="fake1 with fb" uid="fake1" provider="facebook" providerLogo={FacebookLogo} server={global.serverURL} socket={store.socketio.socket} fingerprint={global.fingerprint} onAuthSuccess={this.onAuthSuccess} onAuthFailed={this.onAuthFailed} />
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
          <Button className={classes.button} variant="contained" color="primary" onClick={ async (event) => {
          	store.user.userid = "TEST";
          	store.user.servertoken = "TEST"
          }} startIcon={<AllInclusiveICON />} endIcon={<AllInclusiveICON />} >
          	TESTUSER
          </Button>

          <Button className={classes.button} variant="contained" color="primary" onClick={ async (event) => {
          	const userid = "66f57373e76612339caf72ee103c4a52db256481";
          	const servertoken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2lkIjoiNjZmNTczNzNlNzY2MTIzMzljYWY3MmVlMTAzYzRhNTJkYjI1NjQ4MSIsInB2ZCI6ImZhY2Vib29rIiwicGlkIjoiNTczOTI5Mzg5NzQyODYzIiwiaGFzaCI6IjJkZjYzYmQ5NWMwMTM5ZWEyN2MyZTJkMzlkYjgwYzA1OWNmN2U2OTEiLCJpYXQiOjE1NzcyOTM5NzMsImV4cCI6MTU3Nzg5ODc3MywiYXVkIjoibWVtYmVyIiwiaXNzIjoieGR4Iiwic3ViIjoieCIsImp0aSI6ImlkMSJ9.0pef9JFR-25iC0fi87vDW_n-K9HkuvxoVy9UblSxScc";
          	const {err, res} = store.user.getUser(userid, userid, servertoken);
          	global.log("TEST GET USER:: ", err, res);
          }} startIcon={<AllInclusiveICON />} endIcon={<AllInclusiveICON />} >
          	OWN USER
          </Button>

          <Button className={classes.button} variant="contained" color="primary" onClick={ async (event) => {
          	const targetuserid = "03d9a6fe7b0a19303d35b2257a46d77c3ccbd705";
          	const userid = "66f57373e76612339caf72ee103c4a52db256481";
          	const servertoken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2lkIjoiNjZmNTczNzNlNzY2MTIzMzljYWY3MmVlMTAzYzRhNTJkYjI1NjQ4MSIsInB2ZCI6ImZhY2Vib29rIiwicGlkIjoiNTczOTI5Mzg5NzQyODYzIiwiaGFzaCI6IjJkZjYzYmQ5NWMwMTM5ZWEyN2MyZTJkMzlkYjgwYzA1OWNmN2U2OTEiLCJpYXQiOjE1NzcyOTM5NzMsImV4cCI6MTU3Nzg5ODc3MywiYXVkIjoibWVtYmVyIiwiaXNzIjoieGR4Iiwic3ViIjoieCIsImp0aSI6ImlkMSJ9.0pef9JFR-25iC0fi87vDW_n-K9HkuvxoVy9UblSxScc";
          	const {err, res} = store.user.getUser(targetuserid, userid, servertoken);
          	global.log("TEST GET USER:: ", err, res);
          }} startIcon={<AllInclusiveICON />} endIcon={<AllInclusiveICON />} >
          	OTHER USER
          </Button>

          <Button className={classes.button} variant="contained" color="primary" onClick={ async (event) => {
          	const targetuserid = "03d9a6fe7b0a19303d35b2257a46d77c3ccbd705";
          	const userid = "66f57373e76612339caf72ee103c4a52db256481";
          	const servertoken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2lkIjoiNjZmNTczNzNlNzY2MTIzMzljYWY3MmVlMTAzYzRhNTJkYjI1NjQ4MSIsInB2ZCI6ImZhY2Vib29rIiwicGlkIjoiNTczOTI5Mzg5NzQyODYzIiwiaGFzaCI6IjJkZjYzYmQ5NWMwMTM5ZWEyN2MyZTJkMzlkYjgwYzA1OWNmN2U2OTEiLCJpYXQiOjE1NzcyOTM5NzMsImV4cCI6MTU3Nzg5ODc3MywiYXVkIjoibWVtYmVyIiwiaXNzIjoieGR4Iiwic3ViIjoieCIsImp0aSI6ImlkMSJ9.0pef9JFR-25iC0fi87vDW_n-K9HkuvxoVy9UblSxScc";
          	const {err, res} = store.user.getUsercard(userid, userid, servertoken);
          	global.log("TEST GET USERCARD:: ", err, res);
          }} startIcon={<AllInclusiveICON />} endIcon={<AllInclusiveICON />} >
          	USERCARD
          </Button>
	      </div>

      </div>
    ) // of return
  } // of render

  /*
    <div>
      <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
        this.login({userid:"01fake", servertoken:"01fake"}, {email:"fake@fake.com", phonenumber:"00417998765"});
      }} startIcon={<AllInclusiveICON />} endIcon={<AllInclusiveICON />} >
        FAKE-LOGIN (no FB / no Server)
      </Button>
    </div>

		<OAuth uid="" onAuthSuccess={this.onAuthSuccess} onAuthFailed={this.onAuthFailed} buttonText="login as guest" provider="local" server={global.serverURL} socket={store.socketio.socket} fingerprint={global.fingerprint}/>
	*/ 
}))); // of class
