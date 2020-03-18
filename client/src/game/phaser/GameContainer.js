import React from 'react';
import { toJS, }  from 'mobx';
import { observer } from 'mobx-react';
import {unixtime} from "tools/datetime";
//import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';
import { SizeMe } from "react-sizeme";

import Button from '@material-ui/core/Button';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import HeaderNavigationToolbar from "ui/components/header/HeaderNavigationToolbar";

//import tryFallback from "tools/tryFallback";

// phaser game
import PhaserGame from "game/phaser/game";

import * as bytebuffer4Tilemap from "game/tools/bytebuffer4Tilemap";

// phaser scenes
//import StressTest from 'game/phaser/scenes/StressTest';
import TilemapScene from 'game/phaser/scenes/TilemapScene';
import GuiScene from 'game/phaser/scenes/GuiScene';

import store from 'store';
import rxdbStore from 'rxdbStore'; // rxdb-database

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

      this.store = null;
      this.rxdbStore = null;

      global.log("GameContainer:: componentDidUnmount:: ", this._game);
    }
  };

  componentDidMount = async () => {
    const { size } = this.props;

    if (!this._game) {
      this.store = store; // mobx-store -> reachable in game -> this.game.react.store...
      this.rxdbStore = rxdbStore;

      try {
        this.setState({ show: true, });
        store.appActions.loggerClear("game");

        // load assets here and store to indexedDB
        await this.loadGameAssets();

        // start game init-sequence
        this._game = new PhaserGame(this, size);
        this.initGameScenes(this._game);
        this.initGameEvents(this._game);

      } catch (error) {
        global.log("GameContainer:: componentDidMount:: ERROR:: ", error)
      } finally {
        this.setState({ show: false, });
        store.appActions.hideSpinner();

        global.log("GameContainer:: componentDidMount:: ", this, this._game, this._game.device, size)
      }
    };
  };


  loadGameAssets = async () => {
    global.log('GameContainer:: loadGameAssets:: started ...', );

    store.appActions.loggerAdd("game", "loading Assets", "Asset 1");
    store.appActions.showSpinner("loading gameAsset 1",);
    //await store.sleep(2000);

    store.appActions.loggerAdd("game", "loading Assets", "Asset 2");
    store.appActions.showSpinner("loading gameAsset 2",);
    //await store.sleep(2000);

    store.appActions.loggerAdd("game", "loading Assets", "Asset 3");
    store.appActions.showSpinner("loading gameAsset 3",);
    //await store.sleep(2000);



    store.appActions.loggerAdd("game", "syncRxdbToMemory", "");
    store.appActions.showSpinner("tilemap: syncRxdbToMemory",);

    // load / sync local-rxdb to memory for the first time (its not done on init-collection for app-starting speed)
    await rxdbStore.gameMobx.syncRxdbToMemory();

    global.log("GameContainer:: rxdbStore.gameMobx.syncRxdbToMemory():: ", rxdbStore.gameMobx.data.buffer, rxdbStore.gameMobx.data.bufstr)
    store.appActions.showSpinner("tilemap: create buffer",);


    global.log("GameContainer:: create and fill Buffer ");
    /*
    const bufferBytes = 1;
    this.gameData.tilemap.bufferBytes = rxdbStore.gameMobx.data.bufferBytes;
    this.gameData.tilemap.buffer = rxdbStore.gameMobx.data.buffer; // bytebuffer4Tilemap.createBuffer(this.gameData.tilemap.bufferBytes, this.gameData.tilemap.width, this.gameData.tilemap.height);

    store.appActions.showSpinner("tilemap: get data from server",);

    // 5000 x 5000 = 1100 ms
    for (let tileY = 0; tileY < this.gameData.tilemap.height; tileY++) {
      for (let tileX = 0; tileX < this.gameData.tilemap.width; tileX++) {
        const obj = {
          assetID: 0,
          frameID: 0,
        };
        switch (global.random(9)) {
          case 0: obj.frameID = global.random(30); break; // animation state of boy (0 .. 30)
          case 1: obj.frameID = 31; break; // boy, not animatable
          default:obj.frameID = 32; // empty block
        };
        const idx = this.gameData.tilemap.bufferBytes * (tileX + tileY * this.gameData.tilemap.width);
        this.gameData.tilemap.buffer[idx] = bytebuffer4Tilemap.groundlayer_objectToUint8(obj);
        //global.log("obj", obj, idx, this.gameData.tilemap.buffer[idx])
      }
    }
    global.log("GameContainer:: create and fill Buffer ");
    */

    store.appActions.loggerAdd("game", "loading Assets", "FINISHED");
    global.log('GameContainer:: loadGameAssets:: finished!',);
  }


  initGameScenes = (game) => {
    global.log('GameContainer:: initGameScenes:: ', game);
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
        <HeaderNavigationToolbar label="Phaser 3" hide={!rxdbStore.app.getProp.state.header.visible}
          onBackButtonClick={ () => { if (history.length > 1) history.goBack(); else history.push("/"); }}
          //noRespawnButton={!rxdbStore.app.getProp.state.game.visible}
        />

        <div id="reactUnderlayScreen" style={{ zIndex:-1, position: "absolute", top: 0, left: 0, width: "100%"}}>
          <GameLogList list={toJS(store.appActions.logger.game)} style={{ backgroundColor: "yellow", overflow: 'auto', /*maxHeight: 300,*/ }}/>
        </div>

        <div id="phaserGameInjectID" style={{ zIndex:2, height: "100%", }} />

        <div id="reactOverlayScreen" style={{ zIndex:3, position: "absolute", top: 0, left: 0, width: "100%"}}>
        	GameContainer:

          <Button variant="outlined" onClick={async () => {
            const rnd = global.random(10);
            const docDefault = rxdbStore.gameMap.getDefault;
            const docs = await rxdbStore.gameMap.collection.find().where("linenr").eq(rnd).exec(); // []
            let doc;
            if (docs.length === 0) {
              doc = {
                linenr: rnd.toString(),
                line: "test" + rnd.toString(),
                updatedAt: unixtime(),
              };
            }
            if (docs.length === 1) {
              doc = docs[0];
              doc.line =+ "-" + rnd.toString();
            }
            global.log("XXXXXXXXXXXXXXXXXXXXXXX", docs.length, doc);
            const newdoc = await rxdbStore.gameMap.upsertDocument(doc);

            const resMemory   = await rxdbStore.gameMap.getAll();
            const resDatabase = await rxdbStore.gameMap.documents2json(); // = { name, docs: array[], ... }
            global.log("********** GAMECONTAINER:: ", rnd, docDefault, docs, doc, newdoc, resMemory, resDatabase);
          }}>add</Button>

          <Button variant="outlined" onClick={async () => {
            const resMemory = await rxdbStore.gameMap.getall;
            const resDatabase = await rxdbStore.gameMap.documents2json(); // = { name, docs: array[], ... }
            global.log("********** GAMECONTAINER:: ", resMemory, resDatabase);
          }}>get</Button>





          <Button variant="outlined" onClick={async () => {
            await rxdbStore.gameMobx.createTestData();


            const resMemoryMobx = await rxdbStore.gameMobx.getallmobx;
            const resMemoryData = await rxdbStore.gameMobx.getalldata;
            const resJsonDocumentArray = await rxdbStore.gameMobx.getDocumentsAsJson();
            const resRxdbDocumentArray = await rxdbStore.gameMobx.getDocuments();
            global.log("********** GAMECONTAINER MOBX:: ", resMemoryMobx, resMemoryData, resJsonDocumentArray, resRxdbDocumentArray);
          }}>xTEST</Button>

          <Button variant="outlined" onClick={async () => {
            const resMemoryMobx = rxdbStore.gameMobx.getallmobx;
            const resMemoryData = rxdbStore.gameMobx.getalldata;
            const resDocArray = await rxdbStore.gameMobx.getDocumentsAsJson();
            const resCollDump = await rxdbStore.gameMobx.getCollectionAsJson(); // = { name, docs: array[], ... }

            const rdbxDoc = await rxdbStore.gameMobx.collection.findOne().where("_id").eq("clientonly").exec();
            const resAttachmentArray = (rdbxDoc) ? await rdbxDoc.allAttachments() : null;

            const rxdbDocArray = await rxdbStore.gameMobx.getDocuments(); // [] or [ {documentSchemaRxdb}, {documentSchemaRxdb}, ... ]
            global.log("$$$$$$$$$$initCollection 1:: ", rxdbDocArray)
            // 3) sync to mobx and data (or init mobx and data with default if db is empty)
            if (rxdbDocArray.length > 0) {
              const rxdbDoc = rxdbDocArray[0];
              global.log("$$$$$$$$$$initCollection 2:: ", );
              const allAttachments = await rxdbDoc.allAttachments();
              global.log("$$$$$$$$$$initCollection 3:: ", rxdbDoc, allAttachments);


              //const rxdbDoc = await this.collection.findOne().exec();
              const attachment = rxdbDoc.getAttachment("bufferAsString");
              global.log("$$$$$$$$$$initCollection 4:: ", );
              const attAsString = await attachment.getStringData(); // 100 ms
              global.log("$$$$$$$$$$initCollection 5:: ", );

              const buffer2 = Buffer.from(attAsString, "binary"); // 500 ms
              global.log("$$$$$$$$$$initCollection 6:: ", );
              const uint8 = new Uint8Array(buffer2); // 10 ms

              global.log("$$$$$$$$$$initCollection 7:: ", attachment, attAsString, buffer2, uint8);
            };

            global.log("********** GAMECONTAINER MOBX:: ", rxdbStore.gameMobx.data.buffer, rxdbStore.gameMobx.data, resMemoryData, resMemoryMobx, resDocArray, rdbxDoc, resAttachmentArray, resCollDump);
          }}>xGET</Button>





          <Button variant="outlined" onClick={async () => {
            const mapwidth  = rxdbStore.game.getProp.tilemap.width;
            const mapheight = rxdbStore.game.getProp.tilemap.height;
            const bufferbytes = rxdbStore.game.getProp.tilemap.bufferbytes;

            //const buffer = new ArrayBuffer(bufferbytes * mapwidth * mapheight); // bytebuffer4Tilemap.createBuffer(bufferbytes, mapwidth, mapheight);
            //const dataview = new DataView(buffer); // bytebuffer4Tilemap.createDataView(buffer);
            const buffer = Buffer.alloc(bufferbytes * mapwidth * mapheight);
            const dataview = buffer;

            global.log("XXXXXXXXXXXXXX", mapwidth, mapheight, bufferbytes, buffer, dataview)

            //store.appActions.showSpinner("tilemap: get data from server",);
            for (let tileY = 0; tileY < mapheight; tileY++) {
              for (let tileX = 0; tileX < mapwidth; tileX++) {
                const obj = { assetID: 0, frameID: 0, };
                switch (global.random(9)) {
                  case 0: obj.frameID = global.random(30); break; // animation state of boy (0 .. 30)
                  case 1: obj.frameID = 31; break; // boy, not animatable
                  default:obj.frameID = 32; // empty block
                };
                const idx = bufferbytes * (tileX + tileY * mapwidth);
                dataview[idx] = bytebuffer4Tilemap.groundlayer_objectToUint8(obj);
                //global.log("obj", obj, idx, mapbuffer[idx], mapbuffer)
              }
            }

            function arraybuffer2str(arraybuffer) {
              return String.fromCharCode.apply(null, new Uint8Array(arraybuffer));
            }

            function str2arraybuffer(str, bufferbytes = 1) {
              var buf = new ArrayBuffer(str.length * bufferbytes); // 2 bytes for each char
              var bufView = new Uint8Array(buf);
              for (var i=0, strLen=str.length; i < strLen; i++) {
                bufView[i] = str.charCodeAt(i);
              }
              return buf;
            }

            const buf2str = buffer.toString("binary");

            //await rxdbStore.game.setProp("tilemap.buffer", mapbuffer); // save as Uint8Array
            await rxdbStore.game.setProp("updatedAt", unixtime());

            const att = await rxdbStore.game.addAttachment(buf2str);

            //const blob = await rxdbStore.game.getAttachmentAsBuffer();
            //const buffer2 = await blob.arrayBuffer();

            const attstr = await rxdbStore.game.getAttachmentAsString();
            const buffer2 = Buffer.from(attstr, "binary");

            const uint8 = new Uint8Array(buffer2)
            //const dataview2 = new DataView(uint8);
            //const buffer2 = dataview2.buffer;
            //const newbuffer = Buffer.allocUnsafe(10000)
            //const newbuffer = Buffer.from(blob, "binary")


            //const newDataObject = await rxdbStore.game.setProp("tilemap.bufferBytes", 1);
            //const mapbuffer2 = rxdbStore.game.getProp.tilemap.buffer; // get Uint8Array
            //const getAll = await rxdbStore.game.getAll();
            //global.log("GAMECONTAINER:: ", mapbuffer, mapbuffer2, newbuffer, getAll, att, blob, newbuffer, mapbuffer[0],  mapbuffer2[0], newbuffer[0]);
            global.log("GAMECONTAINER:: ", buffer, dataview, buf2str, buf2str.length, attstr, attstr.length, buffer2, uint8, buffer[0], buffer2[0], dataview[0], uint8[0],);
          }}>fill</Button>











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
        color: rxdbStore.app.getProp.config.color.auth.text,
        background: rxdbStore.app.getProp.config.color.auth.background,
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
