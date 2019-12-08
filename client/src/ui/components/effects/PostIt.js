import React from 'react';
import { withStyles } from '@material-ui/core/styles';

import Typography from '@material-ui/core/Typography';
import PinImage from 'assets/pin/pin.png';

// styles will be injected as "classes" to props by "withStyles"
const styles = ({

    postit: {
      display: "inline-block",
      background: props => props.background || "#fefabc linear-gradient(150deg, #efec88 40%, #fefabc 60%, #efec88 80%, #fefabc 100%)",

      // rotation effect
      position: "relative",
      transform: props => `rotate(${props.rotate || "0deg"})`, // -4deg

      borderBottomRightRadius: props => !props.edge ? "" : "60px 10px",
      //borderImage: "url("+"http://news.unchealthcare.org/images/backgrounds/paper.jpg"+") 40 40 40 repeat",

      "&::before": {
        content: `''`, // dark block at top (durchschimmernde klebeseite)
        backgroundColor: "rgba(0,0,0,0.025)",
        position: "absolute",
        width: "100%",
        left: 0,
        top: 0,
        height: "50px",
        zIndex: "-1",
      },
      "&::after": {
        content: `''`, // schatten der abgeknickten ecke
        position: "absolute",
        bottom: -7,
        right: "-5px",
        width: "100%",
        height: "300px",
        backgroundImage: props => !props.edge ? null : "linear-gradient(173deg, rgba(0,0,0,0) 92%, rgba(0,0,0,0.4) 100%)",
        transform: props => !props.edge ? null : "rotate(3deg)",
        filter: props => !props.edge ? null : "blur(2px)",
        zIndex: "-1",
        //webclipPath: "polygon(0% 0%, 5%  100%, 10% 0%, 15%  100%, 20% 0%, 25% 100%, 30% 0%, 35%  100%, 40% 0%, 45%  100%, 50% 0%, 55%  100%, 60% 0%, 65%  100%, 70% 0%, 75%  100%, 80% 0%, 85%  100%, 90% 0%, 95%  100%, 100% 0%)",
      },
    },

    note: {
      display: "inline-block",
      background: props => props.background || "#fefabc linear-gradient(150deg, #aaa 0%, #ddd 10%, #eee 60%, #ddd 80%, #eee 100%)",
      //background: "#fefabc linear-gradient(150deg, #efec88 0%, #fefabc 100%)",
      //background: "#fefabc linear-gradient(150deg, #eee 60%, #ddd 80%, #eee 100%)"
      //background: "linear-gradient(110deg, white, oldlace)"

      // rotation effect
      position: "relative",
      transform: props => `rotate(${props.rotate || "0deg"})`, // -4deg

      borderBottomRightRadius: props => !props.edge ? "" : "60px 10px",

      "&::before": {
        content: `''`, // tesa
        display: "block",
        position: "absolute",
        top: props => props.tesa ? (props.tesaTop || "-20px") : "0px",
        left: props => props.tesa ? "25%" : "0px",
        width: props => props.tesa ? "50%" : "0px",
        height: props => props.tesa ? "35px" : "0px",
        backgroundColor: props => props.tesa ? "rgba(243,245,228,0.5)" : null,
        zIndex: props => props => props.tesa ? "2" : "0",
        border: props => props.tesa ? "2px solid rgba(255,255,255,0.5)" : null,
        boxShadow: props => props.tesa ? "2px 2px 2px #888" : null,
        transform: props => props.tesa ? `rotate(${props.tesaRotate || "-5deg"})` : null,
      },
      "&::after": {
        content: `''`, // schatten der abgeknickten ecke
        position: "absolute",
        bottom: -7,
        right: "-5px",
        width: "100%",
        height: "300px",
        backgroundImage: props => !props.edge ? null : "linear-gradient(173deg, rgba(0,0,0,0) 92%, rgba(0,0,0,0.4) 100%)",
        transform: props => !props.edge ? null : "rotate(3deg)",
        filter: props => !props.edge ? null : "blur(2px)",
        zIndex: "-1",
      },
    },
});

export default withStyles(styles)( class extends React.Component {
  render() {
    const {
      classes,

      style,

      left,
      top,
      width,
      height,
      minHeight,

      onClick,

      rotate,
      effect, // "postit", "note", "paper"

      headline,
      headlineFont,

      contentPadding,
      boxMargin,

      tesa,
      tesaTop,
      tesaRotate,

      pin,

      aspectRatio,
      ...otherprops
    } = this.props;

    const _style1={
      margin: boxMargin || 0,
      verticalAlign: "top",
      left: left ? left : 0,
      top: top ? top : 20,
      width: width ? width : "98%",
      height: height ? height : "auto",
      border: "1px solid #cccccc",
      boxShadow: "0px 2px 4px rgba(0,0,0,0.3)",
    };

    const _style = style ? Object.assign({}, _style1, style) : _style1;

    const NoteContent = () => { return (
      <div style={{padding: contentPadding || "5px 15px 55px 15px", minHeight: minHeight || null, }}>
        {headline &&
        <Typography
          align="center" noWrap
          style={ headlineFont || { fontFamily: 'Indie Flower', fontStyle: 'italic', fontSize: 36, opacity: 1.0, marginBottom: 20, }}
          //onClick={ (event) => { onClick && onClick(event) }}
        >
          {headline}
        </Typography>
        }
        {this.props.children}
        {pin && <img style={{ position: "absolute", top: -20, left: pin, }} width="64px" height="60px" src={PinImage} alt="" />}
      </div>
    )};

    // muss in einen container geschachtelt werden damit dieser automatisch die richtige grösse reserviert: <div style={{ paddingBottom: 40, background: "red",  }}><PostIt ...
    return (
      <div //ref={this.justARef}
        className={ effect==="postit" ? classes.postit : effect==="note" ? classes.note : classes.paper }
        style={_style}
        {...otherprops}
        //style={{ width: (tryFallback(() => justARef.current.offsetHeight), "100%"), height: "150%"}}
        //onClick={ () => { global.log("***::", justARef, justARef.current)}}
      >
        {aspectRatio && // if 1:1 style -> fixed height
          <div style={{ position: "relative", height: 0, paddingBottom: "100%", /* => set height to 100% of width == aspect 1:1 */}}>
            <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", /*full expand to parent size of 1:1 */}}>
              <NoteContent />
            </div>
          </div>
        }
        {!aspectRatio && // no fixed ratio -> height will be as long as it needs for the inner elements
          <div style={{ left: 0, top: 0, width: "100%", height: "100%", }}>
            <NoteContent />
          </div>
        }
      </div>
    )
  } // of render
});
