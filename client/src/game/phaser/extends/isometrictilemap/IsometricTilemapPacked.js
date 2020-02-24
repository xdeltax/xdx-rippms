//https://www.monterail.com/blog/pwa-offline-dynamic-data

/**
 * @author       xdeltax <github.com/xdeltax>
 * @copyright    2019/2020 xdx
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 *
 * very fast implementation of isometric tilemaps for phaser 3
 */

import * as Phaser from 'phaser'

import IsoWebGLRenderer from "./IsoWebGLRenderer";
import IsoCanvasRenderer from "./IsoCanvasRenderer";

export default class IsometricTilemap extends Phaser.GameObjects.Blitter { // based on blitter
  initDone = false;

  constructor (scene, x, y, tilemapConfig) {
    if (!isNaN(x)) x = 0;
    if (!isNaN(y)) y = 0;
    if (!tilemapConfig) tilemapConfig = { width:1, height:1, tileWidth : 64, tileHeight: 32, paddingBottom: 0, assetKeys: [], };

    super(scene, x, y, );
    /*
      super(...)
        Blitter(scene, x, y, texture, frame)
          GameObject.call(this, scene, 'Blitter');
            GameObject(scene, type)
              EventEmitter.call(this);
              this.scene = scene; // The Scene to which this Game Object belongs.
              this.type = type; // A textual representation of this Game Object, i.e. `sprite`.
              ...
          this.setTexture(texture, frame);
          this.setPosition(x, y);
          this.initPipeline();
          this.children = new List(); // This List contains all of the Bob objects created by the Blitter.
          this.renderList = []; // A transient array that holds all of the Bobs that will be rendered this frame.
          this.dirty = false;
    */

    this.scene.add.existing(this); // add this GameObject to scene

    //this.data2DFull = [];
    this.destroyDataBuffer();

    this.children = []; // *** unused *** // new Phaser.Structs.List();
    this.cullList = [];

    // statistics
    this.timeInMS_cullViewport = 0;
    this.timeInMS_setMap = 0;
    this.timeInMS_sortList = 0;

    // set defaults
    this.setAssetIDs(tilemapConfig.assetKeys);

    this.setDebug();
    this.setParentMap();
    this.setCamera(); // default camera to run cull() against
    this.setPosition();
    this.setExtraTilesToCull();

    // properties the renderer uses
    this.setScrollFactor(); // always 1.0 ---> do not change!
    this.setAlpha(1);

    // process map-data
    this.initMap(tilemapConfig); // init an empty layer, texture and frame

    this.initDone = true;
  }

  preDestroy = () => { // override blitter.predestroy because this.children.destory() is a fkn joke in terms of speed. every single item is removed one by one. lol for 1 mio or more items (tiles).
    this.cullList = [];
	  this.children = [];
    this.renderList = [];

    this.assetIDs = [];

    this.destroyDataBuffer();
  }


  initMap = (tilemapConfig) => {
    if (!tilemapConfig) tilemapConfig = { };

    const now = new Date();

    this.tilemapConfig = tilemapConfig;
    //this.map = map;
    //this.map = {...layer}
    //this.map = Object.assign( {}, layer);
    //this.map = Object.assign( Object.create( Object.getPrototypeOf(layer)), layer);

    this.tilePaddingBottom= tilemapConfig.hasOwnProperty("paddingBottom") ? tilemapConfig.paddingBottom : 0; // y-position of bottom-spike in pixels, messured from bottom

    this.tileWidth  = tilemapConfig.tileWidth;
    this.tileHeight = tilemapConfig.tileHeight;

    this.tileWidth2  = this.tileWidth  / 2;
    this.tileHeight2 = this.tileHeight / 2;

    // calculate width and height of surrounding rectangle (left-spike to right-spike / top-spike to bottom-spike)
    const sumWidthHeight = this.tilemapConfig.width + this.tilemapConfig.height;
    this.width  = sumWidthHeight * this.tileWidth2;
    this.height = sumWidthHeight * this.tileHeight2;
    if (sumWidthHeight === 1) { // special case for mapWidth = mapHeight = 1
      this.width = this.tileWidth;
      this.height= this.tileHeight;
    }

    this.width2 = this.width / 2
    this.height2= this.height / 2;

    this.timeInMS_setMap = new Date() - now;
    this.isDebug && global.log("isometricTilemap:: setTilemapLayer:: time (in ms):: ", this.timeInMS_setMap, );

    //this.allocateDataBuffer()

    this.triggerRender(); // trigger new render
    return this;
  }


  ///////////////////////////////////////////////////////////
  ///
  // handling the data-2d-array in a memory-efficient way
  ///
  ///////////////////////////////////////////////////////////

  destroyDataBuffer = () => {
    this.bufferview = null;
    this.dataview = null;
    this.buffer = null;
  }

  linkDataBuffer = (buffer, bytes) => {
    //this.buffer = buffer;
    this.allocateDataBuffer(buffer, bytes);
    return this;
  }

  allocateDataBuffer = (buffer, bytes) => {
    this.bufferbytes = bytes || 2;

    this.buffer = buffer || new ArrayBuffer(this.bufferbytes * this.tilemapConfig.width * this.tilemapConfig.height); // this.buffer.length
    this.dataview = new DataView(this.buffer);
    /*
    switch (bytes) {
      default: this.bufferview = new Uint8Array(this.buffer); break; // this.bufferview.byteLength
      case 2: this.bufferview = new Uint16Array(this.buffer); break;
      case 4: this.bufferview = new Uint32Array(this.buffer); break;
    }
    */
    // bytes = 1;
    // map 5'000 x 5'000 = 23mb
    // map 10'000 x 10'000 = 95mb
    // map 15'000 x 15'000 = 215mb
    // map 20'000 x 20'000 = 382mb
    // map 25'000 x 25'000 = 596mb

    // bytes = 2;
    // map 5'000 x 5'000 = 46mb
    // map 10'000 x 10'000 = 190mb
    // map 15'000 x 15'000 = 429mb

    return this;
  }

  setDataProperty = (tileX, tileY, prop, value) => {
    const obj = this.getDataObject(tileX, tileY);
    if (!obj) return;
    obj[prop] = value || 0;
    this.setDataObject(tileX, tileY, obj);
  }

  setDataObject = (tileX, tileY, obj) => {
    if (!this.dataview) return; //if (!this.bufferview) return;
    try {
      // 8bit-stuff:: frameID (6bit) assetID(2bit)
      // frameID 63 -> hex 00111111 << 2 = 11111100
      // assetID  3 -> hex xxxxxx11
      //const bit8 = (frameID << 2) + assetID;
      //this.dataview.setUint8(tileX + tileY * this.tilemapConfig.width, bit8); // uses always big-endian
      //this.bufferview[tileX + tileY * width] = bit8; // assetID 2bit 0..3; frameID 6bit 0..63

      // 16bit-stuff:: frameID(7bit) assetID(6bit) flipX(1bit) flipY(1bit) hidden(1bit)
      const bit16 = (Number(obj.frameID || 0) << 9)   // frameID 127 -> hex 00000000 01111111 << 9 = 11111110 00000000
                  + (Number(obj.assetID || 0) << 3)   // assetID  63 -> hex 00000000 00111111 << 3 = fffffff1 11111000
                  + (Number(obj.flipX   || 0) << 2)   // flipX     1 -> hex 00000000 00000001 << 2 = fffffffa aaaaax00
                  + (Number(obj.flipY   || 0) << 1)   // flipY     1 -> hex 00000000 00000001 << 1 = fffffffa aaaaaxy0
                  + (Number(obj.hidden  || 0)     );  // hidden    1 -> hex 00000000 00000001 << 0 = fffffffa aaaaaxyh
      this.dataview.setUint16(this.bufferbytes * (tileX + tileY * this.tilemapConfig.width), bit16); // uses always big-endian
      //this.bufferview[tileX + tileY * this.tilemapConfig.width] = bit16; // uses plattform endian
    } catch(error) {
      // fail silently
    }
  }

  getDataObject = (tileX, tileY) => {
    if (!this.dataview) return null; //if (!this.bufferview) return null;
    try {
      //const bit8  = this.dataview.getUint8(this.bufferbytes * (tileX + tileY * this.tilemapConfig.width));
      //const bit8 = this.bufferview[tileX + tileY * this.tilemapConfig.width];
      //const assetID = bit8 & 3;   // 3 === 0x11000000
      //const frameID = bit8 >>> 2; // shift 2 bits -> remove aa and fill with 0

      const bit16 = this.dataview.getUint16(this.bufferbytes * (tileX + tileY * this.tilemapConfig.width)); //const bit16 = this.bufferview[tileX + tileY * this.tilemapConfig.width];

      const hidden  = bit16 & 1;          // fffffffa aaaaaxyh & 0x00000000 00000001 -> h
      const flipY   = (bit16 >>> 1) & 1;  // 0fffffff aaaaaaxy & 0x00000000 00000001 -> y
      const flipX   = (bit16 >>> 2) & 1;  // 00ffffff faaaaaax & 0x00000000 00000001 -> x
      const assetID = (bit16 >>> 3) & 63; // 000fffff ffaaaaaa & 0x00000000 00111111 -> aaaaaa
      const frameID = (bit16 >>> 9) & 127;// 00000000 0fffffff & 0x00000000 01111111 -> fffffff

      return { // item
        // required
        assetID: assetID,
        frameID: frameID,

        // optional (or 0)
        flipX: flipX || 0,
        flipY: flipY || 0,
        hidden: hidden || 0,

        // unsupported for now
        z: 0,
        depth: 0,
        alpha: 1.0,
        tint: 0xffffff,

        // computed:: insert tileX/Y information, because its lost in a transformation from the 2d-array to an 1d-array in getRenderList / cullList
        tileX: tileX,
        tileY: tileY
      }
    } catch(error) {
      return null;
    }
  }


  ///////////////////////////////////////////////////////////
  ///
  // helper
  ///
  ///////////////////////////////////////////////////////////

  isValidTileCoords = (tileX, tileY) => {
    return Boolean(!isNaN(tileX) && !isNaN(tileY) && tileX >= 0 && tileY >= 0 && tileX < this.tilemapConfig.width && tileY < this.tilemapConfig.height);
  }

  getTileByTileCoords = (tileX, tileY) => {
    if (isNaN(tileY) && (tileX instanceof Object) && tileX.hasOwnProperty("x") && tileX.hasOwnProperty("y")) { tileY = tileX.y; tileX = tileX.x; }
    //if (tileY < 0 || tileY >= this.data2D.length) return null;
    //if (tileX < 0 || tileX >= this.data2D[tileY].length) return null;
    return this.getDataObject(tileX, tileY); // (this.data2D[tileY] || [])[tileX];
  }

  _getTextureByKey = (assetkey) => { // imput:: key (name of texture / asset) OR texture
    const texture = this.scene.textures.get(assetkey); // phaser/textures/textureManager:: fallback to __MISSING
    texture.frameNames = this._getFrameNamesByTexture(texture, true, false);
    return texture;
    //return this.scene.sys.textures.get(key);
  }

  _getFrameCountByTexture = (texture) => {
    return (texture) ? texture.frameTotal - 1 : null; // return without __BASE-frame
  }

  _getFrameNamesByTexture = (texture, doSort, includeBase) => {
    if (!texture || !texture.frames || texture.frames.length <= 0) return [];
    const out = texture.getFrameNames(includeBase);
    return (doSort) ? out.sort() : out;
  }

  _getFrameFromTexture = (texture, frameID) => {
    if (!texture.hasOwnProperty("frameNames")) texture.frameNames = this._getFrameNamesByTexture(texture, true, false);
    const frameName = (frameID >= 0 && frameID < texture.frameNames.length) ? texture.frameNames[frameID] : "";
    //global.log("frameNames:: ", texture, texture.frameNames)
    //return texture.frames[frameName] || texture.frames["__BASE"];
    return texture.get(frameName); // safe
  }


  setTileFrameByID = (item, frameID, min, max) => { // frameID / animation sequence is ordered by filename of each frame
    if (isNaN(min)) min = 0;
    if (isNaN(max)) max = this.getTextureFrameCount(item.assetID) - 1; // item.frameTotal - 1;

    item.frameID = (frameID >= min && frameID <= max) ? frameID : min;
    return item;
  }

  shrTileFrame = (item, min, max) => { // frameID / animation sequence is ordered by filename of each frame
    if (isNaN(min)) min = 0;
    if (isNaN(max)) max = this.getTextureFrameCount(item.assetID) - 1; // item.frameTotal - 1;

    const frameID = (item.frameID < max) ? item.frameID + 1 : min;
    return this.setTileFrameByID(item, frameID);
  }

  shlTileFrame = (item, min, max) => { // frameID / animation sequence is ordered by filename of each frame
    if (isNaN(min)) min = 0;
    if (isNaN(max)) max = this.getTextureFrameCount(item.assetID) - 1; // item.frameTotal - 1;

    const frameID = (item.frameID > min) ? item.frameID - 1 : max;
    this.setTileFrameByID(item, frameID)
    return this.setTileFrameByID(item, frameID);
  }


  ///////////////////////////////////////////////////////////
  ///
  // map
  ///
  ///////////////////////////////////////////////////////////

  setCamera = (camera) => { // set camera (worldview) to use culling-function against
    if (!camera) camera = this.scene.cameras.main;
    this.camera = camera;
    this._cameraWorldView = {...this.camera.worldView};
    return this;
  }

  setParentMap = (map) => { // set camera (worldview) to use culling-function against
    if (!map) map = null;
    this.parentMap = map;
    return this;
  }

  setAssetIDs = (arrayOfAssetKeys) => {
    this.assetIDs = [];

    if (arrayOfAssetKeys) {
      this.assetIDs = new Array(arrayOfAssetKeys.length);
      arrayOfAssetKeys.forEach((assetkey, arrayIndex) => {
        const texture = this._getTextureByKey(assetkey);
        const frameTotal = this._getFrameCountByTexture(texture) + 1;

        if (frameTotal) {
          this.assetIDs[arrayIndex] = new Array(frameTotal);
          for (let frameID = 0; frameID < frameTotal; frameID++) {
            const frame = this._getFrameFromTexture(texture, frameID);
            this.assetIDs[arrayIndex][frameID] = frame;
            //global.log(">>>",arrayIndex, assetkey, frameID, this.assetIDs[arrayIndex][frameID])
          }
        };
      });
    }
  }

  getTextureFrame = (assetID, frameID) => (this.assetIDs && this.assetIDs[assetID]) ? this.assetIDs[assetID][frameID] : null;

  getTextureFrameCount = (assetID) => (this.assetIDs && this.assetIDs[assetID]) ? this.assetIDs[assetID].length : 0;

  getTextureFrameWidthHeight = (assetID, frameID) => {
    const frame = this.getTextureFrame(assetID, frameID);
    return {
      width : (frame) ? frame.width  : this.tileWidth,
      height: (frame) ? frame.height : this.tileHeight,
    }
  }


  ///////////////////////////////////////////////////////////
  ///
  // coordinate transformations
  ///
  ///////////////////////////////////////////////////////////

  worldCoordsToLocalCoords = (worldX, worldY) => { // world-coords === camera-world with zoom, camera.setPosition and isoMap.setPosition
    if (isNaN(worldY) && (worldX instanceof Object) && worldX.hasOwnProperty("x") && worldX.hasOwnProperty("y")) { worldY = worldY.y; worldX = worldX.x; }
    return { x: worldX - this.x, y: worldY - this.y } // neutralize isoMap.setPosition(x,y)
  }


  localCoordsToWorldCoords = (localX, localY) => { // world-coords === camera-world with zoom, camera.setPosition and isoMap.setPosition
    return { x: localX + this.x, y: localY + this.y } // neutralize isoMap.setPosition(x,y)
  }


  localCoordsToTileCoords = (localX, localY, ) => { // local-coords === world-coords without isoMap.setPosition
    if (isNaN(localY) && (localX instanceof Object) && localX.hasOwnProperty("x") && localX.hasOwnProperty("y")) { localY = localX.y; localX = localX.x; }

    const coordsystemShiftX = (this.tilemapConfig.height - 1) * this.tileWidth2;

    // undo coordinate-system shift
    const pixelX = localX - coordsystemShiftX;
    const pixelY = localY;

    // convert from screen-resolution to tile-resolution
    const tileXX = pixelX / this.tileWidth;
    const tileYY = pixelY / this.tileHeight;

    const origin = 0.5; // default:: center is 0.5; left spike is 0.0; right spike is 1.0; top spike is 0.0; bottom spike is 1.0

    // transform rotated tile-coords to normal tile-coords
    const tileXfloat = tileXX + tileYY - origin; // tileX=0 => normalX=0.00-0.99; tileX=1 => normalX=1.00-1.99;
    const tileYfloat = tileYY - tileXX + origin; // - (tileXX - tileYY - origin);

    return {
      x: Math.floor(tileXfloat), // tile 0 = tileFloat 0.0 to 0.99; tile x = tileFloat x.0 to x.99;
      y: Math.floor(tileYfloat),
      xFloat: tileXfloat, // each tile is normalized to 0.0000 .. 0.9999
      yFloat: tileYfloat,
    };
  }


  tileCoordsToLocalCoords = (tileX, tileY, frameWidth, frameHeight) => { // local-coords === world-coords without isoMap.setPosition
    if (!this.isValidTileCoords(tileX, tileY)) return null;

    if (isNaN(frameWidth) || isNaN(frameHeight)) { // fallback
      const item = this.getDataObject(tileX, tileY); // (this.data2D[tileY] || [])[tileX];
      const {width, height} = this.getTextureFrameWidthHeight(item.assetID, item.frameID);
      frameWidth = width;
      frameHeight= height;
    }

    //                  _______________________
    // x---------------- <--- (x) = top/left of frame
    // |       +       |               paddingTop
    // |     +++++     | _______________________
    // |      |+|      | <--- (+) = pixelX / pixelY -> position of top-spike of tile
    // |      / \      |
    // |     /   \     |
    // |    /     \    |
    // |   /       \   | _______       tileheight
    // |   \       /   |
    // |    \     /    |
    // |     \   /     |
    // |      \ /      |
    // |       +       | _______________________
    // |               |               paddingBottom (if "0" it is asumed that tile is verticaly centered in frame)
    // ----------------  _______________________
    //

    const origin = 0.5;

    // transform tile-coords to rotated coordinate-system (iso-coords)
    const tileXX = (tileX - tileY) / 2; // still tile-coords but rotated (top/left is now transformed to top-spike)
    const tileYY = tileY + tileXX;      // still tile-coords but rotated (top/left is now transformed to top-spike)

    // convert from tile-resolution to screen-resolution
    const pixelXTopSpike = tileXX * this.tileWidth;   // position: pixelX/pixelY = top-spike of tile (not top/left of frame)
    const pixelYTopSpike = tileYY * this.tileHeight;  // position: pixelX/pixelY = top-spike of tile (not top/left of frame)

    // if the frame-width (full-image) is greater than the tilewidth, calculate the padding (empty space left and right of tile)
    const pixelPaddingX = (frameWidth - this.tileWidth) / 2; // 0.5 left and 0.5 right
    const pixelPaddingY = (frameHeight- this.tileHeight) / 2; // 0.5 left and 0.5 right

    // 2d-tiles -> imageheight === tileheight; 3d-tiles -> imageheight > tileheight
    let paddingTop;
    let paddingBot;
    if (this.tilePaddingBottom === -1)  { // center tile in frame -> if paddingBottom === -1 it is asumed that tile is verticaly centered in frame
      paddingTop = pixelPaddingY;
      paddingBot = pixelPaddingY
    } else { // if paddingBottom >= it is asumed that tile is padded to the bottom of the frame or higher
      paddingBot = this.tilePaddingBottom;
      paddingTop = frameHeight - paddingBot - this.tileHeight;
    }

    // normalize map-position in world::
    // before shift: left spike of tile(0, 0) is at position this.x = 0
    // after shift: left spike of left-most tile === tile(0, maxY) === left spike of map  is at position this.x = 0
    const coordsystemShiftX = (this.tilemapConfig.height - 1) * this.tileWidth2;
    //const coordsystemShiftY = 0;

    const frameXLeft = pixelXTopSpike - /*go from top-spike of tile to left of frame*/pixelPaddingX + /*shift coordinate-system*/coordsystemShiftX;
    const frameYTop  = pixelYTopSpike - /*go from top-spike of tile to top of frame */paddingTop;

    return { // top / left edge of surrounding rectangle (frame) of the tile
      x: frameXLeft,
      y: frameYTop,
      //frameCenterX: frameXLeft + this.frameWidth / 2,
      //frameCenterY: frameYTop  + this.frameHeight/ 2,
      //tileCenterX : frameXLeft + paddingLeft+ this.tileWidth2 or frameXLeft + frameWidth / 2
      //tileCenterY : frameYTop  + paddingTop + this.tileHeight2
    };
  }


  ///////////////////////////////////////////////////////////
  ///
  // coordinate-getters
  ///
  ///////////////////////////////////////////////////////////

  getItemXY = (item) => (!item) ? null : this.tileCoordsToLocalCoords(item.tileX, item.tileY);

  getItemCenterXY = (item) => {
    if (!item) return null;
    const localXY = this.tileCoordsToLocalCoords(item.tileX, item.tileY);
    const dim = this.getTextureFrameWidthHeight(item.assetID, item.frameID);
    return { x: (localXY.x || 0) + (dim.width || 0) / 2, y: (localXY.y || 0) + (dim.height || 0) / 2 };
  }

  getItemTileBottomXY = (item) => {
    if (!item) return null;
    const localXY = this.tileCoordsToLocalCoords(item.tileX, item.tileY);
    const centerXY = this.getItemCenterXY(item);
    const dim = this.getTextureFrameWidthHeight(item.assetID, item.frameID);
    return { x: centerXY.x || 0, y: (localXY.y || 0) + (dim.height || 0) - this.tilePaddingBottom };
  }

  getItemTileCenterXY = (item) => {
    if (!item) return null;
    const centerXY = this.getItemCenterXY(item);
    const tileBottomXY = this.getItemTileBottomXY(item);
    // center of the tile-diamaond. tile-center is not equal frame-center for "3D"-tiles or tiles with asymetric padding
    return { x: centerXY.x || 0, y: (tileBottomXY.y || 0) - this.tileHeight2 };
  }

  getItemTileTopXY = (item) => {
    const centerXY = this.getItemCenterXY(item);
    const tileCenterXY = this.getItemTileCenterXY(item);
    // center of the tile-diamaond. tile-center is not equal frame-center for "3D"-tiles or tiles with asymetric padding
    return { x: centerXY.x || 0, y: (tileCenterXY.y || 0) - this.tileHeight2 };
  }


  ///////////////////////////////////////////////////////////
  ///
  // camera-cull stuff
  ///
  ///////////////////////////////////////////////////////////

  setExtraTilesToCull = (value) => {
    this.extraTilesToCull = (!isNaN(value)) ? value : 1; // default 1 is fine for ISOM60°. for ISO75° it is not enough.
    return this;
  }


  cullByViewport = (camera) => { // called by render function via this.getRenderList() -> high performance cull -> dont search complete childrenlist -> only search for tiles in viewport
    if (!camera) camera = this.camera; // camera (worldview) to use culling-function against

    this.sortChildrenFlag   = false; // if one (or more) items has a .depth > 0 -> trigger sort on every rerender

    const now = new Date();

    let cullList = [];

    // bounds in pixel-coords
    let locTL = this.worldCoordsToLocalCoords(camera.worldView.left, camera.worldView.top); // top/left
    let locTR = this.worldCoordsToLocalCoords(camera.worldView.right, camera.worldView.top); // top/left
    let locBL = this.worldCoordsToLocalCoords(camera.worldView.left, camera.worldView.bottom); // bottom/right
    let locBR = this.worldCoordsToLocalCoords(camera.worldView.right, camera.worldView.bottom); // bottom/right

    // add some extra tiles to top/left
    locTL.x = locTL.x - this.extraTilesToCull * this.tileWidth;
    locTL.y = locTL.y - (this.extraTilesToCull + 1) * this.tileHeight; // add another one because item.height could be greater than tileHeight for 3d-tiles

    // pixel-coords to tile-coords
    const tileTL = this.localCoordsToTileCoords(locTL.x, locTL.y);
    const tileBR = this.localCoordsToTileCoords(locBR.x, locBR.y);
    const tileTR = this.localCoordsToTileCoords(locTR.x, locTR.y);
    const tileBL = this.localCoordsToTileCoords(locBL.x, locBL.y);

    // min / max
    const minX = Math.min(tileTL.x, tileTR.x, tileBL.x, tileBR.x); // -> tileTL.x
    const maxX = Math.max(tileTL.x, tileTR.x, tileBL.x, tileBR.x); // -> tileBR.x
    const minY = Math.min(tileTL.y, tileTR.y, tileBL.y, tileBR.y); // -> tileTR.x
    const maxY = Math.max(tileTL.y, tileTR.y, tileBL.y, tileBR.y); // -> tileBL.x

    // a very excact and crazy fast culling (independant from map-size)
    for (let tileY = minY; tileY <= maxY; tileY++) {
      for (let tileX = minX; tileX <= maxX; tileX++) {
        if (tileX >= 0 && tileY >= 0 && tileX < this.tilemapConfig.width && tileY < this.tilemapConfig.height) {

          const item = this.getDataObject(tileX, tileY); // (this.data2D[tileY] || [])[tileX] || null;

          if (item && !isNaN(item.assetID) && item.frameID >= 0 && !item.hidden) {
            const frameDim = this.getTextureFrameWidthHeight(item.assetID, item.frameID);
            const localXY = this.tileCoordsToLocalCoords(tileX, tileY, frameDim.width, frameDim.height); // item.frame must exist before this function is called

            if ( localXY.x >= locTL.x  // is inside cameras worldview-bounds
              && localXY.x <= locBR.x
              && localXY.y >= locTL.y
              && localXY.y <= locBR.y
            ) {
              // add item to renderlist
              cullList.push(item);

              // if one (or more) items has a depth > 0 -> activate depth-sorting in prerender-function
              if (!this.sortChildrenFlag && item.depth > 0) this.sortChildrenFlag = true;
            }
          }
        } // of for
      } // of for
    }

    this.timeInMS_cullViewport = new Date() - now;
    this.isDebug && global.log("isometricTilemap:: cullByViewport:: time (in ms):: ", this.timeInMS_cullViewport, cullList, camera);

    return cullList;
  }


  ///////////////////////////////////////////////////////////
  ///
  // depth-sort stuff
  ///
  ///////////////////////////////////////////////////////////

  sortList = (list, comp) => { // called by render function via this.getRenderList() if one or more elements of list has .depth != 0
    if (!list || list.length < 1) return [];

    const now = new Date();

    const listSorted = this.stableSort(list, comp);

    this.timeInMS_sortList = new Date() - now;
    this.isDebug && global.log("isometricTilemap:: sortList:: time (in ms):: ",this.timeInMS_sortList, listSorted, list);

    return listSorted;
  }


  stableSort = (arr, comp) => {
    return this._stableSortExec(arr.slice(), comp);
  };


  stableSortInplace = (arr, comp) => {
    var result = this._stableSortExec(arr, comp);
    // This simply copies back if the result isn't in the original array, which happens on an odd number of passes.
    if (result !== arr) { this._stabelSortPass(result, null, arr.length, arr);
    }
    return arr;
  };


  // Phaser3: ./utils/array/StableSort.js
  // Execute the sort using the input array and a second buffer as work space.
  // Returns one of those two, containing the final result.
  _stableSortExec = (arr, comp) => {
    if (typeof(comp) !== 'function') { comp = (a, b) => { return String(a).localeCompare(b); }; }
    // Short-circuit when there's nothing to sort.
    var len = arr.length;
    if (len <= 1) { return arr; }
    // Rather than dividing input, simply iterate chunks of 1, 2, 4, 8, etc.
    // Chunks are the size of the left or right hand in merge sort.
    // Stop when the left-hand covers all of the array.
    var buffer = new Array(len);
    for (var chk = 1; chk < len; chk *= 2) {
      this._stabelSortPass(arr, comp, chk, buffer);
      var tmp = arr;
      arr = buffer;
      buffer = tmp;
    }
    return arr;
  }
  // Run a single pass with the given chunk size.
  _stabelSortPass = (arr, comp, chk, result) => {
    var len = arr.length;
    var i = 0;
    var dbl = chk * 2; // Step size / double chunk size
    var l, r, e; // Bounds of the left and right chunks.
    var li, ri; // Iterators over the left and right chunk.
    // Iterate over pairs of chunks.
    for (l = 0; l < len; l += dbl) {
      r = l + chk;
      e = r + chk;
      if (r > len) r = len;
      if (e > len) e = len;
      // Iterate both chunks in parallel.
      li = l;
      ri = r;
      while (true) {
        if (li < r && ri < e) { // Compare the chunks.
          // This works for a regular `sort()` compatible comparator, but also for a simple comparator like: `a > b`
          if (comp(arr[li], arr[ri]) <= 0) { result[i++] = arr[li++]; } else { result[i++] = arr[ri++]; }
        }
        // Nothing to compare, just flush what's left.
        else if (li < r) { result[i++] = arr[li++]; }
        else if (ri < e) { result[i++] = arr[ri++]; }
        else { break; } // Both iterators are at the chunk ends.
      }
    }
  };

  ///////////////////////////////////////////////////////////
  ///
  // BETA:: animation stuff
  ///
  ///////////////////////////////////////////////////////////

  preUpdate = (time, delta) => {
    // ...
  };



  ///////////////////////////////////////////////////////////
  ///
  // render stuff
  ///
  ///////////////////////////////////////////////////////////

  /**
   * Returns an array of Bobs to be rendered.
   * If the Blitter is dirty then a new list is generated and stored in `renderList`.
   * @return {Phaser.GameObjects.Bob[]} An array of Bob objects that will be rendered this frame.
   */
  getRenderList = () => {// used in Blitter.Renderer
    if (this.initDone) {
      if ( this._cameraWorldView.x !== this.camera.worldView.x
        || this._cameraWorldView.y !== this.camera.worldView.y
        || this._cameraWorldView.width !== this.camera.worldView.width
        || this._cameraWorldView.height!== this.camera.worldView.height
      ) { // check for changes in camera-view
        this._cameraWorldView = {...this.camera.worldView};
        this.dirty = true; // trigger new cull
      }

      if (this.dirty) { // refresh renderList on dirty
        this.sortChildrenFlag = false;

        // create a list with tiles that are inside of the cameras worldview
        this.cullList = this.cullByViewport(this.camera); // sortChildrenFlag is checked / set here

        // sort this list if one element has a depth <> 0
        this.renderList = (this.sortChildrenFlag) ? this.sortList(this.cullList, (itemA, itemB) => itemA.depth - itemB.depth) : this.cullList;

        if (this.isDebug) this.renderDebug(this.debugGraphics, this.renderList);

        this.dirty = false;
      }
    }
    return this.renderList;
  }


  renderWebGL = (...params) => { IsoWebGLRenderer(...params); /* (renderer, src, interpolationPercentage, camera, parentMatrix) */ }
  renderCanvas = (...params) => { IsoCanvasRenderer(...params); /* (renderer, src, interpolationPercentage, camera, parentMatrix) */ }
  triggerRender = () => { this.dirty = true; }


  ///////////////////////////////////////////////////////////
  ///
  // default properties
  ///
  ///////////////////////////////////////////////////////////

  setScrollFactor = (x, y) => { // disable scrollfactor -> always 1.0
      if (!isNaN(x)) x = 1;
      if (!isNaN(y)) y = x;
      this.scrollFactorX = 1;
      this.scrollFactorY = 1;
      return this;
  }

  setAlpha = (value) => {
    this.alpha = isNaN(value) ? 1 : value;
    return this;
  }


  ///////////////////////////////////////////////////////////
  ///
  // debug stuff
  ///
  ///////////////////////////////////////////////////////////

  setDebug = (debug, debugGraphics, ) => {
    if (!debug) debug = false;
    this.debugGraphics = debugGraphics || null;
    this.isDebug = debug;
    return this;
  }


  renderDebug = (graphics, items, styleConfig) => {
    if (!this.isDebug || !graphics) return;

    if (items) items.forEach(item => {
      if (
        //   (item.tileX===0 && item.tileY===0)                                 // top spike
        //|| (item.tileX===0 && item.tileY===this.tilemapConfig.height-1)                 // left spike
        //|| (item.tileX===this.tilemapConfig.width-1 && item.tileY===0)                  // right spike
         (item.tileX===this.tilemapConfig.width-1 && item.tileY===this.tilemapConfig.height-1)  // bottom spike
      ) { // render only at the spikes
        let w;

        // surrounding rectangle of full-texture frame
        w = this.tileCoordsToLocalCoords(item.tileX, item.tileY, item.assetID, item.frameID);
        w = this.localCoordsToWorldCoords(w.x, w.y);
        graphics.lineStyle(1, 0xffff00, 0.5).strokeRectShape({x: w.x, y: w.y, width: item.width, height: item.height,});

        const centerXY = this.getItemCenterXY(item);
        const itemXY = this.getItemXY(item);
        const tileCenterXY = this.getItemTileCenterXY(item);

        // surrounding rectangle of full-texture frame
        w = this.localCoordsToWorldCoords(item.x, item.y);
        graphics.lineStyle(1, 0xfd9099, 1.0).strokeRectShape({x: w.x, y: w.y, width: item.width, height: item.height,});

        // position of image center
        w = this.localCoordsToWorldCoords(centerXY.x, centerXY.y);
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(w.x - item.width / 4, w.y, w.x + item.width / 4, w.y);
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(w.x, w.y - this.tileHeight2 / 4, w.x, w.y + this.tileHeight2 / 4);

        // position of bottom tile-spike (messured from top / left)
        w = this.localCoordsToWorldCoords(centerXY.x, itemXY.y + item.height - this.tilePaddingBottom);
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(w.x - item.width / 4, w.y, w.x + item.width / 4, w.y);

        // position of left / right tile-spikes (messured from top / left)
        w = this.localCoordsToWorldCoords(centerXY.x, itemXY.y + item.height - this.tileHeight2 - this.tilePaddingBottom);
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(w.x - item.width / 2, w.y, w.x + item.width / 2, w.y);
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(w.x, w.y - this.tileHeight2, w.x, w.y + this.tileHeight2);

        // tile diamond
        w = this.localCoordsToWorldCoords(tileCenterXY.x, tileCenterXY.y);
        const leftSpike  = { x: w.x - this.tileWidth2, y: w.y }
        const rightSpike = { x: w.x + this.tileWidth2, y: w.y }
        const topSpike   = { x: w.x, y: w.y - this.tileHeight2 }
        const bottomSpike= { x: w.x, y: w.y + this.tileHeight2 }
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(leftSpike.x, leftSpike.y, topSpike.x, topSpike.y);
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(topSpike.x, topSpike.y, rightSpike.x, rightSpike.y);
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(rightSpike.x, rightSpike.y, bottomSpike.x, bottomSpike.y);
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(bottomSpike.x, bottomSpike.y, leftSpike.x, leftSpike.y);
      }
    });

    // outer bounds of map
    graphics.lineStyle(1, 0xffaaaa, 1.0).strokeRectShape({x: this.x, y: this.y, width: this.width, height: this.height,});

    // center-cross of map
    graphics.lineStyle(1, 0xffaaaa, 1.0).lineBetween(this.x - 50, this.y + this.height2, this.x + this.width + 50, this.y + this.height2);
    graphics.lineStyle(1, 0xffaaaa, 1.0).lineBetween(this.x + this.width2, this.y - 50, this.x + this.width2, this.y + this.height + 50);

    //this.debugGraphics.strokeRectShape({x: localXY.x, y: localXY.y, width: this._tileWidth, height: this._tileHeight,});
    //this.debugGraphics.lineStyle(1, 0xffffff, 1).strokeRectShape({x: item.x, y: item.y, width: item.width, height: item.height,});
    //const drect = {x: 10, y: 10, width: 100, height: 100,}
    //this.xdx.debugGraphics.strokeRectShape(drect);  // rect: {x, y, width, height}
    //this.xdx.debugGraphics.fillRectShape(drect); // rect: {x, y, width, height}
    //this.xdx.debugGraphics.fillRect(x, y, width, height);
    //this.xdx.debugGraphics.strokeRect(x, y, width, height);
    //this.debugGraphics.fillCircle(wLeft+100, camera.worldView.top+100, 50);


  } // of debug
} // of class
