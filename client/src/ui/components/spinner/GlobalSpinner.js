import React from 'react';
import { toJS, }  from 'mobx';

import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import Fade from '@material-ui/core/Fade';
import Slide from '@material-ui/core/Slide';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import store from 'store'; // mobx-store

export default class Spinner extends React.Component {
  handleClose = () => {
    this.props.onCloseDialog && this.props.onCloseDialog(true);
  };

  render() {
    const { show, hint, fontSize } = this.props;

    const Logger = (props) => {
      let i = 0;
      return (!props.list || !Array.isArray(props.list)) ? null : (
        <List dense style={props.style || {}}>
          {props.list.map(item => (
            <ListItem key={"gameloglist" + i++} button>
              <ListItemText primary={`${item.unixtime}:: ${item.text}`} />
            </ListItem>
          ))}
        </List>
      );
    };

    return (show === "undefined") ? null : (
      <React.Fragment>
        <Fade in={show} timeout={{ enter: 100, exit: 1000,}}>
          <div id="background" style={{
            zIndex:90001,
            position: "fixed",
            left: 0,
            top: 0,
            width: "100%",
            height:"100%",
            background: store.appState.colors.overlay.background, //"rgba(255,255,255,0.8)",
          }} />
        </Fade>

        {true == false &&
        <div style={{
          display: (show) ? "inline-flex" : "none",
          zIndex:90003,
          position: "fixed",
          top:0,
          left:0,
          width: "100%",
          color: store.appState.colors.overlay.text, // "rgba(130, 130, 130, 0.5)"
        }}
        >
          <Logger list={toJS(store.appActions.logger.game)} style={{ backgroundColor: "red", overflow: 'auto', height: 100, }}/>
        </div>
        }

        <div style={{
          display: (show) ? "inline-flex" : "none",
          zIndex:90005,
          position: "fixed",
          top:"50%",
          left:"50%",
          transform: "translate(-50%, -50%)", // relative to element itself
          color: store.appState.colors.overlay.text, // "rgba(130, 130, 130, 0.5)"
        }}
        >
          <CircularProgress /*size={20} thickness={5.6}*/ fontSize="large" color="inherit" />
        </div>

        <div style={{
          zIndex:90009,
          position: "fixed",
          top:"75%",
          left:"50%",
          transform: "translateX(-50%)", // relative to element itself
          color: store.appState.colors.overlay.text, // "rgba(130, 130, 130, 0.5)"
        }}
        >
          <Slide in={show} direction="up">
            <Typography align="center" noWrap style={{fontSize: fontSize || 32, }}>{hint}</Typography>
          </Slide>
        </div>
      </React.Fragment>
    );
  }
}
