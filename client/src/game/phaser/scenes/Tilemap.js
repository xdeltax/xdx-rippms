import * as Phaser from 'phaser'
import store from 'store'; // mobx-store
import indexedDB from "localDatabase/indexedDB.js";

import IsometricTilemap from "../extends/isometrictilemap/IsometricTilemapPacked";

import * as geohash from "tools/geoHashIntegerV2.js";

// tiles:: 3079 x 3079; 1 px padding; 6 x 6; frame 512 x 512; isotile: 512 x 256, bottomPadding: 140 px;
import Asset_ISO60_Texturepack__JSON from "../assets/Tilemap/xdx_isocam60_anim_texturepack.json";
import Asset_ISO60_Texturepack__PNG  from "../assets/Tilemap/xdx_isocam60_anim_texturepack.png";

// tile:: frame 512 x 512; isotile: 512 x 256, bottomPadding: 140 px;
import Asset_xdx_isocam60_single_block_1000  from "../assets/Tilemap/xdx_isocam60_single_block_1000.png";

// object:: frame 512 x 512;
import Asset_watchtower_lvl2_512x512  from "../assets/Tilemap/objects/watchtower_lvl2_512x512.png";
import Asset_isometric_house_1024x868  from "../assets/Tilemap/objects/isometric_house_1024x868.png";


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
      .add(5, this.cameras.main.height - 130 - 15, this.cameras.main.width -5 -5, 130)
      .setName('worldcam')
      .setZoom(0.025)
      .setOrigin(0.5)
      .setRotation(0)
      .setBackgroundColor("rgba(5, 5, 5, 0.5)")

  } // of initCameras

  ///////////////////////////////////////////////////////////////////////////

  // scene step 2 (once)
  preload = (data) => {
    this.load.image('Asset_watchtower_lvl2_512x512', Asset_watchtower_lvl2_512x512);
    this.load.image('Asset_isometric_house_1024x868', Asset_isometric_house_1024x868);

    this.load.image('Asset_xdx_isocam60_single_block_1000', Asset_xdx_isocam60_single_block_1000);

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




    const tilemapConfig = {
      width : store.gameMap.tilemap.width, //10,
      height: store.gameMap.tilemap.height, //10,

      tileWidth : 512, // 256,
      tileHeight: 256, // 128,
      paddingBottom: 512 - 372, //19, // -1: sprite verticaly centered; 0: sprite bottom-based; >0:
      assetKeys: ["Asset_ISO60_Texturepack", "Asset_isometric_house_1024x868", "Asset_watchtower_lvl2_512x512", ],
      //
      // assetkey: "Asset_xdx_isocam60_single_block_1000"
      //        -> tile 512 x 256, paddingBottom: 140, frames: 33,
      //        -> frame 0 to 30: animated boy
      //        -> frame 31: boy with arms outspread
      //        -> frame 32: empty base-tile
      //        -> 33, 34, 35: unused place in textureAtlas
      //
      // assetkey: "Asset_xdx_isocam60_single_block_1000"
      //        -> tile 512 x 256, paddingBottom: 140, frames: 1,
      //        -> frame 0: empty base-tile
    };

    this.xdx.isoMap = new IsometricTilemap(this, 0, 0, tilemapConfig); // (scene, x, y, mapData, mapConfig)
    global.log("isomap::", this.xdx.isoMap)
    this.xdx.isoMap
      .setDebug(true, this.xdx.debugGraphics)
      .setName("groundlayer")
      .setAlpha(1.0)
      .setDepth(0)                        // z-index of layer (relative to other gameObjects of this scene)
      .setCamera(this.cameras.main)       // camera used by culling layer-objects against viewport
      .setExtraTilesToCull(1)             // 1 for ISO60°, 3 for ISO75°
      //.setPosition(this.cameras.main.centerX, this.cameras.main.centerY) // center map-object in viewport
      .setPosition(this.cameras.main.centerX - this.xdx.isoMap.width2, this.cameras.main.centerY - this.xdx.isoMap.height2) // center map-object in viewport
      .linkDataview(store.gameMap.tilemap.dataview, store.gameMap.tilemap.bufferBytes)
      /*
      .addTimer({ name: "moveZ@10fps", fps: 10 }, (timerTicker, preUpdateTicker, preUpdateTime, childList, renderList, animList) => {  // set a periodic timer
        //animList && animList.forEach(item => item.z = tilemapConfig.paddingBottom * Math.sin(2 * Math.PI * ((timerTicker + (item.tileX + item.tileY) * 100) % 500) / 500)); // move z-axis in a sinus-wave by time
        renderList && renderList.forEach(item => { item.z = tilemapConfig.paddingBottom * Math.sin(2 * Math.PI * ((timerTicker + (item.tileX + item.tileY) * 100) % 500) / 500) }); // move z-axis in a sinus-wave by time
      })
      .addTimer({ name: "animate", fps: 15 }, (timerTicker, preUpdateTicker, preUpdateTime, childList, renderList, animList) => { // set a periodic timer
        if (animList && animList.length > 0) {
          //slow: always animate visible and invisible tiles
          //animList && animList.forEach(item => { if (item.isRunning && item.isAnimatable) this.xdx.isoMap.shrTileFrame(item, item.animFrameIDStart, item.animFrameIDEnd) });

          //faster: animate visible only
          //const animListCulled = renderList.filter(item => item.isRunning === true); // filter is slow
          //animListCulled && animListCulled.forEach(item => { if (item.isRunning && item.isAnimatable) this.xdx.isoMap.shrTileFrame(item, item.animFrameIDStart, item.animFrameIDEnd) });

          //fastest: animate visible only
          renderList && renderList.forEach(item => { item.isAnimatable && item.isRunning && this.xdx.isoMap.shrTileFrame(item, item.animFrameIDStart, item.animFrameIDEnd); });
        }
      })
      */


      const map = this.xdx.isoMap;
      //map.data2D = new Array(map.tilemapConfig.height);
      for (let tileY = 0; tileY < map.tilemapConfig.height; tileY++) {
        //map.data2D[tileY] = new Array(map.tilemapConfig.width);
        for (let tileX = 0; tileX < map.tilemapConfig.width; tileX++) {
          map.setDataObject(tileX, tileY, { // compact object-data to 2 bytes (16 bit)
            assetID: map.tilemapConfig.assetKeys.indexOf("Asset_ISO60_Texturepack"),  // 8bit = 0..3; 16bit = 0..63; index of texture to use for frameselection
            frameID: 0, // 8bit = 0..63; 16bit = 0..127; framenumber in texture; defaults to 0
            hidden: Phaser.Math.Between(0,9) === 0 ? 1 : 0, // optional
            flipX: Phaser.Math.Between(0,9) === 0 ? 1 : 0, // optional
            flipY: 0, //optional
            //optional:: depth: 0,                       // rendering sort-order; defaults to 0 (no sorting === faster)
            //optional:: alpha: 0.0 .. 1.0
            //optional:: tint: Phaser.Math.Between(0xdddddd, 0xeeeeee),
            //optional:: z: 0,                           // z-coordinate of tile (technically its y' = y - z)

            //computed@runtime:: tileX: tileX,
            //computed@runtime:: tileY: tileY,
          });

          // set frameID:: randomize some frames
          switch (Phaser.Math.Between(0,9)) {
            case 0: map.setDataProperty(tileX,tileY, "frameID", Phaser.Math.Between(0, 30)); break; // animation state of boy (0 .. 30)
            case 1: map.setDataProperty(tileX,tileY, "frameID", 31); break; // boy, not animatable
            default:map.setDataProperty(tileX,tileY, "frameID", 32); break; // empty block
          };

        } // of for X
      } // of for Y

      //global.log(">>>>>>>>>>>>>>>>>>>>", map.buffer.byteLength, map.bufferview[0]);

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


      const geohashDivider = 2; // 2 to 8
      const geohashExponent = geohash.calcExponent(geohashDivider, this.xdx.isoMap.tilemapConfig.width, this.xdx.isoMap.tilemapConfig.height); // dimXY needs to be fit power(divider, x) with x is an integer
      const ghash = geohash.point2hash(tileXY.x, tileXY.y, geohashDivider, geohashExponent); // '2AAAAAAAAADAAD' => divider 2; exponent = length(hash) = 13 -> maxDimXY = power(divider, exponent) = 2^13 = 8192 => ALLOWED MAP = 8192 x 8192
      const grect = geohash.hash2rect(ghash, 0);


      global.log("click ::tile:: ", pointer, this.xdx.isoMap, tile, tile && tile.tileX, tile && tile.tileY, ghash, grect)


      if (tile) {
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
        //this.xdx.isoMap.setTileIsRunning(tile, !tile.isRunning);

        //this.xdx.isoMap.setTilesAssetkey(tile, "Asset_xdx_isocam60_single_block_1000"); // change texture (not just the frame of a texture) of tile
        //this.xdx.isoMap.setTilesAssetkey(tile, "Asset_watchtower_lvl2_512x512"); // change texture (not just the frame of a texture) of tile
        //this.xdx.isoMap.setTilesProperty(tile, "z", 200)

        /*
        const objectLayer = {
          assetkey: "Asset_watchtower_lvl2_512x512",
          originX: 0.5, // origin of object
          originY: 1.0, // origin of object
          x: -15,
          y: 0,
          z: 50,
          visible: true,
        }
        this.xdx.isoMap.setTilesObjectLayer(tile, (tile.objectLayer) ? null : objectLayer); // change texture (not just the frame of a texture) of tile
        */
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
        case " ":           global.log("MAP DEBUG:: scene, cameras, cameras.main:: ", this, this.cameras, this.cameras.main); break;
        //case "a":           this.xdx.isoMap.map.data2DFull.forEach(arr => arr.forEach(item => item.isRunning = !item.isRunning)); break;
        //case "s":           this.xdx.isoMap.removeTimer(); break;
        //case "q":           global.log("animation::", this.xdx.isoMap.shlTileFrame(this.xdx.isoMap.getTileByTileCoords(0,0)).frameID); break;
        //case "w":           global.log("animation::", this.xdx.isoMap.shrTileFrame(this.xdx.isoMap.getTileByTileCoords(0,0)).frameID); break;
        case "s":
          global.log("MAP DEBUG:: ", this.xdx.isoMap.buffer.length, this.xdx.isoMap.dataview.byteLength, this.xdx.isoMap.dataview);

          indexedDB.saveDataview(this.xdx.isoMap.dataview);
          break;
        default: break;
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


    if (this.updateTicker % 10 === 0) { // do something frame based here
      const phaserGameVisible = Boolean(store.appState.app.watchers.route.pathname === "/game/phaser"); // check if game-modal is visible
      this.input.enabled = phaserGameVisible; // enable / disable pointer/touch-events
      this.input.keyboard.enabled = phaserGameVisible; // enable / disable keyboard-events
    }

    // touch-actions
    this.handleInteractions(time, this.cameras.main, this.input.pointer1, this.input.pointer2);


    //this.updatePointerEvents(time, this.cameras.main, this.input.pointer1, this.input.pointer2, );
  } // of update

} // of class

export default SceneClass;
