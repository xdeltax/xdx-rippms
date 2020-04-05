import React from 'react';
import { toJS, }  from 'mobx';
import { observer } from 'mobx-react';
//import {unixtime} from "tools/datetime";

//import { withStyles } from '@material-ui/core/styles';
//import { withRouter } from 'react-router-dom';

import { SizeMe } from "react-sizeme";

import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

//import HeaderNavigationToolbar from "ui/components/header/HeaderNavigationToolbar.js";

// phaser game
import PhaserGame from "phasergame/index.js";
//import * as bytebuffer4Tilemap from "game/tools/bytebuffer4Tilemap";

// phaser scenes
import TilemapScene from 'phasergame/scenes/TilemapScene.js';
import GuiScene from 'phasergame/scenes/GuiScene.js';
//import StressTest from 'phasergame/scenes/StressTest.js';

//============================================================================//
import debuglog from "debug/consolelog"; const clog = debuglog("GameContainer.js");
//============================================================================//

const GameContainerContent = observer( class GameContainer extends React.Component {
  state = {
    show: false,
  }

  _game = null;
  _scenes = {};

  componentWillUnmount = () => {
    clog("componentWillUnmount:: ", this._game);
    if (this._game) {
      this._game.destroy(); // game.destroy(removeCanvas, noReturn);
      this._game = null;

      this.mobxStore = null;
      this.dbStore = null;
    }
  };

  componentDidMount = async () => {
    const { size } = this.props;

    if (!this._game) {
      //this.mobxStore = store; // mobx-store -> reachable in game -> this.game.react.store...
      //this.dbStore = rxdbStore;
      try {
        this.setState({ show: true, });

        // mount database with all collections
        //await rxdbGameStore.initDatabase();

        // load / sync local-rxdb to memory for the first time (its not done on init-collection for app-starting speed)
        //await rxdbGameStore.basemaps.syncCollection({mapid: 0, fakedata: true});

        // load assets here and store to indexedDB
        await this.loadGameAssets();

        // start game init-sequence
        this._game = new PhaserGame(this, size);
        this.initGameScenes(this._game);
        this.initGameEvents(this._game);
      } catch (error) {
        clog("componentDidMount:: ERROR:: ", error)
      } finally {
        this.setState({ show: false, });
        //store.appActions.hideSpinner();

        clog("componentDidMount:: ", this, this._game, this._game && this._game.device, size)
      }
    };
  };


  loadGameAssets = async () => {
    clog('loadGameAssets:: ', );

    //store.appActions.loggerAdd("game", "loading Assets", "Asset 1");
    //store.appActions.showSpinner("loading gameAsset 1",);
    //await store.sleep(2000);
  }


  initGameScenes = (game) => {
    clog('initGameScenes:: ', game);
    // attn.::
    // never call scenes through SceneManager ==> this.game.scene.launch("StressTest", ) <- "launch" will not exist
    // always call scenes through Scenes-Class => create new Class -> and refer to it -> this._scenes.demoScene.scene.scene.launch("StressTest", )

    //game.scene.add("StressTest", StressTest, /*autostart*/false, /*data for scene.init*/{test: "hallo"});
    game.scene.add("Tilemap", TilemapScene, /*autostart*/false, /*data for scene.init*/{test: "hallo"});
    game.scene.add("Gui", GuiScene, /*autostart*/false, /*data for scene.init*/{test: "hallo"});

    // start first scene
    game.scene.start("Tilemap", /*data*/);
    game.scene.start("Gui", /*data*/);
    //game.scene.start("StressTest", /*data*/);

    //game.scene.bringToTop("Tilemap");
  };

  initGameEvents = (game) => {
    clog('initGameEvents:: ', );

	  window.addEventListener('resize', event => {
	    this.onResize(event);
	  })

    game.events.on('pause', () => { // Pause (window is invisible)
      clog('+++ event:: pause ', );
    });

    game.events.on('resize', () => { // Resume (window is visible)
      clog('+++ event:: resize ', );
    });

    game.events.on('resume', () => { // Resume (window is visible)
      clog('+++ event:: resume ', );
    });

    game.events.on('blur', () => { // The blur event is raised when the window loses focus
      clog('+++ event:: blur ', );
    });

    game.events.on('hidden', () => {
      clog('+++ event:: hidden ', );
    });

    game.events.on('visible', () => {
      clog('+++ event:: visible ', );
    });
  };


  onResize = (event) => {
  	const w = window.innerWidth;
    const h = window.innerHeight;
    clog('+++ event:: resize:: ', event, w, h);
  };

  render() {
    const {
      size,  // injected from sizeMe
      //...restProps // other props from RoutePhaserGame.js
    } = this.props;

    clog("### render:: ", this, size && size.width, size && size.height, )

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

    /*
    <HeaderNavigationToolbar label="Phaser 3" hide={!true}
      onBackButtonClick={ () => { if (history.length > 1) history.goBack(); else history.push("/"); }}
      //noRespawnButton={!rxdbStore.app.getProp.state.game.visible}
    />
    */
    return (
      <React.Fragment>
        <div id="reactUnderlayScreen" style={{ zIndex:-1, position: "absolute", top: 0, left: 0, width: "100%"}}>
          <GameLogList list={toJS(["test"])} style={{ backgroundColor: "yellow", overflow: 'auto', /*maxHeight: 300,*/ }}/>
        </div>

        <div id="phaserGameInjectID" style={{ zIndex:2, height: "100%", }} />

        <div id="reactOverlayScreen" style={{ zIndex:3, position: "absolute", top: 0, left: 0, width: "100%"}}>
        	GameContainer:

          <Button variant="outlined" onClick={async () => {
          }}>xTEST</Button>
        </div>
      </React.Fragment>
    )
  };
});



// messure dimensions and send to main-component
const GameContainer = (props) => (
	<SizeMe monitorHeight>
    { ({ size }) => {
      // 1. step: ignore the first one or two render-rounds (with size = 0)
      // 2. step: render GameContainer (and create Phaser.Game) with final container-size
      return (!size || !size.height || size.height <= 0)
      ? (<div style={{ height: "100%", }} />)
      : (<GameContainerContent size={size} {...props} />)
    }}
  </SizeMe>
);

export default GameContainer;
