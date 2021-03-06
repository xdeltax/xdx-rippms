import React from 'react';
import { observer } from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';
import { SizeMe } from "react-sizeme";

import HeaderNavigationToolbar from "ui/components/header/HeaderNavigationToolbar";

import tryFallback from "tools/tryFallback";

// phaser game
import PhaserGame from "game/phaser/game";

// phaser scenes
import StressTest from 'game/phaser/scenes/StressTest';
import Tilemap from 'game/phaser/scenes/Tilemap';
import Gui from 'game/phaser/scenes/Gui';

import store from 'store';

const GameContainer = observer( class GameContainer extends React.Component { //export default observer(class PhaserGameContainer extends React.Component {
  _game = null;
  _scenes = {};

  componentWillUnmount() {
    if (this._game) {
      this._game.destroy(); // game.destroy(removeCanvas, noReturn);
      this._game = null;
      global.log("ReactContainerPhaserGame:: componentDidUnmount:: ", this._game)
    }
  }

  componentDidMount() {
    const { size } = this.props;
    if (!this._game) {
      this.store = store; // mobx-store -> reachable in game -> this.game.react.store...
      this._game = new PhaserGame(this, size);
      this.initGameScenes(this._game);
      this.initGameEvents(this._game);

      global.log("ReactContainerPhaserGame:: componentDidMount:: ", this, this._game, this._game.device, size)
    } else { // should not happend
      //global.log("+++", store.phaser.game)
    }
  }

  initGameScenes = (game) => {
    global.log('ReactContainerPhaserGame:: initGameScenes:: ', game);
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
  }

  initGameEvents = (game) => {
    global.log('ReactContainerPhaserGame:: initGameEvents', );

    game.events.on('pause', () => { // Pause (window is invisible)
      global.log('ReactContainerPhaserGame:: Event:: pause ', );
    });

    game.events.on('resume', () => { // Resume (window is visible)
      global.log('ReactContainerPhaserGame:: Event:: resume ', );
    });

    game.events.on('blur', () => { // The blur event is raised when the window loses focus
      global.log('ReactContainerPhaserGame:: Event:: blur ', );
    });

    game.events.on('hidden', () => {
      global.log('ReactContainerPhaserGame:: Event:: hidden ', );
    });

    game.events.on('visible', () => {
      global.log('ReactContainerPhaserGame:: Event:: visible ', );
    });
  }



  click_clearAll = (e) => {
    store.phaser.clear();
    global.log("ReactContainerPhaserGame:: store.phaser.clear:: ", store.phaser)
  }

  click_addLife = (e) => {
    //this.game && this.game.scene.keys.SceneMap.events.emit('addLife'); // eventhandler in scene "mainScene"
    store.phaser.lives++;
    global.log("ReactContainerPhaserGame:: store.phaser.lives:: ", store.phaser.lives, store.phaser)
  }

  click_addLife2(e) {
    //this.game && this.game.scene.keys.SceneMap.events.emit('addLife'); // eventhandler in scene "mainScene"
    store.set("phaser.lives", store.phaser.lives + 1);
  }

  render() {
    const {
      size,  // injected from sizeMe
      style, // destructured to dismiss
      gameVisible, // component is active
      ...restProps // other props from RoutePhaserGame.js
    } = this.props;
    global.log("ReactContainerPhaserGame:: render:: size:: ", this, size.width, size.height, )

    const livesMobx = tryFallback(()=>store.phaser.lives, -1);


    return (
      <div style={style} {...restProps}>
        <div id="phaserGameInjectID" style={{ height: "100%", }} />
      </div>
    )
  }
});


// messure dimensions and send to main-component
const GameContainerWithSize = observer ( class /*GameContainerWithSize*/ extends React.Component {
  render() {
    return (
      <SizeMe monitorHeight>
        { ({ size }) => {
          // 1. step: ignore the first one or two render-rounds (with size = 0)
          // 2. step: render GameContainer (and create Phaser.Game) with final container-size
          return (!size || !size.height || size.height <= 0)
          ? (<div style={{height: "100%"}} />)
          : (<GameContainer style={{height: "100%"}} size={size} {...this.props} />)
        }}
      </SizeMe>
    );
  }
});


const styles = theme => ({
  root: {
  },
});

export default withRouter( withStyles(styles)( observer( class /*ReactContainerPhaserGame*/ extends React.Component {
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
        color: store.system.colors.auth.text,
        background: store.system.colors.auth.background,
      }}>
        <HeaderNavigationToolbar label="Phaser 3" hide={!store.system.app.header.visible}
          onBackButtonClick={ () => { if (history.length > 1) history.goBack(); else history.push("/"); }}
          //noRespawnButton={!store.system.app.game.visible}
        />
        
        <GameContainerWithSize gameVisible={gameVisible} />

        <div id="reactOverlayScreen" style={{ position: "absolute", top: 0, left: 0, }}>
          <div>React Phaser Gamecontainer</div>
         </div>
      </div>
    );
  }
})));
