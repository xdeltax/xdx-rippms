import React from 'react';
//import { toJS } from 'mobx';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

//import tryFallback from "tools/tryFallback";

import store from 'store';

import AllInclusiveICON from '@material-ui/icons/AllInclusive';

// assets
import AppLogo from 'assets/applogo.svg';
import FacebookLogo from 'assets/facebook2.png';

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
  constructor(props) {
    super(props);
    // init facebook before first use of API. it is not allowed to init it async -> do it in constructor and not on button-click
    // attn.: if you forgot to setup REACT_APP_FB_APPID in .env the facebookAPI will fail silent but you get messages like: "FB.login() called before FB.init()""
    const initFBAPI = async () => {
      const result = await store.facebook.initFBAPI();
      global.log("RouteLogin:: constructor:: initFBAPI:: result:: ", result);
    }
    try { if (!store.facebook.isReady) initFBAPI().catch( (error) => {}) } catch (error) { }
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
          <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
            this.login();
          }}>
            <img width="25px" height="25px" src={FacebookLogo} alt="" style={{marginRight: 15,}} />LOGIN WITH FACEBOOK
          </Button>
        </div>

        <div>
          <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
            this.login({userid:"01fake"}, {});
          }} >
            FAKE-LOGIN 1
          </Button>

          <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
            this.login({userid:"01fake", servertoken:"01fake"}, {});
          }}>
            FAKE-LOGIN 2
          </Button>

          <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
            this.login({userid:"01fake", servertoken:"01fake"}, {email:"fake@fake.com", phonenumber:"00417998765"});
          }} startIcon={<AllInclusiveICON />} endIcon={<AllInclusiveICON />} >
            FAKE-LOGIN (no FB / no Server)
          </Button>
        </div>

        <div>
          <Button className={classes.button} style={{width:150,height:150}} variant="contained" color="primary" onClick={ async (event) => {
            // pixi-example will render pixi-container only if the pixi-route is called here
            // downside is that it will rerender evertime a route was changed
            history && history.push('/game/pixi');
          }}>
            <Typography className={classes.fontIndieItalic} align="center" noWrap style={{fontSize: 32, }}>PIXI v5</Typography>
          </Button>

          <Button className={classes.button} style={{width:150,height:150}} variant="contained" color="primary" onClick={ async (event) => {
            // phase explampe will render phaser-container hidden at app start and pause the game until this "route" is called
            // no rendering of a container(-route) here because container is already rendered in AppRouter on app-start
            // but hidden to keep the game-assets and running or paused in background. otherwise it would be destroyed and re-init on gui-change
            history && history.push('/game/phaser');
          }}>
            <Typography className={classes.fontIndieItalic} align="center" noWrap style={{fontSize: 32, }}>phaser</Typography>
          </Button>
        </div>

      </div>
    ) // of return
  } // of render


  login = async (fakeUser, fakeProfile) => {
    const { history, } = this.props;
    try {
      // attn.: if you forgot to setup REACT_APP_FB_APPID in .env the facebookAPI will fail silent but you get messages like: "FB.login() called before FB.init()""
      const res = await store.user.loginWithFacebook(fakeUser, fakeProfile);
      global.log("RouteLogin:: login:: result:: ", res)
    } catch (error) {
      global.log("RouteLogin:: login:: ERROR:: ", error.message);

      //todo: show error-modal

    } finally {
      // redirect router to "/" -> from there router will check if valid user and forward to login-route (again) or home-route
      history && history.push('/');
    }
  }

}))); // of class
