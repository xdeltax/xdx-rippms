import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { observer }  from 'mobx-react';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import Cropper from 'react-easy-crop'

import jimpCropResize2Fit from "tools/image/jimpCropResize2Fit";
import jimpResize2Fit from "tools/image/jimpResize2Fit";

import Polaroid from 'ui/components/effects/Polaroid';
import DialogImage from 'ui/components/effects/DialogImage';

import AppLogo from 'assets/applogo.svg';
import Pin from 'assets/pin/pin.png';
import SpinnerGif from 'assets/spinner/Spinner-1s-200px.gif';

import PlaylistAddICON from '@material-ui/icons/PlaylistAddOutlined';

import store from 'store';

const styles = theme => ({
  root: {
    paddingTop: 0,
    paddingBottom: 0,

    textAlign: 'center',
    rounded: true,
    opacity: 1.0,
    margin: 'auto',
    width: "99%",
    minHeight: '100vh',

    background: store.system.colors.login.background,
  },
  card: {
    backgroundColor: "transparent",
  },
  cardContent: {
    backgroundColor: "transparent",
  },

  polaroid: {
    verticalAlign: "top",

    maxWidth: "300px",
    display: "inline-block",
    backgroundColor: "white",
    background: "linear-gradient(110deg, white, oldlace)",
    boxShadow: "15px 8px 15px gray",
    margin: "20px",

    // rotation effect
    position: "relative",
    transform: "rotate(4deg)",
    transition: "all ease 0.6s",

    "&::before": {
      /*
      content: `''`, // klebestreifen
      display: "block",
      position: "absolute",
      left: "115px",
      top: "-15px",
      width: "75px",
      height: "25px",
      zIndex: 2,
      backgroundColor: "rgba(243,245,228,0.5)",
      border: "2px solid rgba(255,255,255,0.5)",
      boxShadow: "2px 2px 2px #888",
      transform: "rotate(-5deg)",
      */
      /*
      content: `''`, // pin
      background: "#ff8c00 radial-gradient(at 8px 8px, rgba(255,255,255,0), rgba(0,0,0,0.5))",
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      position: "absolute",
      top: "5px",
      left: "calc(10% - 12px)",
      boxShadow: "4px 4px 3px rgba(0,0,0,0.5)",
      */
      /*
      content: `''`, // sticky
      backgroundColor: "rgba(0,0,0,0.025)",
      position: "absolute",
      width: "100%",
      left: "0px",
      top: 0,
      height: "50px",
      zIndex: "-1",
      */
    },
  },

});



// const JustAnotherBoringComponent = (props) => {
export default withStyles(styles)( observer( class extends React.Component {
  state = {
    //profileImage: null,
    //avatarimage: null,

    enabletablespinner: false,
    dialogUpload: false,
    disablebrowsebutton: false,
    uploadedpicture: null,
    croppedAreaPixels: null,
    croppedArea: null,
    crop: { x: 0, y: 0 }, // center
    zoom: 1,
    aspect: 1 / 1,
  }

/*
  constructor(props) {
    super(props);

    this.justARef = React.createRef();
  }
*/
  /*
  componentDidMount() {
//    this.setState({ avatarimage: this.props.profileImage })
  }

  static getDerivedStateFromProps(nextProps, prevState){
    //global.log("$$$$$$$$$$$$$$$$$$$$$$$", prevState.avatarimage, nextProps.profileImage)
    if (!prevState.avatarimage) { if (nextProps.profileImage !== prevState.avatarimage) return { avatarimage: nextProps.profileImage} };
    return null;
  }
  */
  render() {
    const { classes, profileImage, onFinished } = this.props;

    //global.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", profileImage)
    //const url = `http://graph.facebook.com/${store.user.fbuserid}/picture?type=square&height=500&width=500&`;
    //this.setState({ avatarimage: url })
    return (
      <React.Fragment>
      {/*
      <Box display="flex" justifyContent="center" alignContent="center" my={0} p={0} style={{ marginLeft: 50, marginRight: 50, }}>
        <div style={{ position: "absolute", top: "50%", width: "100%", transform: "translateY(-50%)" }}>
          <Box display="flex" justifyContent="center" alignContent="center" my={0} p={0} style={{ marginLeft: 50, marginRight: 50, }}>
        */}
            <Polaroid
              headline=<Typography align="center" style={{ fontFamily: 'Indie Flower', fontStyle: "italic", fontSize: 32, opacity: 1.0, margin: 0, padding: 0, marginBottom: 5, marginTop: 5}}>Profile picture</Typography>
              width="80%"
              rotate="5deg"
              textRotate="1deg"
              pin="1%"
              tesa={false}
            >
              <img style={{ verticalAlign: "middle", /*maxWidth: "100%", height: "auto", margin:0, padding:0,*/ }}
                key={profileImage}
                width="100%"
                height="100%"
                src={profileImage}
                alt=""
                onClick={ (event) => { if (!this.state.dialogUpload) this.setState({ dialogUpload: true, enabletablespinner: false, }) }}
              />
              <Button
                variant="contained"
                color="primary"
                style={{opacity: "0.7", margin: 0, minWidth: "350", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
                onClick={ (event) => { if (!this.state.dialogUpload) this.setState({ dialogUpload: true, enabletablespinner: false, }) }}
              >change</Button>
            </Polaroid>
            {/*
          </Box>
        </div>
      </Box>
      */}

          {/*

          <Avatar alt="" src={this.state.avatarimage} style={{width:"250px", height:"250px"}}
            onClick={ (event) => { if (!this.state.dialogUpload) this.setState({ dialogUpload: true, enabletablespinner: true, }) }}
          />
          */}

        <DialogImage // ########################################## UPLOAD A NEW IMAGE - DIALOG ##########################################
          fullWidth
          maxWidth="xl"
          open={this.state.dialogUpload}
          title="browse a picture"
          //click0title = "BROWSE"
          click1title = "CANCEL"
          click2title = "OK"
          onEntering={ () => { this.setState( { disablebrowsebutton: false, uploadedpicture: null })}} // FallbackImage || FallbackImage } ) }}
          onCloseCommand={ () => this.setState( { disablebrowsebutton: true, dialogUpload: false, enabletablespinner: false, } )}
          onClick={ (clicktitle, value) => {
            if (clicktitle === "OK") { // ########################################## CROP IMAGE AND SEND BACK TO PARENT ##########################################
              //this.setState( {enabletablespinner: true, } )
              jimpCropResize2Fit(this.state.uploadedpicture, 1000, this.state.croppedAreaPixels)
              .then(imgbase64 => {
                //this.setState( {avatarimage: imgbase64} )
                store.user.userCard.setUnsavedChanges(true);
                (onFinished && onFinished(imgbase64))
              })
              .catch(err => {
              })
              .finally( () => {
                this.setState( {enabletablespinner: false, disablebrowsebutton: true, uploadedpicture: null, croppedAreaPixels: null, croppedArea: null, } )
              })
            }
          }}
        >
          <div style={{
            position: "relative",
            width: '100%',
            height: "50vh",
            top: 0,
            left: 0,
            right: 0,
            bottom: "80px",
          }}>
            {!this.state.uploadedpicture && // ########################################## "BROWSE FOR IMAGE FROM A DIRECTORY" - DIALOG #########################################
              <div style={{position: "relative", width: "100%", height: "100%", }}>
                <img alt="" src={AppLogo} style={{position: "absolute", width: "100%", height: "100%", opacity: "0.1"}}/>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
                  <input type="file" accept="image/png, image/jpeg, image/bmp" id="input-button-file123" multiple={false} disabled={this.state.disablebrowsebutton} style={{display: "none", width:1, height:1}}
                    onChange={ (e) => {
                      this.setState( {disablebrowsebutton: true, });

                      // *** browse for images - dialog ***
                      const files = e.target.files; // all selected files
                      // file[0]
                      //   lastModified: 1549754996121
                      //   lastModifiedDate: Sun Feb 10 2019 00:29:56 GMT+0100 (Mitteleuropäische Normalzeit) {}
                      //   name: "nopicture2-profilecard.svg"
                      //   size: 3408
                      //   type: "image/svg+xml"
                      //   webkitRelativePath: ""
                      //const value = e.target.value; // full path and filename
                      if (files && files.length > 0) { // this is no array !!! { files = { 0:file, length: 1}
                        const file = files[0]; // const file = this.refs.uploadImage1.files[0];
                        //global.ddd("kkk", file);
                        //const { type, name, size, lastModifiedDate, lastModified } = file;

                        if (file && file.type.startsWith('image/') === true && ["image/png", "image/jpeg", "image/bmp"].includes(file.type)) { // global.ddd("YYY", file.type.startsWith('image/'))
                          const freader = new FileReader();
                          freader.onloadend = () => {
                            //this.setState( { uploadedpicture: freader.result, disablebrowsebutton: false, } )

                            jimpResize2Fit(freader.result, 1000)
                            .then(imgbase64 => {
                              this.setState( { uploadedpicture: imgbase64, disablebrowsebutton: false, } ) // avatarimage: imgbase64,
                            })
                            .catch(err => {
                              this.setState( { uploadedpicture: null, disablebrowsebutton: false, } )
                            })
                          }
                          //freader.readAsArrayBuffer(file); // use for jimp
                          freader.readAsDataURL(file); // use for display in cropper
                        } else {
                          this.setState( { uploadedpicture: null, disablebrowsebutton: false, } )
                          alert("invalid image type. only jpeg, png and bmp allowed");
                        }
                      }
                    }}
                  />
                  <label htmlFor="input-button-file123">
                    {!this.state.disablebrowsebutton &&
                    <Button component="span" variant="outlined" color="primary" disabled={this.state.disablebrowsebutton}>
                      BROWSE
                      <PlaylistAddICON fontSize="large" style={{ marginRight:0, paddingLeft: 10}} />
                    </Button>
                    }
                  </label>
                </div>
                {this.state.disablebrowsebutton &&
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 500, }}>
                  <img alt="upload" src={SpinnerGif} />
                </div>
                }
              </div>
            }
            {this.state.uploadedpicture &&
            <Cropper
              image={this.state.uploadedpicture}
              cropShape="rect" // 'rect' | 'round'
              crop={this.state.crop}
              minZoom={1}
              maxZoom={3}
              zoom={this.state.zoom}
              aspect={this.state.aspect}
              onCropChange={ (crop) => this.setState({ crop }) }
              onZoomChange={ (zoom) => this.setState({ zoom }) }
              onCropComplete={ (croppedArea, croppedAreaPixels) => {
                //croppedArea: coordinates and dimensions of the cropped area in percentage of the image dimension
                //cropperAreaPixels: coordinates and dimensions of the cropped area in pixels.
                //x,y: number, // x/y are the coordinates of the top/left corner of the cropped area
                //width, height: number, // height of the cropped area}
                //console.log(croppedArea, croppedAreaPixels)
                this.setState({ croppedAreaPixels, croppedArea, })
              }} // Called when the user stops moving the image or stops zooming. It will be passed the corresponding cropped area on the image in percentages and pixels
            />
            }
          </div>
        </DialogImage>

      </React.Fragment>
    ); // of return
  } // of render
} // of class
) // of observer
) // of withStyles
