import React from 'react';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';

import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';

import WifiOnICON from '@material-ui/icons/Wifi';
import WifiOffICON from '@material-ui/icons/WifiOff';
/*
import SignalWifiOffICON from '@material-ui/icons/SignalWifiOff';
import SignalCellularConnectedNoInternet0BarIcon from '@material-ui/icons/SignalCellularConnectedNoInternet0Bar';
import SignalCellular0BarIcon from '@material-ui/icons/SignalCellular0Bar';
import SignalCellular4BarIcon from '@material-ui/icons/SignalCellular4Bar';
import CellWifiIcon from '@material-ui/icons/CellWifi';
*/
import AccountCircleICON from '@material-ui/icons/AccountCircle';
import KeyboardArrowLeftICON from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowUpICON from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowDownICON from '@material-ui/icons/KeyboardArrowDown';

import IconButtonHelptext from "ui/components/helpers/IconButtonHelptext";
import IconButtonWithMenu from 'ui/components/helpers/IconButtonWithMenu';

import store from 'store';

const styles = theme => ({
  appbar: {
    top: 0, // stick2Top
    bottom: 'auto', // stick2Top
    //position: 'fixed', // stick2Top

    left:0,
    width: '100%',
    //height: store.appState.app.header.height,
    minWidth: store.appState.app.size.minWidth || null,
    maxWidth: store.appState.app.size.maxWidth || null,

    color: store.appState.colors.navigation.text,
    background: store.appState.colors.header.background,

    //alignItems: 'center',
    //justifyContent: 'space-between',
  },
  toolbar: {
    margin: 0,
    padding: 0,
    //alignItems: 'center',
    backgroundColor: 'transparent',
  },
  typography: {
    padding: theme.spacing(1),
    color: props => props.color,
  },
});

export default withStyles(styles)( observer( class extends React.Component {
  render() {
    const {
      classes,
      hide,
      noRespawnButton,
      label,
      backButtonIcon,
      onBackButtonClick,
      ...otherProps
    } = this.props;

    return (
      <React.Fragment>
      {!noRespawnButton && hide && // HIDE-BUTTON:: display a button to click -> unhide top-toolbar (and navigation if auth-path)
        <div style={{ position: "fixed", right: 0, top: 0, }}>
          <IconButton color="inherit" style={{ flexGrow: 0, }}  onClick={(event) => {
            store.appState.set("app.header.visible", true);
            store.appState.set("app.bottomNavigation.visible", true);
          }}>
            <KeyboardArrowDownICON />
          </IconButton>
        </div>
      }
      {!hide && //  <Slide direction="down" in={!hide} enter={false}>
        <AppBar className={classes.appbar} position="fixed" {...otherProps}>
          <Toolbar className={classes.toolbar} disableGutters variant="dense" >

            {onBackButtonClick && // BACK-BUTTON
            <IconButton edge="start" className={classes.menuButton} color="inherit" style={{ flexGrow: 0, }} onClick={(event) => {
              onBackButtonClick(); // ()=>history.goBack(); ()=>history.push("/login");
            }}>
              {backButtonIcon || <KeyboardArrowLeftICON />}
            </IconButton>
            }

            <Typography variant="h6" className={classes.title} align="left" style={{ flexGrow: 1, }}>
              {label}
            </Typography>

            <IconButtonHelptext
              color="inherit" textColorWindow={store.appState.colors.menu.text} backgroundColorWindow={store.appState.colors.menu.background}
              icon={(1===0) ? <WifiOnICON /> : <WifiOffICON />}
              noTypography
            >
              <Typography className={classes.typography}>
                This is a Help
              </Typography>
            </IconButtonHelptext>

            <IconButtonWithMenu // button to navigate to user-profile orientate stuff and logout
              color="inherit" textColorWindow={store.appState.colors.menu.text} backgroundColorWindow={store.appState.colors.menu.background}
              icon={<AccountCircleICON />}
              headerLabel="Account Management"
              menuItems={["Account", "Logout", ]}
              selectedItem="Logout"
              onClick={ (event, itemIndex, itemLabel) => {
              global.log("HeaderNavigationToolbar:: IconButtonUserProfile:: click:: ", itemIndex, itemLabel);
            }} />

            <IconButtonHelptext // button to show help-text
              color="inherit" textColorWindow={store.appState.colors.menu.text} backgroundColorWindow={store.appState.colors.menu.background}
              noTypography
            >
              <Typography className={classes.typography}>
                This is a Help
              </Typography>
            </IconButtonHelptext>

            <IconButton color="inherit" onClick={(event) => { // buttom to hide this toolbar and bottomNavigation
              store.appState.set("app.header.visible", false);
              store.appState.set("app.bottomNavigation.visible", false);
            }}>
              <KeyboardArrowUpICON />
            </IconButton>

          </Toolbar>
        </AppBar>
      }
      </React.Fragment>
    );
  }
}));
