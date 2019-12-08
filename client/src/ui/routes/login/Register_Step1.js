import React from 'react';
//import propTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { observer }  from 'mobx-react';
import { toJS } from 'mobx';

import tryFallback from "tools/tryFallback";

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import PersonMaleBlack from 'assets/PersonMaleBlack.png';
import PersonMaleWhite from 'assets/PersonMaleWhite.png';
import PersonFemaleBlack from 'assets/PersonFemaleBlack.png';
import PersonFemaleWhite from 'assets/PersonFemaleWhite.png';

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
});


// const JustAnotherBoringComponent = (props) => {
export default withStyles(styles)( observer( class extends React.Component {
  state = {
  }

  render() {
    const { classes, onFinished } = this.props;

    const genderArray = store.user.const.genderREADONLY.slice(1); // man woman transgender
    const genderSelect = tryFallback(() => toJS(store.user.userCard.gender), null);
    return (
      <React.Fragment>
        <Typography color="inherit" align="center" noWrap style={{ fontWeight: 500, fontSize: 24,  }} >
          i am a
        </Typography>

        <Box display="flex" justifyContent="center" alignContent="center" mx={0} my={0} px={0} py={0} /*bgcolor="background.paper"*/ >
          <Button variant={genderSelect===1 ? "contained" : "outlined"} color="primary" style={{margin: 10, minWidth: "30%"}}
            onClick={ () => {
              //store.user.userCard.userProfile.set_unpretty("gender", "genderREADONLY", [store.user.userCard.userProfile.genderREADONLY[1]], true)
              //store.user.userCard.userProfile.set_unpretty("looking4Gender", "genderREADONLY", [store.user.userCard.userProfile.genderREADONLY[0]], true)
              //store.user.userCard.setUnsavedChanges(true);
              onFinished && onFinished();
            }}
          >
            <img width="25px" height="25px" src={genderSelect===1 ? PersonMaleWhite : PersonMaleBlack} alt="" style={{marginRight: 15,}} />{genderArray[0]}
          </Button>
          <Button variant={genderSelect===2 ? "contained" : "outlined"} color="primary" style={{margin: 10, minWidth: "30%"}}
            onClick={ () => {
              //store.user.userCard.userProfile.set_unpretty("gender", "genderREADONLY", [store.user.userCard.userProfile.genderREADONLY[2]], true)
              //store.user.userCard.userProfile.set_unpretty("looking4Gender", "genderREADONLY", [store.user.userCard.userProfile.genderREADONLY[1]], true)
              //store.user.userCard.setUnsavedChanges(true);
              onFinished && onFinished();
            }}
          >
            <img width="25px" height="25px" src={genderSelect===2 ? PersonFemaleWhite : PersonFemaleBlack} alt="" style={{marginRight: 15,}} />{genderArray[1]}
          </Button>
        </Box>

      </React.Fragment>
    ); // of return
  } // of render
} // of class
) // of observer
) // of withStyles
