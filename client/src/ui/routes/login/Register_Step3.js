import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { observer }  from 'mobx-react';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import TextfieldMultiSelect from 'ui/components/effects/TextfieldMultiSelect';
import PostIt from 'ui/components/effects/PostIt';

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

  postit: {
    verticalAlign: "top",

    margin: "0px",
    width: "100%",
    height: "100%",
    padding: "5px 15px 55px 15px",

    display: "inline-block",
    //backgroundColor: "#fefabc",
    //background: "linear-gradient(110deg, white, oldlace)",
    background: "#fefabc linear-gradient(150deg, #efec88 40%, #fefabc 60%, #efec88 80%, #fefabc 100%)",
    //background: "#fefabc linear-gradient(150deg, #efec88 0%, #fefabc 100%)",

    border: "1px solid #cccccc",
    boxShadow: "0px 2px 4px rgba(0,0,0,0.3)",
    //boxShadow: "15px 8px 15px gray",

    // rotation effect
    position: "relative",
    transform: "rotate(-4deg)",
    transition: "all ease 0.6s",

    borderBottomRightRadius: "60px 10px",

    "&::before": {
      /*
      content: `''`,
      background: "#ff8c00 radial-gradient(at 8px 8px, rgba(255,255,255,0), rgba(0,0,0,0.5))",
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      position: "absolute",
      top: "5px",
      left: "calc(50% - 12px)",
      boxShadow: "4px 4px 3px rgba(0,0,0,0.5)",
      */
      content: `''`, // dark block at top (durchschimmernde klebeseite)
      backgroundColor: "rgba(0,0,0,0.025)",
      position: "absolute",
      width: "100%",
      left: "0px",
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
      backgroundImage: "linear-gradient(173deg, rgba(0,0,0,0) 92%, rgba(0,0,0,0.4) 100%)",
      transform: "rotate(3deg)",
      zIndex: "-1",
      filter: "blur(2px)",
    },
  },
});


// const JustAnotherBoringComponent = (props) => {
export default withStyles(styles)( observer( class extends React.Component {
  state = {
  }

  render() {
    const { classes } = this.props;

    return (
    <React.Fragment>
            <PostIt
              headline="Relationship"
              top={15}
              width="80%"
              rotate="-3deg"
              effect="postit"
              aspectRatio
              edge="right"
              //tesa
              //pin="50%"
            >
              <TextfieldMultiSelect variant="standard" fullWidth margin="dense"
                label="i am ..."
                required
                menuRotate="-4deg"
                menuBackground="#fefabc linear-gradient(150deg, #efec88 40%, #fefabc 60%, #efec88 80%, #fefabc 100%)"
                showMenuTitleBar noEmptyMenuEntry
                selectionList={ store.user.userCard.userProfile.get_("relationshipStatusREADONLY") }
                value={ store.user.userCard.userProfile.get_pretty("relationshipStatus", "relationshipStatusREADONLY") }
                onUpdate={ (arrayOfPrettyStrings) => {
                  store.user.userCard.userProfile.set_unpretty("relationshipStatus", "relationshipStatusREADONLY", arrayOfPrettyStrings, true)
                  store.user.userCard.setUnsavedChanges(true);
                }}
                isErrorCondition={ (value) => { return store.user.userCard.userProfile.isErrorCondition(value, "relationshipStatus") } }
              />
              <TextfieldMultiSelect variant="standard" fullWidth margin="dense"
                label="i am here for ..."
                required
                menuRotate="-4deg"
                menuBackground="#fefabc linear-gradient(150deg, #efec88 40%, #fefabc 60%, #efec88 80%, #fefabc 100%)"
                multiple showMenuTitleBar
                selectionList={ store.user.userCard.userProfile.get_("datingTypeREADONLY").slice(1) }
                value={ store.user.userCard.userProfile.get_pretty("datingType", "datingTypeREADONLY") }
                onUpdate={ (arrayOfPrettyStrings) => {
                  store.user.userCard.userProfile.set_unpretty("datingType", "datingTypeREADONLY", arrayOfPrettyStrings)
                  store.user.userCard.setUnsavedChanges(true);
                }}
                isErrorCondition={ (value) => { return store.user.userCard.userProfile.isErrorCondition(value, "datingType") } }
              />
            </PostIt>
            {/*
          </Box>
        </div>
      </Box>
      */}
    </React.Fragment>

    ); // of return
  } // of render
} // of class
) // of observer
) // of withStyles
