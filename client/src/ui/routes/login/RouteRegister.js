import React from 'react';
//import propTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { observer }  from 'mobx-react';
import { toJS } from 'mobx';

import tryFallback from "tools/tryFallback";

import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import SwipeableViews from 'react-swipeable-views';
import MobileStepper from '@material-ui/core/MobileStepper';

import KeyboardArrowLeftICON from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRightICON from '@material-ui/icons/KeyboardArrowRight';

import AppLogo from 'assets/applogo.svg';

import RegisterStep1 from './Register_Step1';
import RegisterStep2 from './Register_Step2';
//import RegisterStep3 from './Register_Step3';

import store from 'store';

const styles = theme => ({
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

export default withStyles(styles)( observer( class extends React.Component {
  state = {
    step: 1,
    activeStep: 0,
    profileImage: null,
  }
  constructor(props) {
    super(props);
    this.justARef = React.createRef();
  }

  handleLoginAfterRegisterProcess = async () => {
    try {
      store.savingNowStatus = true; // show spinner

      // update Gallery:: use profile-image from facebook or uploaded image from step 2 and upload to server and return url from server and add to gallery-store
      if (this.state.profileImage)
      try {
        // http://graph.facebook.com/453954779742863/picture?type=square&height=500&width=500& -> jpeg
        //const fbProfileImageURL = `http://graph.facebook.com/${this.fbuserid}/picture?type=square&height=1000&width=1000&`;
        //const img = await Jimp.read(fbProfileImageURL);
        //const imgbase64 = await img.getBase64Async(Jimp.MIME_JPEG);
        /////// await this.user.userCard.userGallery.apiCALL_DBUserGallery_addImageOwnANDupdateStore(this.userid, this.servertoken, this.state.profileImage)
      } catch (error) {
        global.log("RouteRegister:: handleLoginAfterRegisterProcess:: apiCALL_DBUserGallery_addImageOwnANDupdateStore:: ERROR:: ", error);
      }

      // update userprofile:: user data from register process and send to server to create or update userprofile
      try {
        /////// await store.user.userCard.userProfile.apiCALL_DBUserProfile_updateUserProfileOwn(store.user.userid, store.user.servertoken);
        /////// store.user.usercard.unsavedChanges = false;
      } catch (error) {
        global.log("routeRegister:: handleLoginAfterRegisterProcess:: apiCALL_DBUserProfile_updateUserProfileOwn:: ERROR:: ", error);
      }

      this.props.history && this.props.history.push("/");
    } finally {
      store.savingNowStatus = false; // hide spinner
    }
  }

  handleLogout = () => {
    this.props.history && this.props.history.push("/logout");
  }

  handleNext = () => {
    this.setState( prevState => ({ activeStep: prevState.activeStep + 1 }) );
  }

  handleBack = () => {
    this.setState( prevState => ({ activeStep: prevState.activeStep - 1 }) );
  }

  handleStepChange = (step) => {
    this.setState( { activeStep: step } );
  }

  static getDerivedStateFromProps = (nextProps, prevState) => {
    if (!prevState.profileImage) { // if no image set, get image from facebook by default (user can change image from folders in step 2)
      const isImage = (store && store.user && store.user.userCard && store.user.userCard.userGallery && Array.isArray(store.user.userCard.userGallery.gallery) && store.user.userCard.userGallery.gallery.length > 0 && store.user.userCard.userGallery.gallery[0].hasOwnProperty("fname"))
      return { profileImage: (!isImage) ? null : tryFallback(() => store.user.userCard.userGallery.getServerURLOfGalleryImage(store.user.userCard.userid, toJS(store.user.userCard.userGallery.gallery)[0].fname), null, this) }
    }
    return null;
  }

  componentDidMount = async () => {
    const _cw = tryFallback(()=>this.justARef.current.clientWidth, "100%");
    const _ch = tryFallback(()=>this.justARef.current.clientHeight, "100%");
    //const _cMin = (_cw < _ch) ? _cw : _ch;

    global.log("RouteRegister:: componentDidMount:: justARef:: ", this.justARef, _cw, _ch, )
    this.setState({ clientHeight: _ch, clientWidth: _cw, })

    // try to get a valid profile -> if found -> skip register-screen
    ////// await store.user.userCard.getOwnUserCardFromServerANDupdateStoreAndUpdatePersistent(store);
    if (store.user.isValidUser && store.user.isValidUserProfile) {
      this.props.history && this.props.history.push("/");
    }
  }

  render() {
    global.log("RouteRegister:: render:: ", this.props);
    const {
      classes,  // withStyles(styles)
      history,  // history: {length: 50, action: "POP", location: {…}, createHref: ƒ, push: ƒ, …} -> router-history::  history.push('/dashboard/users/1');
      //location, // location: {pathname: "/login", search: "", hash: "", state: undefined, key: "whjdry"}
      //match,    // match: {path: "/login", url: "/login", isExact: true, params: {…}}
      subroute,
    } = this.props;

    const pages = [
      {
        component: <RegisterStep1 onFinished={this.handleNext}/>,
        label: "",
        hint: "",
        isErrorCondition: false, //store.user.userCard.userProfile.isErrorCondition(store.user.userCard.userProfile.get_pretty("gender", "genderREADONLY"), "gender"),
      },
      {
        component: <RegisterStep2 profileImage={this.state.profileImage} onFinished={ (imgbase64) => {
          this.setState({ profileImage: imgbase64 });
          this.handleNext();
        }} />,
        label: "",
        hint: "",
        isErrorCondition: false, //(!this.state.profileImage),
      },
      /*
      {
        component: <RegisterStep3 onFinished={this.handleNext} />,
        label: "",
        hint: "",
        isErrorCondition: (store.user.userCard.userProfile.isErrorCondition(store.user.userCard.userProfile.get_pretty("relationshipStatus", "relationshipStatusREADONLY"), "relationshipStatus")
                        || store.user.userCard.userProfile.isErrorCondition(store.user.userCard.userProfile.get_pretty("datingType", "datingTypeREADONLY"), "datingType")
                      ),
      },
      */
    ];

    //global.log("RouteRegister:: render:: ", this.state.activeStep, pages[this.state.activeStep].isErrorCondition)
    return (
      <React.Fragment>

        <div style={{ position: "relative", top: 0, height: "30vh", minHeight: "150px", backgroundColor:"transparent" }}>
          <Typography className={classes.fontIndieItalic} align="center" noWrap style={{fontSize: 72, }}>xdx</Typography>
          <img width="100%" height="100%" src={AppLogo} alt="" />
        </div>

        <div style={{ position: "relative", height: 0, paddingBottom: "150%" /* => set height to 120% of width */, /*backgroundColor:"red",*/}}>
          <div ref={this.justARef /*measure height here*/} style={{position: "absolute",left:0,top:0,width:"100%",height:"100%", /*backgroundColor:"blue"*/}}>
            <SwipeableViews
              enableMouseEvents
              index={this.state.activeStep}
              onChangeIndex={this.handleStepChange}
              //disabled={pages[this.state.activeStep].isErrorCondition}
              resistance={false} // If true, it will add bounds effect on the edges.
              axis="x"
              disableLazyLoading={false}
              hysteresis={0.6} // Configure hysteresis between slides. This value determines how far should user swipe to switch slide.
              animateHeight={false}
              //containerStyle={{ height: tryFallback(()=>this.state.clientHeight, /*fallback:*/"400px") /* set containerheight to 150% of width */ }}
              //style={{ height: 400, overflowY: "hidden", backgroundColor:"yello }}
              //style={{ overflowY: "hidden", /*backgroundColor:"yellow",*/ }}
            >
              {pages.map((page, index) => (
                <div key={index}>
                  {page.component}
                </div>
              ))}
            </SwipeableViews>
          </div>
        </div>

        <MobileStepper
          steps={pages.length}
          position="bottom" // static top bottom
          variant="dots" // text dots progress
          activeStep={this.state.activeStep}
          nextButton={
            <Button size="small"
              onClick={ () => { this.state.activeStep !== pages.length - 1 ? this.handleNext() : this.handleLoginAfterRegisterProcess() }}
              disabled={ (this.state.activeStep > pages.length - 1) || pages[this.state.activeStep].isErrorCondition }
            >
              {this.state.activeStep < pages.length - 1 ? "Next" : "Log in"}
              <KeyboardArrowRightICON />
            </Button>
          }
          backButton={
            <Button size="small"
              onClick={ () => { this.state.activeStep > 0 ? this.handleBack() : this.handleLogout() }}
              disabled={false}>
              <KeyboardArrowLeftICON />
              {this.state.activeStep > 0 ? "Back" : "Log out"}
            </Button>
          }
        />

      </React.Fragment>
    ); // of return
  } // of render
} // of class
) // of observer
) // of withStyles
