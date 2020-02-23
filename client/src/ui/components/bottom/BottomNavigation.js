import React from 'react';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';
import { useHistory, useLocation, } from "react-router-dom";

import Slide from '@material-ui/core/Slide';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';

import Badge from '@material-ui/core/Badge';
import RestoreIcon from '@material-ui/icons/Restore';

import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';

import store from 'store';

const styles = theme => ({
  appbar: {
    top: 'auto', // stick2Bottom
    bottom: 0, // stick2Bottom
    //position: 'fixed', // stick2Bottom

    left:0,
    width: '100%',
    height: store.appstate.app.bottomNavigation.height || 50,
    minWidth: store.appstate.app.size.minWidth || null,
    maxWidth: store.appstate.app.size.maxWidth || null,

    color: store.appstate.colors.navigation.text,
    background: store.appstate.colors.navigation.background,
  },
  toolbar: {
    margin: 0,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  navigationtab: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  navigationtabaction: {
    minWidth: 40,
    padding: '6px 0px 0px', // padding: '6px 12px 8px'
    color: store.appstate.colors.navigation.text,
    "&$selected": {
      color: store.appstate.colors.navigation.selected,
    }
  },
  // This is required for the '&$selected' selector to work
  selected: {},
});


export default ( withStyles(styles)( observer( (props) => {
  const { classes, hide, style, ...otherProps } = props;
  const history = useHistory();
  const location = useLocation();
  return (
    <Slide direction="up" in={!hide} mountOnEnter style={style}>
      <AppBar className={classes.appbar} position="fixed" {...otherProps}>
        <Toolbar className={classes.toolbar} disableGutters variant="dense" >
          <BottomNavigation className={classes.navigationtab}
            showLabels
            value={location.pathname || ""} // value of the current selection "/auth/stats"
            onChange={ (event, value) => {
              global.log("BottomNavigation:: onChange:: value:: ", value);
              switch (value) {
                default: history.push(value); break;
              }
            }}
          >
            <BottomNavigationAction classes={{root: classes.navigationtabaction, selected: classes.selected }}
              label="Home" value="/auth/home"
              icon={<Badge badgeContent={1} color="secondary"><RestoreIcon /></Badge>}
            />
            <BottomNavigationAction classes={{root: classes.navigationtabaction, selected: classes.selected }}
              label="Phaser" value="/game/phaser"
              icon={<Badge badgeContent={1} color="secondary"><RestoreIcon /></Badge>}
            />
            <BottomNavigationAction classes={{root: classes.navigationtabaction, selected: classes.selected }}
              label="Pixi" value="/game/pixi"
              icon={<Badge badgeContent={1} color="secondary"><RestoreIcon /></Badge>}
            />
            <BottomNavigationAction classes={{root: classes.navigationtabaction, selected: classes.selected }}
              label="Stats" value="/auth/stats"
              icon={<Badge badgeContent={1} color="secondary"><RestoreIcon /></Badge>}
            />
            <BottomNavigationAction classes={{root: classes.navigationtabaction, selected: classes.selected }}
              label="Account" value="/auth/account"
              icon={<Badge badgeContent={1} color="secondary"><RestoreIcon /></Badge>}
            />
          </BottomNavigation>
        </Toolbar>
      </AppBar>
    </Slide>
  );
})));
