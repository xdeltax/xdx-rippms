import React from 'react';
import { withStyles } from '@material-ui/core/styles';

import PinImage from 'assets/pin/pin.png';

// styles will be injected as "classes" to props by "withStyles"
const styles = ({
    polaroid: {
      //minWidth: 200,
      //minHeight: 200,
      display: "inline-block",
      backgroundColor: "white",
      background: props => props.background || "linear-gradient(170deg, white 10%, oldlace 30%, white 60%, oldlace 70%, oldlace 90%, rgba(100,100,0,0.25) 100%)",
      boxShadow: "5px 3px 15px gray",

      // rotation effect
      position: "relative",
      transform: props => `rotate(${props.rotate || "0deg"})`, // -4deg
      //transition: "all ease 2.6s",

      "&::before": {
        content: `''`, // tesa
        display: "block",
        position: "absolute",
        top: props => props.tesa ? "-20px" : "0px",
        left: props => props.tesa ? "25%" : "0px",
        width: props => props.tesa ? "50%" : "0px",
        height: props => props.tesa ? "35px" : "0px",
        backgroundColor: props => props.tesa ? "rgba(243,245,228,0.5)" : null,
        zIndex: props => props => props.tesa ? "2" : "0",
        border: props => props.tesa ? "2px solid rgba(255,255,255,0.5)" : null,
        boxShadow: props => props.tesa ? "2px 2px 2px #888" : null,
        transform: props => props.tesa ? "rotate(-5deg)" : null,

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

export default withStyles(styles)( class extends React.Component {
  /*
  state = {
    ch: 1,
    //cw: 1,
  }

  constructor(props) {
    super(props);

    //this.justARef = React.createRef();
  }

  componentDidMount = async () => {
    //global.log("XXXXXXXXX", this.justARef)
    //this.setState({ ch: this.justARef.current.clientWidth })
  }
  */
  render() {
    const {
      classes,
      onClick,
      headline,
      rotate,
      textRotate,
      tesa,
      pin,
      width,
      height,
      left,
      top,
      ...otherprops
    } = this.props;

    return (
      <div className={classes.polaroid}
        style={{ // outer polaroid-frame
          verticalAlign: "top",
          margin: 0,
          padding: 0, //"10px 10px 0px 10px",
          left: left ? left : 0,
          top: top ? top : 0,
          width: width ? width : "98%",
          height: height ? height : "auto",
          //backgroundColor:"blue",
          //maxWidth: 300,
          //maxHeight: 350,
        }}
        {...otherprops}
        //onClick={ () => global.log("***::", this.props.ref, this.justARef)}
        //style={{ width: (tryFallback(() => justARef.current.offsetHeight), "100%"), height: "150%"}}
      >
        <div style={{ margin: 10, /* set set white-polaroid frame around inner image */}}>
          <div style={{ position: "relative", height: 0, paddingBottom: "100%", /* => set height to 100% of width == aspect 1:1 */}}>
            <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", /*full expand to parent size of 1:1 */}}>
              <div style={{ // inner image-frame
                //margin: "10px 10px 0px 10px", // white frame around picture
                backgroundColor: "rgba(0,0,0,0.5)", // fill with a gray background color, visible if no picture present
                //width: "100%",
                height: "100%",
                //minWidth: 100,
                //minHeight: 100, // this.state.ch || 100, // set clientheigth to same as clientwidth (get clientwidth from ref)
                verticalAlign: "middle",
                border: "1px solid #555",
                boxShadow: "inset -5px -3px 15px #555",
              }}>
                {this.props.children}
              </div>
            </div>
          </div>
        </div>
        {headline && // draw some text at bottom of polaroid
          <span style={{
            display: "inline-block",
            width: "100%",
            minHeight: "54px",
            margin: 0,
            textAlign: "center",
            transform: `rotate(${textRotate || "0deg"})`, // -4deg
          }}>
            {headline}
          </span>
        }
        {pin && <img style={{ position: "absolute", top: -5, left: pin, }} width="64px" height="60px" src={PinImage} alt="" />}
      </div>
    ); // of return
  }; // of render
});

//ThisComponent.propTypes = { classes: propTypes.object.isRequired, };
//export default withStyles(styles)( ThisComponent );
