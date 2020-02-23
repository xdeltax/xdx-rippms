import React from 'react';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';

import { IonActionSheet, IonModal, IonButton } from '@ionic/react';

import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import LogoutICON from '@material-ui/icons/ExitToApp';
import AllInclusiveICON from '@material-ui/icons/AllInclusive';

import HeaderNavigationToolbar from "ui/components/header/HeaderNavigationToolbar";

import { saveToPersistentDatabase} from "database/persistentDB.js";

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
    global.log("RouteHome:: render:: ", this.props);
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
        color: store.appstate.colors.auth.text,
        background: store.appstate.colors.auth.background,
      }}>
        <HeaderNavigationToolbar label="Home" hide={!store.appstate.app.header.visible}
          backButtonIcon={<LogoutICON style={{ transform: "scaleX(-1)" }} />}
          onBackButtonClick={ () => history.push("/logout") }
        />
        {store.appstate.app.header.visible && (<Toolbar disableGutters variant="dense" />) /* extra padding for content below HeaderNavigationToolbar */ }

        <Alert />
        <Modal />

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

        <Button variant="outlined" onClick={()=> saveToPersistentDatabase(true) }>saveToPersistentDatabase</Button>
        <Button variant="outlined" onClick={()=> { store.showSpinner("test the spinner", 5000) }}>show Spinner</Button>

        <Button variant="outlined" onClick={()=> { history.push("/logout") }}>logout</Button>

        <div>
          <Button className={classes.button} variant="contained" color="primary" onClick={ async (event) => {
          	store.user.userid = "TEST";
          	store.user.servertoken = "TEST"
          }} startIcon={<AllInclusiveICON />} endIcon={<AllInclusiveICON />} >
          	TESTUSER
          </Button>

          <Button className={classes.button} variant="contained" color="primary" onClick={ async (event) => {
          	//const userid = "66f57373e76612339caf72ee103c4a52db256481";
          	//const servertoken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2lkIjoiNjZmNTczNzNlNzY2MTIzMzljYWY3MmVlMTAzYzRhNTJkYjI1NjQ4MSIsInB2ZCI6ImZhY2Vib29rIiwicGlkIjoiNTczOTI5Mzg5NzQyODYzIiwiaGFzaCI6IjJkZjYzYmQ5NWMwMTM5ZWEyN2MyZTJkMzlkYjgwYzA1OWNmN2U2OTEiLCJpYXQiOjE1NzcyOTM5NzMsImV4cCI6MTU3Nzg5ODc3MywiYXVkIjoibWVtYmVyIiwiaXNzIjoieGR4Iiwic3ViIjoieCIsImp0aSI6ImlkMSJ9.0pef9JFR-25iC0fi87vDW_n-K9HkuvxoVy9UblSxScc";
          	const x = await store.user.getUserFromServer(store.user.userid);
          	global.log("TEST GET OWN USER:: ", x);
          }} startIcon={<AllInclusiveICON />} endIcon={<AllInclusiveICON />} >
          	GET OWN USER
          </Button>

          <Button className={classes.button} variant="contained" color="primary" onClick={ async (event) => {
          	const userid = "66f57373e76612339caf72ee103c4a52db256481";
          	const servertoken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2lkIjoiNjZmNTczNzNlNzY2MTIzMzljYWY3MmVlMTAzYzRhNTJkYjI1NjQ4MSIsInB2ZCI6ImZhY2Vib29rIiwicGlkIjoiNTczOTI5Mzg5NzQyODYzIiwiaGFzaCI6IjJkZjYzYmQ5NWMwMTM5ZWEyN2MyZTJkMzlkYjgwYzA1OWNmN2U2OTEiLCJpYXQiOjE1NzcyOTM5NzMsImV4cCI6MTU3Nzg5ODc3MywiYXVkIjoibWVtYmVyIiwiaXNzIjoieGR4Iiwic3ViIjoieCIsImp0aSI6ImlkMSJ9.0pef9JFR-25iC0fi87vDW_n-K9HkuvxoVy9UblSxScc";
          	const newProps = {
          		name: "testuser",
          		//phonenumber: "123456",
          		//email: "test@mail.com",
          		//forcenew: new Data()/1000,
          	}
          	const x = await store.user.updateOwnUserPropsToServer(newProps);
          	global.log("TEST UPDATE OWN USER:: ", x);
          }} startIcon={<AllInclusiveICON />} endIcon={<AllInclusiveICON />} >
          	UPDATE OWN USER
          </Button>

          <Button className={classes.button} variant="contained" color="primary" onClick={ async (event) => {
          	const userid = "66f57373e76612339caf72ee103c4a52db256481";
          	const servertoken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2lkIjoiNjZmNTczNzNlNzY2MTIzMzljYWY3MmVlMTAzYzRhNTJkYjI1NjQ4MSIsInB2ZCI6ImZhY2Vib29rIiwicGlkIjoiNTczOTI5Mzg5NzQyODYzIiwiaGFzaCI6IjJkZjYzYmQ5NWMwMTM5ZWEyN2MyZTJkMzlkYjgwYzA1OWNmN2U2OTEiLCJpYXQiOjE1NzcyOTM5NzMsImV4cCI6MTU3Nzg5ODc3MywiYXVkIjoibWVtYmVyIiwiaXNzIjoieGR4Iiwic3ViIjoieCIsImp0aSI6ImlkMSJ9.0pef9JFR-25iC0fi87vDW_n-K9HkuvxoVy9UblSxScc";
          	const newProps = {
          		name: "testuser",
          		phonenumber: "123456",
          		//email: "test@mail.com",
          		//forcenew: new Data()/1000,
          	}
          	const x = await store.user.updateOwnUsercardPropsToServer(newProps);
          	global.log("TEST UPDATE OWN USERCARD:: ", x);
          }} startIcon={<AllInclusiveICON />} endIcon={<AllInclusiveICON />} >
          	UPDATE OWN USERCARD
          </Button>

          <Button className={classes.button} variant="contained" color="primary" onClick={ async (event) => {
          	const targetuserid = "03d9a6fe7b0a19303d35b2257a46d77c3ccbd705";
          	const userid = "66f57373e76612339caf72ee103c4a52db256481";
          	const servertoken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2lkIjoiNjZmNTczNzNlNzY2MTIzMzljYWY3MmVlMTAzYzRhNTJkYjI1NjQ4MSIsInB2ZCI6ImZhY2Vib29rIiwicGlkIjoiNTczOTI5Mzg5NzQyODYzIiwiaGFzaCI6IjJkZjYzYmQ5NWMwMTM5ZWEyN2MyZTJkMzlkYjgwYzA1OWNmN2U2OTEiLCJpYXQiOjE1NzcyOTM5NzMsImV4cCI6MTU3Nzg5ODc3MywiYXVkIjoibWVtYmVyIiwiaXNzIjoieGR4Iiwic3ViIjoieCIsImp0aSI6ImlkMSJ9.0pef9JFR-25iC0fi87vDW_n-K9HkuvxoVy9UblSxScc";
          	const {err, res} = store.user.getUserFromServer(targetuserid                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            );
          	global.log("TEST GET OTHER USER:: ", err, res);
          }} startIcon={<AllInclusiveICON />} endIcon={<AllInclusiveICON />} >
          	GET OTHER USER
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

          <Button className={classes.button} variant="contained" color="primary" onClick={ async (event) => {
          	store.user.servertoken = "FAKEATOKEN3452938495823498574875834.347587348257.3457834725837498";
          	global.log("TEST CHANGE TOKEN:: ", store.user.servertoken);
          }} startIcon={<AllInclusiveICON />} endIcon={<AllInclusiveICON />} >
          	SERVERTOKEN
          </Button>

          <Button className={classes.button} variant="contained" color="primary" onClick={ async (event) => {
          	global.log("*** STORE USER:: ", store.user.get_all());
          }} startIcon={<AllInclusiveICON />} endIcon={<AllInclusiveICON />} >
          	STORE/USER
          </Button>
	      </div>

        {store.appstate.app.bottomNavigation.visible && (<Toolbar disableGutters style={{ marginBottom: 25, }} />) /* extra padding for content below HeaderNavigationToolbar */ }
      </div>
    );
  }
})));

const Alert = () => {
  const [show, setShow] = React.useState(false);
  return (
    <React.Fragment>
      <IonActionSheet
        isOpen={show}
        onDidDismiss={() => setShow(false)}
        buttons={[
          { text: 'Delete', role: 'destructive', icon: 'trash', handler: () => { console.log('Delete clicked'); }},
          { text: 'Cancel', role: 'cancel', icon: 'close', handler: () => { console.log('Cancel clicked'); }},
        ]}
      >
        test
      </IonActionSheet>
      <IonButton onClick={() => setShow(true)}>Open Alert</IonButton>
    </React.Fragment>
  );
}

const Modal = () => {
  const [show, setShow] = React.useState(false);
  return (
    <React.Fragment>
      <IonModal isOpen={show}>
        <p>This is modal content</p>
        <IonButton onClick={() => setShow(false)}>Close Modal</IonButton>
      </IonModal>
      <IonButton onClick={() => setShow(true)}>Open Modal</IonButton>
    </React.Fragment>
  );
}
