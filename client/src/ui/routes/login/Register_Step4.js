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

  pinnote: {
    verticalAlign: "top",

    margin: "0px",
    width: "100%",
    height: "100%",
    padding: "5px 15px 55px 15px",

    display: "inline-block",
    //backgroundColor: "#fefabc",
    //background: "linear-gradient(110deg, white, oldlace)",
    background: "#fefabc linear-gradient(150deg, #eee 60%, #ddd 80%, #eee 100%)",

    border: "1px solid #cccccc",
    boxShadow: "10px 12px 14px rgba(0,0,0,0.3)",
    //boxShadow: "15px 8px 15px gray",

    // rotation effect
    position: "relative",
    transform: "rotate(1deg)",
    transition: "all ease 0.6s",

    //borderTopRightRadius: "60px 10px",
    borderBottomLeftRadius: "50px 5px",

    "&::before": {
      content: `''`, // klebestreifen
      display: "block",
      position: "absolute",
      left: "55px",
      top: "-20px",
      width: "175px",
      height: "35px",
      zIndex: 2,
      backgroundColor: "rgba(243,245,228,0.5)",
      border: "2px solid rgba(255,255,255,0.5)",
      boxShadow: "2px 2px 2px #888",
      transform: "rotate(-5deg)",
      /*
      content: `''`, // pin
      background: "#ff8c00 radial-gradient(at 8px 8px, rgba(255,255,255,0), rgba(0,0,0,0.5))",
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      position: "absolute",
      top: "5px",
      left: "calc(50% - 12px)",
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
  }

  render() {
    const { classes } = this.props;

    //<div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
    return (
    <React.Fragment>
      <PostIt
        headline="body features"
        aspectRatio={false}
        top={25}
        width="80%"
        rotate="1deg"
        effect="note"
        tesa
        //edge="right"
        //pin="50%"
      >
        <Box display="flex" justifyContent="center" alignContent="center" my={0} p={0} /*bgcolor="background.paper"*/ style={{ marginLeft: 10, marginRight: 10, }}>
          <TextfieldMultiSelect variant="standard" fullWidth margin="dense" style={{marginLeft: 3, width:"100px" }}
            label="day"
            menuWidth="30%"
            menuRotate="1deg"
            menuBackground="#fefabc linear-gradient(150deg, #eee 30%, #ddd 50%, #eee 70%)"
            showMenuTitleBar noEmptyMenuEntry
            selectionList={ store.user.userCard.userProfile.get_("birthdayDayREADONLY").slice(1) }
            value={ store.user.userCard.userProfile.get_pretty("birthdayD", "birthdayDayREADONLY") }
            onUpdate={ (arrayOfPrettyStrings) => {
              store.user.userCard.userProfile.set_unpretty("birthdayD", "birthdayDayREADONLY", arrayOfPrettyStrings, true)
              store.user.userCard.setUnsavedChanges(true);
            }}
            isErrorCondition={ (value) => { return store.user.userCard.userProfile.isErrorCondition(value, "birthdayD") } }
          />
          <TextfieldMultiSelect variant="standard" fullWidth margin="dense" style={{marginLeft: 3, width:"100px" }}
            label="month"
            menuWidth="30%"
            menuRotate="1deg"
            menuBackground="#fefabc linear-gradient(150deg, #eee 30%, #ddd 50%, #eee 70%)"
            showMenuTitleBar noEmptyMenuEntry
            selectionList={ store.user.userCard.userProfile.get_("birthdayMonthREADONLY").slice(1) }
            value={ store.user.userCard.userProfile.get_pretty("birthdayM", "birthdayMonthREADONLY") }
            onUpdate={ (arrayOfPrettyStrings) => {
              store.user.userCard.userProfile.set_unpretty("birthdayM", "birthdayMonthREADONLY", arrayOfPrettyStrings, true)
              store.user.userCard.setUnsavedChanges(true);
            }}
            isErrorCondition={ (value) => { return store.user.userCard.userProfile.isErrorCondition(value, "birthdayM") } }
          />
          <TextfieldMultiSelect variant="standard" fullWidth margin="dense" style={{marginLeft: 3, minWidth:"100px" }}
            required
            label="year of birth"
            menuWidth="30%"
            menuRotate="1deg"
            menuBackground="#fefabc linear-gradient(150deg, #eee 30%, #ddd 50%, #eee 70%)"
            showMenuTitleBar noEmptyMenuEntry
            selectionList={ store.user.userCard.userProfile.get_("birthdayYearREADONLY").slice(1) }
            value={ store.user.userCard.userProfile.get_pretty("birthdayY", "birthdayYearREADONLY") }
            onUpdate={ (arrayOfPrettyStrings) => {
              store.user.userCard.userProfile.set_unpretty("birthdayY", "birthdayYearREADONLY", arrayOfPrettyStrings, true)
              store.user.userCard.setUnsavedChanges(true);
            }}
            isErrorCondition={ (value) => { return store.user.userCard.userProfile.isErrorCondition(value, "birthdayY") } }
          />
        </Box>
        <Box display="flex" justifyContent="center" alignContent="center" my={0} p={0} /*bgcolor="background.paper"*/ style={{ marginLeft: 10, marginRight: 10, }}>
          <TextfieldMultiSelect variant="standard" fullWidth margin="dense"
            label="bodyfitness"
            menuRotate="1deg"
            menuBackground="#fefabc linear-gradient(150deg, #eee 20%, #ddd 50%, #eee 80%)"
            showMenuTitleBar noEmptyMenuEntry
            selectionList={ store.user.userCard.userProfile.get_("bodyfitREADONLY") }
            value={ store.user.userCard.userProfile.get_pretty("bodyfit", "bodyfitREADONLY") }
            onUpdate={ (arrayOfPrettyStrings) => {
              store.user.userCard.userProfile.set_unpretty("bodyfit", "bodyfitREADONLY", arrayOfPrettyStrings, true)
              store.user.userCard.setUnsavedChanges(true);
            }}
          />
        </Box>
        <Box display="flex" justifyContent="center" alignContent="center" my={0} p={0} /*bgcolor="background.paper"*/ style={{ marginLeft: 10, marginRight: 10, }}>
          <TextfieldMultiSelect variant="standard" fullWidth margin="dense"
            label="height"
            menuRotate="1deg"
            menuBackground="#fefabc linear-gradient(150deg, #eee 20%, #ddd 50%, #eee 80%)"
            showMenuTitleBar noEmptyMenuEntry
            selectionList={ store.user.userCard.userProfile.get_("heightREADONLY") }
            value={ store.user.userCard.userProfile.get_pretty("heigthCM", "heightREADONLY") }
            onUpdate={ (arrayOfPrettyStrings) => {
              store.user.userCard.userProfile.set_unpretty("heigthCM", "heightREADONLY", arrayOfPrettyStrings, true)
              store.user.userCard.setUnsavedChanges(true);
            }}
          />
        </Box>
        <Box display="flex" justifyContent="center" alignContent="center" my={0} p={0} /*bgcolor="background.paper"*/ style={{ marginLeft: 10, marginRight: 10, }}>
          <TextfieldMultiSelect variant="standard" fullWidth margin="dense"
            label="weight"
            menuRotate="1deg"
            menuBackground="#fefabc linear-gradient(150deg, #eee 20%, #ddd 50%, #eee 80%)"
            showMenuTitleBar noEmptyMenuEntry
            selectionList={ store.user.userCard.userProfile.get_("weightREADONLY") }
            value={ store.user.userCard.userProfile.get_pretty("weightKG", "weightREADONLY") }
            onUpdate={ (arrayOfPrettyStrings) => {
              store.user.userCard.userProfile.set_unpretty("weightKG", "weightREADONLY", arrayOfPrettyStrings, true)
              store.user.userCard.setUnsavedChanges(true);
            }}
          />
        </Box>
      </PostIt>
    </React.Fragment>

    ); // of return
  } // of render
} // of class
) // of observer
) // of withStyles
