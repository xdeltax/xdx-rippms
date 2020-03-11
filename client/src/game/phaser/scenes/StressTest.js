import * as Phaser from 'phaser'
//import store from 'store';

import assetBackground from "../assets/DemoScene/background.png";
import assetLogo from "../assets/DemoScene/logo512.png";

const SceneClass = class StressTest extends Phaser.Scene { // https://github.com/photonstorm/phaser/blob/v3.20.0/src/scene/Scene.js
  xdx = { };

  constructor() {
    var sceneConfig = { // https://photonstorm.github.io/phaser3-docs/Phaser.Types.Scenes.html
      key: "Stresstest",
      physics: {
        default: "arcade", // default: false  // no physics system enabled
        arcade: {
          gravity: { y: 200 },
          //debug: store.game.debug || false,
        },
      },
      input: {
        keyboard: true,
        mouse: true,
        touch: true,
        activePointers: 1, // up to 10 => multitouch-events
      },
    };
    super(sceneConfig);
    global.log("PHASERSCENE:: constructor():: ",  this, sceneConfig, );

    this.updateTicker = 0;
    this.updateRunning = false;
  }

  // scene step 1 (once)
  init = (data) => { // data passed from scene.add(key, sceneConfig, autoStart, data);
    global.log("PHASERSCENE:: init():: ",  this, window, data);

    this.game.input.enabled = true;     // enable interaction
    this.load.crossOrigin = true;
    //this.load.crossOrigin = 'anonymous';

    // https://photonstorm.github.io/phaser3-docs/Phaser.Cameras.Scene2D.BaseCamera.html
    // A Camera consists of two elements: The viewport and the scroll values. setViewport and setSize
    // if you wish to change where the Camera is looking in your game, then you scroll it.
    // You can do this via the properties scrollX and scrollY or the method setScroll.
    // Scrolling has no impact on the viewport, and changing the viewport has no impact on the scrolling.
    // this.cameras.main.setSize(200, 150).setBounds(0, 0, 1920, 1080).centerToBounds();
    /*CAMERAS
      .setViewport(x,y,w,h)   Camera x/y/width/height should be considered the viewport sizes == the size the camera renders to. the method 'setViewport' is used to set all those values
      .setZoom(z)::           Camera zoom is the pixel ratio of what it renders. A zoom of 0.5 will render at half the size (zoomed out), 2 will render zoomed in, etc. Cameras don't have a scale, just a zoom factor. Think of it being as how far into, or out of, the scene it is focusing. The rotation property controls the rotation of the camera from its center. All this does is rotate the region that is rendered, it doesn't impact the world.
      scrollX = / scrollY =   to move the camera around the world you use scrollX and scrollY. This adjusts the position that camera is 'looking at'.
      .setBounds              Camera bounds do not limit what can be drawn to the camera, they only limit the scrollX/Y values to stop you from 'scrolling past' the borders of a camera.
      .setScrollFactor        Game Objects have the related method 'setScrollFactor' which allows you to configure how much the camera moving influences their rendered position within it (it never impacts their actual world coordinates).
    */
    this.cameras.main
      .setName('MainCamera')
      //.setViewport(0, 0, this.react.size.width, this.react.size.height);
      //.setBounds(0, 0, this.xdx.world.width, this.xdx.world.height)
      .setRotation(0)

    //  Set the camera and physics bounds to be the size of 4x4 bg images
    //this.cameras.main.setBounds(-1024, -1024, 1024 * 2, 1024 * 2);
    //this.physics.world.setBounds(-1024, -1024, 1024 * 2, 1024 * 2);

    this.time.advancedTiming = true;
    //this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    //this.scale.pageAlignHorizontally = true;
    //this.scale.pageAlignVertically = true;
    this.scale.refresh();

    //this.preloadCustom();
  }

  // scene step 2 (once)
  preload = () => {
    global.log("PHASERSCENE:: preload():: ",  this, );

    this.xdx.textStatus = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "init", { font: "42px Arial", fill: "#ffffff" }).setOrigin(0.5).setName("status");
    this.xdx.textFps    = this.add.text(0, this.cameras.main.height-50, "fps: unknown", { font: "14px Arial", fill: "rgba(255, 255, 255, 1.0)" }).setName("fps");

    this.load.image('imgBackground', assetBackground);
    this.load.image('imgLogo', assetLogo);

    /*
    this.game.load.baseURL = 'http://examples.phaser.io/assets/';
    this.game.load.crossOrigin = 'anonymous';
    this.game.load.image('phaser-dude', 'sprites/phaser-dude.png');
    */

    //await this.createCustom(); // start step 3: object creation
  } // of init


  _addSprites = (group, amount) => {
    for (let i = 0; i <= amount - 1; i++) {
      const outerrect = new Phaser.Geom.Rectangle(0, 0, this.cameras.main.width, this.cameras.main.height);
      const innerrect = new Phaser.Geom.Rectangle(50, 50, 100, 100);
      const randompoint = Phaser.Geom.Rectangle.RandomOutside(outerrect, innerrect);

      //global.log("add", i,randompoint, group)
      //group.addMultiple(gameObjects);   // array of game objects
      group.add(
        this.physics.add.image(randompoint.x, randompoint.y, 'imgLogo')
        .setState(0) // the state value should typically be an integer (ideally mapped to a constant in your game code), but could also be a string.
        .setScale(0.1)
        .setOrigin(0)
        .setAngle(0)
        .setTint(Math.random() * 16000000)
        .setVelocity(100, 200)
        .setBounce(1, 1)
        .setCollideWorldBounds(true)
        .setGravityY(200)
      )
    }
  }

  // scene step 3 (once)
  create = async (data) => {
    global.log("PHASERSCENE:: create():: load-status:: ",  this.load.totalToLoad, this.load.totalComplete, this.load.totalFailed);
    global.log("PHASERSCENE:: create():: this:: ",  this, );
    global.log("PHASERSCENE:: create():: data:: ",  data);
    global.log("PHASERSCENE:: create():: react:: ",  this.game.react, );
    global.log("PHASERSCENE:: create():: mobx-store (phaser):: ",  this.game.react.store.game.get_all_observables(), );

    this.spritesgroup = this.add.group();
    this._addSprites(this.spritesgroup, 10);

    this.spritesgroup.setDepth(0)
    this.xdx.textStatus.setDepth(1)
    //this.xdx.textFps.setDepth(1)
    this.children.bringToTop(this.xdx.textFps);

    this.input.on('pointerup', (...paramsArray) => { // dragstart
      global.log("DemoScene:: pointerup:: ", this, {paramsArray}, this.spritesgroup); //pointer, gameObject, );
      this._addSprites(this.spritesgroup, 100);
    })

    // add timer
    this.timedEvent = this.time.addEvent({ delay: 50, loop: true, paused: false, callbackScope: this, callback: () =>{
      //global.log("DemoScene:: timerEvent:: ", this, this.spritesgroup);
      Phaser.Actions.Rotate(this.spritesgroup.getChildren(), -0.1);

    }}); // remove timer: this.timedEvent.remove(false);

    this.updateTicker = 0;
    this.updateRunning = true; // start step 4 (periodic updating)
  } // of create


  // scene step 4 (repeat)
  //  The update function is passed 2 values:
  //  The current time (in ms)
  //  And the delta time, which is derived from the elapsed time since the last frame, with some smoothing and range clamping applied
  update = (time, delta) => { // bullet1.x += speed1 * delta;
    //global.log(time, delta)
    if (!this.updateRunning) return;
    if (this.load.isLoading()) return;
    this.updateTicker++;

    //this.children.getByName("status").text = "test"
    this.xdx.textStatus.setText(`${this.spritesgroup.children.size}`);
    this.xdx.textStatus.angle += 1;

    if (this.updateTicker % 10 === 0) {
      this.xdx.textFps.setText(`fps:${this.game.loop.actualFps.toFixed(2)} d:${this.game.loop.delta.toFixed(2)} f:${this.game.getFrame()} t${time.toFixed(2)}/d${delta.toFixed(2)}`);
    }

  } // of update
} // of class

export default SceneClass;
