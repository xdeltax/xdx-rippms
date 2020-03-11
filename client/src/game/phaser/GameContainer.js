import React from 'react';
import { toJS, }  from 'mobx';
import { observer } from 'mobx-react';
//import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';
import { SizeMe } from "react-sizeme";

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import HeaderNavigationToolbar from "ui/components/header/HeaderNavigationToolbar";

//import tryFallback from "tools/tryFallback";

// phaser game
import PhaserGame from "game/phaser/game";

// phaser scenes
//import StressTest from 'game/phaser/scenes/StressTest';
import Tilemap from 'game/phaser/scenes/Tilemap';
import Gui from 'game/phaser/scenes/Gui';

import store from 'store';

const GameContainer = withRouter( observer( class GameContainer extends React.Component { //export default observer(class PhaserGameContainer extends React.Component {
  state = {
    show: false,
  }

  _game = null;
  _scenes = {};

  componentWillUnmount = () => {
    if (this._game) {
      this._game.destroy(); // game.destroy(removeCanvas, noReturn);
      this._game = null;
      global.log("GameContainer:: componentDidUnmount:: ", this._game);
    }
  };

  componentDidMount = async () => {
    const { size } = this.props;

    if (!this._game) {
      this.store = store; // mobx-store -> reachable in game -> this.game.react.store...

      try {
        this.setState({ show: true, });
        store.appActions.loggerClear("game");

        // load assets here and store to indexedDB
        await this.loadGameAssets();

        // start game init-sequence
        this._game = new PhaserGame(this, size);
        this.initGameScenes(this._game);
        this.initGameEvents(this._game);

      } finally {
        this.setState({ show: false, });
        store.appActions.hideSpinner();

        global.log("GameContainer:: componentDidMount:: ", this, this._game, this._game.device, size)
      }
    };
  };


  loadGameAssets = async () => {
    global.log('GameContainer:: loadGameAssets:: started ...', );

    store.appActions.loggerAdd("game", "loading Assets", "Asset 1" );
    store.appActions.showSpinner("loading gameAsset 1", );
    await store.sleep(2000);

    store.appActions.loggerAdd("game", "loading Assets", "Asset 2" );
    store.appActions.showSpinner("loading gameAsset 2", );
    await store.sleep(2000);

    store.appActions.loggerAdd("game", "loading Assets", "Asset 3" );
    store.appActions.showSpinner("loading gameAsset 3", );
    await store.sleep(2000);

    store.appActions.loggerAdd("game", "loading Assets", "FINISHED" );

    global.log('GameContainer:: loadGameAssets:: finished!', );
  }


  initGameScenes = (game) => {
    global.log('GameContainer:: initGameScenes:: ', game);
    // attn.::
    // never call scenes through SceneManager ==> this.game.scene.launch("StressTest", ) <- "launch" will not exist
    // always call scenes through Scenes-Class => create new Class -> and refer to it -> this._scenes.demoScene.scene.scene.launch("StressTest", )

    //game.scene.add("StressTest", StressTest, /*autostart*/false, /*data for scene.init*/{test: "hallo"});
    game.scene.add("Tilemap", Tilemap, /*autostart*/false, /*data for scene.init*/{test: "hallo"});
    game.scene.add("Gui", Gui, /*autostart*/false, /*data for scene.init*/{test: "hallo"});


    // start first scene
    game.scene.start("Tilemap", /*data*/);
    game.scene.start("Gui", /*data*/);
    //game.scene.start("StressTest", /*data*/);

    //game.scene.bringToTop("Tilemap");
  };

  initGameEvents = (game) => {
    global.log('GameContainer:: initGameEvents', );

	  window.addEventListener('resize', event => {
	    this.onResize(event);
	  })

    game.events.on('pause', () => { // Pause (window is invisible)
      global.log('GameContainer:: Event:: pause ', );
    });

    game.events.on('resize', () => { // Resume (window is visible)
      global.log('GameContainer:: Event:: resize ', );
    });

    game.events.on('resume', () => { // Resume (window is visible)
      global.log('GameContainer:: Event:: resume ', );
    });

    game.events.on('blur', () => { // The blur event is raised when the window loses focus
      global.log('GameContainer:: Event:: blur ', );
    });

    game.events.on('hidden', () => {
      global.log('GameContainer:: Event:: hidden ', );
    });

    game.events.on('visible', () => {
      global.log('GameContainer:: Event:: visible ', );
    });
  };


  onResize = (event) => {
  	const w = window.innerWidth
    const h = window.innerHeight
    global.log('GameContainer:: Event:: resize ', event, w, h);
  };


  click_clearAll = (e) => {
    store.game.clear();
    global.log("GameContainer:: store.game.clear:: ", store.game);
  };

  /*
  click_addLife = (e) => {
    //this.game && this.game.scene.keys.SceneMap.events.emit('addLife'); // eventhandler in scene "mainScene"
    store.game.lives++;
    global.log("GameContainer:: store.game.lives:: ", store.game.lives, store.game);
  };

  click_addLife2 = (e) => {
    //this.game && this.game.scene.keys.SceneMap.events.emit('addLife'); // eventhandler in scene "mainScene"
    store.game.set("lives", store.game.lives + 1);
  };
  */

  render() {
    const {
      size,  // injected from sizeMe
      //style, // destructured to dismiss
      //gameVisible, // component is active

      //classes,  // withStyles(styles)
      history,  // history: {length: 50, action: "POP", location: {…}, createHref: ƒ, push: ƒ, …} -> router-history::  history.push('/dashboard/users/1');
      //location, // location: {pathname: "/login", search: "", hash: "", state: undefined, key: "whjdry"}
      //match,    // match: {path: "/login", url: "/login", isExact: true, params: {…}}
      //...restProps // other props from RoutePhaserGame.js
    } = this.props;

    global.log("GameContainer:: render:: size:: ", this, size.width, size.height, )

    //const livesMobx = tryFallback(()=>store.game.lives, -1);

    const GameLogList = (props) => {
      let i = 0;
      return (!props.list || !Array.isArray(props.list)) ? null : (
        <List dense style={props.style || {}}>
          {props.list.map(item => (
            <ListItem dense key={"gameloglist" + i++}>
              <ListItemText primary={`${item.unixtime}:: ${item.text}:: ${item.subtext}`} secondary={``} style={{padding:0, margin:0, }}/>
            </ListItem>
          ))}
        </List>
      );
    };

    return (
      <React.Fragment>
        <HeaderNavigationToolbar label="Phaser 3" hide={!store.appState.app.header.visible}
          onBackButtonClick={ () => { if (history.length > 1) history.goBack(); else history.push("/"); }}
          //noRespawnButton={!store.appState.app.game.visible}
        />

        <div id="reactUnderlayScreen" style={{ zIndex:-1, position: "absolute", top: 0, left: 0, width: "100%"}}>
          <GameLogList list={toJS(store.appActions.logger.game)} style={{ backgroundColor: "yellow", overflow: 'auto', /*maxHeight: 300,*/ }}/>
        </div>

        <div id="phaserGameInjectID" style={{ zIndex:2, height: "100%", }} />

        <div id="reactOverlayScreen" style={{ zIndex:3, position: "absolute", top: 0, left: 0, width: "100%"}}>
        	Hallo
        </div>
      </React.Fragment>
    )
  };
}));



// messure dimensions and send to main-component
export default (props) => (
	<SizeMe monitorHeight>
    { ({ size }) => {
      // 1. step: ignore the first one or two render-rounds (with size = 0)
      // 2. step: render GameContainer (and create Phaser.Game) with final container-size
      return (!size || !size.height || size.height <= 0)
      ? (<div style={{ height: "100%", }} />)
      : (<GameContainer size={size} {...props} />)
    }}
  </SizeMe>
);

/*
const GameContainerWithSize = observer ( class extends React.Component {
  render() {
    return (
      <SizeMe monitorHeight>
        { ({ size }) => {
          // 1. step: ignore the first one or two render-rounds (with size = 0)
          // 2. step: render GameContainer (and create Phaser.Game) with final container-size
          return (!size || !size.height || size.height <= 0)
          ? (<div style={{ height: "100%", }} />)
          : (<GameContainer size={size} {...this.props} />)
        }}
      </SizeMe>
    );
  }
});
*/

/*
const styles = theme => ({
  root: {
  },
});

export default withRouter( withStyles(styles)( observer( class extends React.Component {
  state = {
  }
  render() {
    global.log("ModalPhaserGame:: render:: ", this.props);
    const {
      classes,  // withStyles(styles)
      history,  // history: {length: 50, action: "POP", location: {…}, createHref: ƒ, push: ƒ, …} -> router-history::  history.push('/dashboard/users/1');
      //location, // location: {pathname: "/login", search: "", hash: "", state: undefined, key: "whjdry"}
      //match,    // match: {path: "/login", url: "/login", isExact: true, params: {…}}
      gameVisible,
      //...otherProps
    } = this.props;

    return (
      <div className={classes.root} style={{
        position: "relative",
        overflow: "auto",
        height: "100%",
        width: "100%",
        color: store.appState.colors.auth.text,
        background: store.appState.colors.auth.background,
      }}>
        <GameContainerWithSize gameVisible={gameVisible} />

        <div id="reactOverlayScreen" style={{ position: "absolute", top: 0, left: 0, }}>
          <div>React Phaser Gamecontainer</div>
         </div>
      </div>
    );
  }
})));
*/
