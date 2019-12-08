import * as Phaser from 'phaser'

import IsometricTilemap from "../extends/isometrictilemap/IsometricTilemap";

import Asset_ISO60_Texturepack__JSON from "../assets/Tilemap/xdx_isocam60_anim_texturepack.json";
import Asset_ISO60_Texturepack__PNG  from "../assets/Tilemap/xdx_isocam60_anim_texturepack.png";

const SceneClass = class Tilemap extends Phaser.Scene { // https://github.com/photonstorm/phaser/blob/v3.20.0/src/scene/Scene.js
  xdx = { }

  constructor() {
    var sceneConfig = { // https://photonstorm.github.io/phaser3-docs/Phaser.Types.Scenes.html
      key: "Tilemap",
    };

    super(sceneConfig);

    this.updateTicker = 0;
    this.updateRunning = false;
  }

  ///////////////////////////////////////////////////////////////////////////

  // scene step 1 (once)
  init = (data) => { 
    this.initCameras();

    this.time.advancedTiming = false;

    this.load.crossOrigin = 'anonymous';

    this.input.addPointer(1);

  } // of init

  ///////////////////////////////////////////////////////////////////////////

  initCameras = () => {
    // full-screen camera
    this.cameras.main 
      .setName('maincam')
      .setRotation(0) // do not use roration for isoMap-camera, it will break tilemap-display
      .setOrigin(0.5) // origin for camera-rotation / -zoom:: set this to 0.5 for in-place-zooming
      .setZoom(0.2)
      .setRoundPixels(true)
      .setBackgroundColor("rgba(50, 50, 150, 1.0)")

    // small overview camera
    this.cameras.minimap = this.cameras
      .add(5, this.cameras.main.height - 200 - 15, this.cameras.main.width -5 -5, 200)
      .setName('worldcam')
      .setZoom(0.025)
      .setOrigin(0.5) 
      .setRotation(0)
      .setBackgroundColor("rgba(5, 5, 5, 0.5)")

  } // of initCameras

  ///////////////////////////////////////////////////////////////////////////

  // scene step 2 (once)
  preload = (data) => {
    //this.load.image('Asset_ISO60_Image_Bricks1024', Asset_ISO60_Image_Bricks1024);
    //this.load.spritesheet('spritesheetGroundLayer', assetTilesetOcean, { frameWidth: 96, frameHeight: 48 });

    this.load.atlas('Asset_ISO60_Texturepack', Asset_ISO60_Texturepack__PNG, Asset_ISO60_Texturepack__JSON);

  } // of preload

  ///////////////////////////////////////////////////////////////////////////

  // scene step 3 (once)
  create = async (data) => {
    global.log("this::", this, data)

    this.xdx.debugGraphics = this.add.graphics()
      .setDefaultStyles({
        lineStyle: { width: 1, color: 0xffffff, alpha: 1 },
        fillStyle: { color: 0xff0000, alpha: 0.2 }
      })
      //.lineStyle(1, 0xff00ff, 1)
      //.fillStyle(0x00ff00, 1)
      .setDepth(1111111)
      .clear();


    this.xdx.textStatus = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "create", { font: "42px Arial", fill: "#ffffff" })
      .setOrigin(0.5)
      .setName("statustext")
      .setScrollFactor(0) // fix to absolute position, dont move with camera
      .setDepth(100)

    
    const mapConfig = {
      tileWidth : 512, // 256,
      tileHeight: 256, // 128,
      paddingBottom: 512 - 372, //19, // -1: sprite verticaly centered; 0: sprite bottom-based; >0: 
      // Asset_ISO60_Texturepack / Asset_ISO60_Single_Block_Empty
    };

    const map = {
      width : 500,
      height: 500,
      data2D: null,
    };

    map.data2D = new Array(map.height);
    for (let tileY = 0; tileY < map.height; tileY++) {
      map.data2D[tileY] = new Array(map.width);
      for (let tileX = 0; tileX < map.width; tileX++) {
        map.data2D[tileY][tileX] = /*(tileX % 2 === 0) ? null : */{
          assetkey: "Asset_ISO60_Texturepack",  // texture to use for frameselection; defaults to assetkeys[0]

          //frameID: 0,                   // framenumber in texture; defaults to random
          depth: 0,                       // rendering sort-order; defaults to 0 (no sorting === faster)
          visible: true,
          z: 0,                           // z-coordinate of tile (technically its y' = y - z)
          alpha: 1,
          tint: 0xffffff,
          flipX: false,
          flipY: false,

          isAnimatable: false,            // if true: item will be addable to "animList" at setTilemapLayer();
          isRunning : false,              // if true && item.aniateable -> item will be addaed to "animList"

          //todo: animFrameRate: 10,
          animFrameIDStart: 0,
          animFrameIDEnd: 30,
        }
        if ( map.data2D[tileY][tileX]) {
          // randomize
          switch (Phaser.Math.Between(0,9)) {
            case 0: map.data2D[tileY][tileX].frameID = null; break; //Phaser.Math.Between(0, 30); break; // animation state of boy (0 .. 30)
            case 1: map.data2D[tileY][tileX].frameID = 31; break; // boy, not animatable
            default:map.data2D[tileY][tileX].frameID = 32; break; // empty block
          }
          if (map.data2D[tileY][tileX].frameID <= 30) { 
            map.data2D[tileY][tileX].isAnimatable = true; 
            map.data2D[tileY][tileX].isRunning = Boolean(Phaser.Math.Between(0,1)); 
          }
        }
      }
    }


    this.xdx.isoMap = new IsometricTilemap(this, 0, 0, map, mapConfig); // (scene, x, y, mapData, mapConfig)
    global.log("isomap::", this.xdx.isoMap)
    this.xdx.isoMap
      .setDebug(true, this.xdx.debugGraphics)
      .setName("groundlayer")
      .setAlpha(1.0)
      .setDepth(0)                        // z-index of layer (relative to other gameObjects of this scene)
      .setCamera(this.cameras.main)       // camera used by culling layer-objects against viewport
      .setAnimateCulledOnly(true)         // true: animation run only for items in camera-worldview false: animation run for all items with the prop: animatable = true
      .setExtraTilesToCull(1)             // 1 for ISO60°, 3 for ISO75°
      //.setPosition(this.cameras.main.centerX, this.cameras.main.centerY) // center map-object in viewport
      .setPosition(this.cameras.main.centerX - this.xdx.isoMap.width2, this.cameras.main.centerY - this.xdx.isoMap.height2) // center map-object in viewport
      .addTimer({ name: "moveZ@10fps", fps: 10 }, (timerTicker, preUpdateTicker, preUpdateTime, childList, renderList, animList) => {  // set a periodic timer
        //global.log("timer:: ", timerTicker, renderList, animList)
        //const z = 10 * Math.sin(2 * Math.PI * (timerTicker % 100 / 100));
        //this.xdx.isoMap.setTilesProperty(renderList, "z", z); 
        animList && animList.forEach(item => item.z = mapConfig.paddingBottom * Math.sin(2 * Math.PI * (timerTicker % 500) / 500)); // move z-axis in a sinus-wave by time
      })
      .addTimer({ name: "animate", fps: 15 }, (timerTicker, preUpdateTicker, preUpdateTime, childList, renderList, animList) => { // set a periodic timer
        if (animList && animList.length > 0) {
          //const animListCulled = renderList.filter(item => item.isRunning === true);
          renderList && renderList.forEach(item => { 
            if (item.isRunning) {
             if (item.isAnimatable) this.xdx.isoMap.shrTileFrame(item, item.animFrameIDStart, item.animFrameIDEnd);
            }
          });
        }
      })
    

    await this.initIteractions();

    this.initTimedUpdate(10);
    this.updateTicker = 0;
    this.updateRunning= true; // start step 4 (periodic updating)
  } // of create


  ///////////////////////////////////////////////////////////////////////////

  initIteractions = async () => {
    this.keys = { 
      CTRL: this.input.keyboard.addKey("CTRL"),
      //SHIFT: this.input.keyboard.addKey("SHIFT"),
      //ALT: ***not working with ALT***
    };


    this.xdx.onMoveStart = (time, camera, isMove, pointer, ) => {
      global.log("onMoveStart::", pointer.isDown, );
    }

    this.xdx.onMove = (time, camera, isMove, pointer, ) => {
      const inv= 1;
      const dx = inv * (pointer.downX - pointer.x);
      const dy = inv * (pointer.downY - pointer.y);
      camera.setScroll(isMove.scrollX + dx / camera.zoom, isMove.scrollY + dy / camera.zoom);
    }

    this.xdx.onMoveEnd = (time, camera, isMove, pointer,) => {
      global.log("onMoveEnd::", pointer.isDown, );
    }


    this.xdx.onPinchStart = (time, camera, isPinch, pointer1, pointer2, ctrlKey) => {
      global.log("onPinchDown::", pointer1.isDown, pointer2.isDown, ctrlKey.isDown);
    }

    this.xdx.onPinchMove = (time, camera, isPinch, pointer1, pointer2, ctrlKey) => {
      const distance = Phaser.Math.Distance.Between(pointer1.x, pointer1.y, ctrlKey.isDown ? isPinch.x2 : pointer2.x, ctrlKey.isDown ? isPinch.y2 : pointer2.y);
      camera.zoom = isPinch.zoom * (1 + (distance - isPinch.distance) / camera.width);
      global.log("onPinchMove::", pointer1.isDown, pointer2.isDown, ctrlKey.isDown, distance, camera.zoom);
    }

    this.xdx.onPinchEnd = (time, camera, isPinch, pointer1, pointer2, ctrlKey) => {
      global.log("onPinchUp::", pointer1.isDown, pointer2.isDown, ctrlKey.isDown);
    }


    this.xdx.onLongPressStart = (time, camera, isLongPress, pointer, ) => {
      global.log("onLongPressStart:: LONGPRESS ACTION Start", );
    }

    this.xdx.onLongPressMove = (time, camera, isLongPress, pointer, ) => {
      global.log("onLongPressMove:: LONGPRESS ACTION Move");
    }

    this.xdx.onLongPressEnd = (time, camera, isLongPress, pointer, ) => {
      global.log("onLongPressEnd:: LONGPRESS ACTION End");
    }


    this.input.on('wheel', (pointer, gameObject, dx, dy, dz, event) => { 
      //global.log("wheel:: ", pointer, gameObject, dx, dy, dz, event);
      this.cameras.main.zoom = (dy < 0) ? this.cameras.main.zoom * 1.1 : this.cameras.main.zoom / 1.1;
    });

    this.input.on('pointerdown', (pointer, gameObject) => { 
      // is a pinch-event in action
      if (this.xdx.isPinch) return;

      //this.xdx.kineticScrolling.beginMove(pointer);
    });

    this.input.on('pointermove', (pointer, gameObject) => { 
      if (this.xdx.isPinch) return;
      if (this.xdx.isLongPress) return;
      //this.xdx.kineticScrolling.move(pointer, pointer.x, pointer.y);
    });

    this.input.on('pointerup', (pointer, gameObject) => { 
      //this.xdx.kineticScrolling.endMove();

      // was a pinch, longpress or move-action
      if (this.xdx.isMove || this.xdx.isPinch || this.xdx.isLongPress) {
        return; // *** STOP HERE ***
      }

    
      //
      // normal click action
      // ###################
      //

      // from a pointer
      const worldXY = this.cameras.main.getWorldPoint(pointer.x, pointer.y); // new Phaser.Geom.Point(pointer.worldX, pointer.worldY);      
      const localXY = this.xdx.isoMap.worldCoordsToLocalCoords(worldXY.x, worldXY.y); // convert world-coords to coords relative to top/left of isomap
      const tileXY  = this.xdx.isoMap.localCoordsToTileCoords(localXY.x, localXY.y);  // convert pixel-coords to tile-coords (array data2D[tileY][tileX])
      const tile    = this.xdx.isoMap.getTileByTileCoords(tileXY.x, tileXY.y);        // get tile (item)

      if (tile) {
        global.log("click tile:: ", tile, tile.tileX, tile.tileY, tile.x, tile.y)
        if (this.xdx.isoMap.isDebug) {
          const world = this.xdx.isoMap.localCoordsToWorldCoords(tile.x, tile.y);
          this.xdx.debugGraphics.clear().lineStyle(1, 0x00ff00, 0.5).strokeRectShape({x: world.x, y: world.y, width: tile.width, height: tile.height,});
        }

        if (pointer.event.shiftKey) tile.tint = Phaser.Math.Between(0x000000, 0xffffff);
        if (pointer.event.altKey) this.xdx.isoMap.setTilesProperty(tile, "visible", !tile.visible);
        if (pointer.event.metaKey) this.xdx.isoMap.setTilesProperty(tile, "visible", !tile.visible);
        //this.xdx.isoMap.shrTileFrame(tile); // manual animate: cycle to next frame
        //this.xdx.isoMap.shlTileFrame(tile); // manual animate: cycle to prev frame
        //this.xdx.isoMap.setTilesProperty(tile, "zPixel", tile.zPixel + 10);
        //this.xdx.isoMap.setTilesProperty(tile, "depth", tile.depth > 0 ? 1 : 0); 
        this.xdx.isoMap.setTileIsRunning(tile, !tile.isRunning);

        global.log("::tileXY::",this.xdx.isoMap, tile, pointer, tileXY.x, tileXY.y, );
      }

      //const localXYcenter = this.xdx.isoMap.tileCoordsToLocalCoords(tileXY.tileX, tileXY.tileY);
      //global.log("pointer:: ", tileXY.x, tileXY.y, tileXY.xFloat.toFixed(2), tileXY.yFloat.toFixed(2),);
    })
    
    this.input.keyboard.on("keydown", (event) => {
      //global.log("Tilemap:: this.input.keyboard.on:: keydown:: ", e, e.key, this.cameras.main.worldView);
      const camera = this.cameras.main;
      event.preventDefault();
      switch (event.key) {
        case "ArrowLeft":   camera.scrollX -= 10; break;
        case "ArrowRight":  camera.scrollX += 10; break;
        case "ArrowUp":     camera.scrollY -= 10; break;
        case "ArrowDown":   camera.scrollY += 10; break;
        case "+":           camera.setZoom(2 * camera.zoom); camera.dirty = true; break;
        case "-":           camera.setZoom(0.5 * camera.zoom); camera.dirty = true; break;
        case " ":           global.log("DEBUG:: scene, cameras, cameras.main:: ", this, this.cameras, this.cameras.main); break;
        case "a":           this.xdx.isoMap.map.data2D.forEach(arr => arr.forEach(item => item.isRunning = !item.isRunning)); break;        
        case "s":           this.xdx.isoMap.removeTimer(); break;        
        case "q":           global.log("animation::", this.xdx.isoMap.shlTileFrame(this.xdx.isoMap.getTileByTileCoords(0,0)).frameID); break;
        case "w":           global.log("animation::", this.xdx.isoMap.shrTileFrame(this.xdx.isoMap.getTileByTileCoords(0,0)).frameID); break;
      }
    })

  } // of interactionEvents


  handleInteractions = (time, camera, pointer1, pointer2, ) => {
    if (pointer1.isDown) {
      if (!this.xdx.isLongPress && !this.xdx.isMove && (pointer2.isDown || this.keys.CTRL.isDown)) { // is a pinch just starting or already in action
        // *** PINCH *** (2 finger down)
        if (!this.xdx.isPinch) { // the pinch-action is just starting 
          this.xdx.isPinch = {
            x1: pointer1.x,
            y1: pointer1.y,
            x2: (this.keys.CTRL.isDown && !pointer2.isDown) ? camera.centerX : pointer2.x,
            y2: (this.keys.CTRL.isDown && !pointer2.isDown) ? camera.centerY : pointer2.y,
            zoom: this.cameras.main.zoom,
          }
          this.xdx.isPinch.distance = Phaser.Math.Distance.Between(pointer1.x, pointer1.y, this.xdx.isPinch.x2, this.xdx.isPinch.y2);
          this.xdx.onPinchDown && this.xdx.onPinchStart(time, camera, this.xdx.isPinch, pointer1, pointer2, this.keys.CTRL); 
        }
      } 
      if (!this.xdx.isLongPress && !this.xdx.isPinch) {
        if (Phaser.Math.Distance.Between(pointer1.downX, pointer1.downY, pointer1.x, pointer1.y) > 1) {
          if (!this.xdx.isMove) {
            // *** MOVE-ACTION *** (1 finger moved more than 1 px)
            this.xdx.isMove = {
              x1: pointer1.x,
              y1: pointer1.y,
              scrollX: camera.scrollX,
              scrollY: camera.scrollY,
            }
            this.xdx.onMoveStart && this.xdx.onMoveStart(time, camera, this.xdx.isMove, pointer1);
          }
        } else {
          if (!this.xdx.isLongPress && time - pointer1.downTime > 1000) {
            // *** LONGPRESS *** (1 finger down AND not moving for more than 1000 ms)
            this.xdx.isLongPress = {
              x1: pointer1.x,
              y1: pointer1.y,
            }
            this.xdx.onLongPressStart && this.xdx.onLongPressStart(time, camera, this.xdx.isLongPress, pointer1);
          }          
        }
      }
      // running actions
      this.xdx.isMove && this.xdx.onMove && this.xdx.onMove(time, camera, this.xdx.isMove, pointer1);
      this.xdx.isPinch && this.xdx.onPinchMove && this.xdx.onPinchMove(time, camera, this.xdx.isPinch, pointer1, pointer2, this.keys.CTRL);
      this.xdx.isLongPress && this.xdx.onLongPressMove && this.xdx.onLongPressMove(time, camera, this.xdx.isLongPress, pointer1);
    } else { // of pointer1.isDown
      // finishing a longpress
      if (this.xdx.isLongPress) {
        this.xdx.onLongPressEnd && this.xdx.onLongPressEnd(time, camera, this.xdx.isLongPress, pointer1);
        this.xdx.isLongPress = null;
      }      
      // finishing a move
      if (this.xdx.isMove) {
        this.xdx.onMoveEnd && this.xdx.onMoveEnd(time, camera, this.xdx.isMove, pointer1);
        this.xdx.isMove = null;
      }      
    } // of !pointer1.isDown
    // finishing a pinch
    if (this.xdx.isPinch && !(pointer1.isDown && (pointer2.isDown || this.keys.CTRL.isDown))) {
      this.xdx.onPinchUp && this.xdx.onPinchEnd(time, camera, this.xdx.isPinch, pointer1, pointer2, this.keys.CTRL);
      this.xdx.isPinch = null;
    }      
  }


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
    //global.log(time, delta)
    if (!this.updateRunning) return;
    if (this.load.isLoading()) return;

      // do something time-based here
      this.xdx.textStatus.angle += 1;
      this.xdx.textStatus.setText(`X`);
  } // of update

  ///////////////////////////////////////////////////////////////////////////

  // scene step 4 (repeat)
  //  The update function is passed 2 values:
  //  The current time (in ms)
  //  And the delta time, which is derived from the elapsed time since the last frame, with some smoothing and range clamping applied
  update = (time, delta) => { // bullet1.x += speed1 * delta;
    //global.log(time, delta)
    if (!this.updateRunning || this.load.isLoading()) return;
    this.updateTicker++;

    // touch-actions
    this.handleInteractions(time, this.cameras.main, this.input.pointer1, this.input.pointer2);

    if (this.updateTicker % 10 === 0) {
      // do something frame based here
    }

    //this.updatePointerEvents(time, this.cameras.main, this.input.pointer1, this.input.pointer2, );
  } // of update

} // of class

export default SceneClass;
