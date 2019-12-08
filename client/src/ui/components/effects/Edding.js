import React from 'react';
import propTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import BrushStroke from 'assets/stroke/stroke-blue.png';
import BrushGreen from 'assets/stroke/stroke-green.png';
import Brush2Green from 'assets/stroke/stroke2-green.png';
import Brush2Yellow from 'assets/stroke/stroke2-yellow.png';
import Brush3Green from 'assets/stroke/strokes98-green.png';
import Brush4Green from 'assets/stroke/strokes86_cyan.png';


/*
//.open-book mark.orange {    background: linear-gradient(to bottom, rgba(255,134,9,1) 0%,rgba(255,177,34,0.5) 60%,rgba(255,177,34,1) 100%); }
const yellow = "linear-gradient(to bottom, rgba(222,255,  0,1) 0%,rgba(222,255,  0,0.5) 60%,rgba(222,255,  0,1) 100%)";
const orange = "linear-gradient(to bottom, rgba(255,134,  9,1) 0%,rgba(255,177, 34,0.5) 60%,rgba(255,177, 34,1) 100%)";
const green  = "linear-gradient(to bottom, rgba( 67,226, 15,1) 0%,rgba( 39,229, 54,0.5) 60%,rgba( 39,229, 54,1) 100%)";
const pink   = "linear-gradient(170deg, rgba(255, 69,190,1) 0%,rgba(255,107,203,0.5) 60%,rgba(255,107,203,0.6) 100%)";
const blue   = "linear-gradient(to bottom, rgba( 73,179,255,1) 0%,rgba(107,193,255,0.5) 60%,rgba(107,193,255,1) 100%)";
*/
// styles will be injected as "classes" to props by "withStyles"
const styles = ({
  edding: {
    zIndex: props => props.zIndex || 1, //"-1",
    position: "absolute",
    opacity: props => props.opacity || "0.70",
    background: `url(${Brush4Green})`, //url();
    //background: `linear-gradient( rgba(0, 0, 0, 0.5) 100%, rgba(0, 0, 0, 0.5)100%), url(${BrushStroke})`, //url();
    backgroundRepeat: "no-repeat",
    backgroundSize: "100%", // background-size: cover, contain; background-position: center, right bottom;
    //padding: "8px 0",
    top: props => props.top || 0,
    left: props => props.left || 0,
    width: props => props.brushWidth || "150%",
    height: props => props.brushHeight || "150%",
    transform: props => `rotate(${props.rotate || "-0deg"}) translate(0%,0%) skew(0deg)`,
    //height:"10px",
/*
    "&::after": {
      content: `''`,
      position: "absolute",
      width: "150%",
      height: "120%",
      background: "#EC008C",
      mixBlendMode: "multiply",
      transform: props => `rotate(${props.rotate || "-0deg"}) translate(-50%,-50%) skew(0deg)`,
    },
*/
  },
});

export default withStyles(styles)( class extends React.Component {
  render() {
    const {
      classes,
      zIndex,
      hide,
      rotate,
      opacity,
      top,
      left,
      brushWidth,
      brushHeight,
      image,
      children,
      ...otherprops
    } = this.props;
    //global.log("hhhhhhhhhhhhh", !!hide)
    //if (!Boolean(hide)) return this.props.children;
    return (!!hide) ? (
      <span {...otherprops}>{children}</span>
    ) : (
      <span style={{position:"relative", }} {...otherprops}>
        <span className={classes.edding}
        /*
          style={{
            position: "absolute",
            opacity: opacity || "0.70",
            background: `url(${BrushStroke})`, //url();
            backgroundRepeat: "no-repeat",
            backgroundSize: "100%", // background-size: cover, contain; background-position: center, right bottom;
            top: props => top || 0,
            left: props => left || 0,
            width: props => brushWidth || "150%",
            height: props => brushHeight || "150%",
            transform: props => `rotate(${rotate || "-0deg"}) translate(0%,0%) skew(0deg)`,
          }}
        */
        > </span>
        {children}
      </span>
    );
  }; // of render
});
