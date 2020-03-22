import * as Phaser from 'phaser';

// phaser plugins
import AwaitLoaderPlugin from './plugins/awaitLoader/awaitloader-plugin.js'; // https://rexrainbow.github.io/phaser3-rex-notes/docs/site/awaitloader/#await-task

//import CustomCanvas from './customCanvas'
//const customCanvas = new CustomCanvas()

//const ratio = Math.max(window.innerWidth / window.innerHeight, window.innerHeight / window.innerWidth)
//const DEFAULT_HEIGHT = 720
//const DEFAULT_WIDTH = ratio * DEFAULT_HEIGHT

// phaser configuration
let phaserConfig = {
  parent: "phaserGameInjectID", // The DOM element-id into which this game canvas will be injected (in PhaserGameContainer)

  //url: ""
  title: "",
  version: "0.0.1",

  autoFocus: true, // Automatically call window.focus() when the game boots. Usually necessary to capture input events if the game is in a separate frame.
  disableContextMenu: true, // Disable the browser's default 'contextmenu' event (usually triggered by a right-button mouse click).

  //width: 640,
  //height: 480,
  //zoom: 1,

  type: Phaser.AUTO, //Phaser.CANVAS, Phaser.AUTO, Phaser.WEBGL, Phaser.HEADLESS,
  //type: customCanvas.type,
  //canvas: customCanvas.canvas,
  //context: customCanvas.context,

  antialias: false, // default: true; Draw all image textures ani-aliased. The default is for smooth textures, but disable if your game features pixel art
  multiTexture: true,

  //pixelArt: true,

  backgroundColor: '#000000',
  transparent: false, // Use a transparent canvas background or not.

  scale: {
    mode: Phaser.Scale.RESIZE, //Phaser.Scale.FIT, // ENVELOP, // FIT, //HEIGHT_CONTROLS_WIDTH ,// https://photonstorm.github.io/phaser3-docs/Phaser.Scale.ScaleModes.html
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 50,
    height: 50,
  },
  /*
  physics: {
    default: "arcade", // default: false  // no physics system enabled
    arcade: {
      gravity: { y: 200 },
      //debug: false,
    },
  },
  */
  fps: {
    min: 5, // The minimum acceptable rendering rate, in frames per second
    target: 60, // The optimum rendering rate, in frames per second.
    forceSetTimeOut: false, // Use setTimeout instead of requestAnimationFrame to run the game loop.
  },

  plugins: {
    global: [
      { key: 'AwaitLoader', // plugin from ./phaser/plugins/awaitLoader
        plugin: AwaitLoaderPlugin, // https://rexrainbow.github.io/phaser3-rex-notes/docs/site/awaitloader/#await-task
        start: true
      },
    ],
  },

  loader:{
      baseURL: '',
      path: '',
      enableParallel: true,
      maxParallelDownloads: 4,
      crossOrigin: undefined,
      responseType: '',
      async: true,
      user: '',
      password: '',
      timeout: 0,
  },

  //scene: [PhaserSceneMap, PhaserSceneMain, ], // add scenes in ReactContainerPhaserGame

  /* unused
  callbacks: {
    preBoot: () => { global.log("before boot"); }, // A function to run at the start of the boot sequence
    postBoot: () => { global.log("after boot"); }, // A function to run at the end of the boot sequence. At this point, all the game systems have started and plugins have been loaded.
  }
  */
};

export default class /*PhaserGame*/ extends Phaser.Game {
  // this = game
  constructor(react = null, size = { width: 1280, height: 720 }) {
    global.log('PhaserGame:: constructor:: ', react, size, );

    // modify dimensions before game-init: set container-size in game-config with size-info from parent container
    //phaserConfig.width = size.width;
    //phaserConfig.height = size.height;
    super(phaserConfig); // call the constructor of Phaser.Game

    // add react-component to this for use in all phaser-scenes
    // mobx-store at this.react.store.xxx (added in GameContainer)
    this.react = react; // pass the Component as reference:: make react (and react.state / react.store) visible in this.game (this.game.react.setState)
  }
}; // of class
