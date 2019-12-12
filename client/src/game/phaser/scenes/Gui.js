import * as Phaser from 'phaser'
import store from 'store';
import MySprite from '../extends/MySprite';
import assetLogo from "../assets/DemoScene/logo512.png";

const SceneClass = class Gui extends Phaser.Scene { // https://github.com/photonstorm/phaser/blob/v3.20.0/src/scene/Scene.js
  xdx = { // list of all created gameobjects
  };

  constructor() {
    var sceneConfig = { // https://photonstorm.github.io/phaser3-docs/Phaser.Types.Scenes.html
      key: "Gui",
    };
    super(sceneConfig);

    this.updateTicker = 0;
    this.updateRunning = false;
  }

  // scene step 1 (once)
  init = (data) => { // data passed from scene.add(key, sceneConfig, autoStart, data);
	  this.cameras.main 
	    .setName('maincam')
	    .setRotation(0)
	    .setOrigin(0.5) // origin for camera-rotation
	    .setZoom(1)
  }

  // scene step 2 (once)
  preload = (data) => {
    this.load.image('assetLogo', assetLogo);
  }

  // scene step 3 (once)
  create = async (data) => {
    const screenWidth  = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const screenWidth2 = screenWidth / 2;
    const screenHeight2= screenHeight / 2;

    this.xdx.textStatus = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "create", { font: "42px Arial", fill: "rgba(255, 0, 0, 0.2)" })
      .setOrigin(0.5)
      .setName("status")
      .setDepth(1)
      .setScrollFactor(0) // fix to absolute position, dont move with camera

    this.xdx.textFps   = this.add.text(10, screenHeight-140, "", { font: "12px Arial", fill: "rgba(255, 200, 255, 1.0)" })
      .setName("fps")
      .setScrollFactor(0) // fix to absolute position, dont move with camera

    this.xdx.textDebug1 = this.add.text(10, screenHeight-120, "", { font: "12px Arial", fill: "rgba(200, 200, 255, 1.0)" })
      .setName("debug1")
      .setScrollFactor(0) // fix to absolute position, dont move with camera

    this.xdx.textDebug2 = this.add.text(10, screenHeight-70, "", { font: "12px Arial", fill: "rgba(200, 200, 255, 1.0)" })
      .setName("debug2")
      .setScrollFactor(0) // fix to absolute position, dont move with camera

    this.xdx.assetLogo = new MySprite(this, screenWidth2, screenHeight2, 'assetLogo')
    this.xdx.assetLogo
      .setActive(true) // The active state of this Game Object. A Game Object with an active state of true is processed by the Scenes UpdateList, if added to it. An active object is one which is having its logic and internal systems updated.
      .setOrigin(0.5)
      .setScale(0.4) //.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
      .setAngle(0) // The angle of this Game Object as expressed in degrees. Phaser uses a right-hand clockwise rotation system, where 0 is right, 90 is down, 180/-180 is left and -90 is up. If you prefer to work in radians, see the rotation property instead.
      .setDepth(0) // zIndex:: Setting the depth will queue a depth sort event within the Scene.
      .setAlpha(0.2)
      .setTint(Math.random() * 16000000)
      //.setInteractive()
      //.on('pointerdown', (pointer, localX, localY, event) => { global.log("pointerdown", pointer, localX, localY, event); })
      //.on('pointerup', (pointer, localX, localY, event) => { global.log("pointerup", pointer, localX, localY, event); })
      //.on('pointermove', (pointer, localX, localY, event) => { 
          // Position in screen : pointer.x , pointer.y
          // Position of previous moving : pointer.prevPosition.x , pointer.prevPosition.y
          // Position in camera : pointer.worldX , pointer.worldY
          // Touching start : pointer.downTime
          // Touching end : pointer.upTime
          // Angle: pointer.angle
          // Distance: pointer.distance
          // Velocity: pointer.velocity.x, pointer.velocity.y
          // Geo worldposition for camera: var out = camera.getWorldPoint(pointer.x, pointer.y);
      //    global.log("pointermove", pointer, localX, localY, event); 
      // })
      //.setData("testkey", { test: "testValue"} ) // https://photonstorm.github.io/phaser3-docs/Phaser.Data.DataManager.html:: store.data in gameobject:: img.setData("testkey, {test: "1",}); let obj = img.getData("testkey") or img.data.count / img.data.list.testkey.test
      //.setData("testkey2", { test2: "testValue2"} )

    this.initTimedUpdate(10); // in fps
    this.updateTicker = 0;
    this.updateRunning = true; // start step 4 (periodic updating)
  } // of create

  ///////////////////////////////////////////////////////////////////////////

  initTimedUpdate = (targetFPS = 10) => { // frames per second
    // add timer
    // delay:: for 60 fps -> 1000 m2 / 60 fps = 16.6 ms
    // delay:: for 30 fps -> 1000 m2 / 30 fps = 33.3 ms
    // delay:: for 10 fps -> 1000 m2 / 10 fps = 100 ms
    this.timedEvent = this.time.addEvent({ delay: 1000 / targetFPS, loop: true, paused: false, callbackScope: this, callback: this.timedUpdate });
  } // remove timer: this.timedEvent.remove(false);

  ///////////////////////////////////////////////////////////////////////////

  timedUpdate = (...params) => { 
    if (!this.updateRunning) return;
    if (this.load.isLoading()) return;

    // do something time-based here

    this.xdx.textStatus.angle -= 1;
    this.xdx.textStatus.setText(`${(this.time.now / 1000).toFixed(3)}`);

    const tilemapScene = this.game.scene.getScene("Tilemap");
    if (tilemapScene) {
      const cam1 = tilemapScene.cameras.main;
      const iso1 = tilemapScene.xdx.isoMap;

      this.xdx.textDebug1.setText([
      	`camera x / y = ${cam1.x.toFixed(0)} / ${cam1.y.toFixed(0)}; w / h = ${cam1.width.toFixed(0)} x ${cam1.height.toFixed(0)};`,
      	`camera sx / sy = ${cam1.scrollX.toFixed(0)} / ${cam1.scrollY.toFixed(0)}; zoom = ${cam1.zoom.toFixed(4)};`,
      	`camera world w / h = ${cam1.worldView.width.toFixed(0)}, ${cam1.worldView.height.toFixed(0)}; box: ${cam1.worldView.left.toFixed(0)}, ${cam1.worldView.right.toFixed(0)}, ${cam1.worldView.top.toFixed(0)}, ${cam1.worldView.bottom.toFixed(0)};`,
      ]);

      if (iso1)
      this.xdx.textDebug2.setText([
      	`tilemap ${iso1.map.width} x ${iso1.map.height} = ${iso1.map.height*iso1.map.width}; w / h = ${iso1.width} x ${iso1.height}`,
      	`childs: ${iso1.children.length}; cullList: ${iso1.cullList.length}; renderList: ${iso1.renderList.length}; animList: ${iso1.animList.length}`,
      	`cull time: ${iso1.timeInMS_cullViewport.toFixed(0)} ms; sort time: ${iso1.sortChildrenFlag ? iso1.timeInMS_sortList.toFixed(0) :"no sort"}; load time: ${iso1.timeInMS_setMap.toFixed(0)} ms`,
      ]);

  	}
  } // of update

  ///////////////////////////////////////////////////////////////////////////

  // scene step 4 (repeat)
  //  The update function is passed 2 values:
  //  The current time (in ms)
  //  And the delta time, which is derived from the elapsed time since the last frame, with some smoothing and range clamping applied
  update = (time, delta) => { // bullet1.x += speed1 * delta;
    if (!this.updateRunning) return;
    if (this.load.isLoading()) return;
    this.updateTicker++;

    this.xdx.textFps.setText(`fps: ${this.game.loop.actualFps.toFixed(2)} delta: ${this.game.loop.delta.toFixed(2)} frame: ${this.game.getFrame()} time: ${time.toFixed(2)}`);
    if (this.updateTicker % 10 === 0) {
    }

  } // of update
} // of class

export default SceneClass;