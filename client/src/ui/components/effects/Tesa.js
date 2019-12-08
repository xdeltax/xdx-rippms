import React from 'react';
import propTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import tryFallback from "utils/tryFallback";

import Typography from '@material-ui/core/Typography';

// styles will be injected as "classes" to props by "withStyles"
const styles = ({
    tesa: {
      display: "block",
      position: props => props.position ? props.position : "absolute",
      //top: props => props.tesa ? "-20px" : "0px",
      //left: props => props.tesa ? "25%" : "0px",
      //width: props => props.tesa ? "50%" : "0px",
      //height: props => props.tesa ? "35px" : "0px",
      background: props => props.background ? props.background : "linear-gradient(170deg, rgba(243,245,228,0.5) 50%, rgba(243,245,228,0.9) 70%, rgba(243,245,228,0.5) 100%)",
      backgroundColor: props => props.backgroundColor ? props.backgroundColor : "rgba(243,245,228,0.5)",
      border: props => props.border ? props.border : "2px solid rgba(255,255,255,0.5)",
      boxShadow: props => props.boxShadow ? props.boxShadow : "2px 2px 2px #888",
      transform: props => {
        const center = props.center ? "translate(-50%,-50%) " : "";
        const rotate = props.rotate ? `rotate(${props.rotate}) ` : "";
        const transform = center + rotate
        return transform ? transform : null;
      },
      zIndex: props => props.zIndex ? props.zIndex : "2",
      top: props => props.top ? props.top : null,
      left: props => props.left ? props.left : null,
      bottom: props => props.bottom ? props.bottom : null,
      right: props => props.right ? props.right : null,
      height: props => props.height ? props.height : "35px",

      "&::before": {
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
    xfontItalicSmall: {
      position: "absolute",
      width:"100%",
      color: "rgba(255,255,255,1.0)",
      transform: "translate(-50%,-50%)",
      textShadow: "0px 2px 1px rgba(0,0,0,0.3)",
      fontStyle: "italic",
      fontWeight: 500,
    }
});

export default withStyles(styles)( class extends React.Component {
  render() {
    const {
      classes,
      onClick,
      rotate,
      textRotate,
      background,
      backgroundColor,
      border,
      boxShadow,
      zIndex,
      left,
      top,
      center,
      visible,
      fontSize,
      height,
      position,
      noTypography,
      ...otherprops
    } = this.props;


    return (visible === false) ? null : (
      <div className={classes.tesa}
        {...otherprops}
        onClick={ () => { onClick && onclick(); }}
      >
        <div style={{ display: "inline-flex", alignItems: 'center', verticalAlign: "middle", /* left: 0, top: 0,*/ width: "100%", height: "100%", padding: "2px 20px"}}>
          {noTypography ? this.props.children : (
            <Typography align="center" /*className={classes.fontItalicSmall}*/ noWrap style={{ fontSize: fontSize || 18, }}>
              {this.props.children}
            </Typography>
          )}
        </div>
      </div>
    ); // of return
  }; // of render
});

//ThisComponent.propTypes = { classes: propTypes.object.isRequired, };
//export default withStyles(styles)( ThisComponent );
