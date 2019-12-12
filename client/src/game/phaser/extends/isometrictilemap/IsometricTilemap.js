/**
 * @author       xdeltax <github.com/xdeltax>
 * @copyright    2019 xdx
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 *
 * very fast implementation of isometric tilemaps for phaser 3
 */

import * as Phaser from 'phaser'

import IsoWebGLRenderer from "./IsoWebGLRenderer";
import IsoCanvasRenderer from "./IsoCanvasRenderer";

export default class IsometricTilemap extends Phaser.GameObjects.Blitter { // based on blitter
  initDone = false;

  constructor (scene, x, y, mapData, mapConfig) { 
    if (!isNaN(x)) x = 0;
    if (!isNaN(y)) y = 0;
    if (!mapConfig) mapConfig = { tileWidth : 64, tileHeight: 32, paddingBottom: 0, };
    if (!mapData) mapData = { width : 0, height: 0, data2D: null, };

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

    // set defaults
    this.timers = [];
    this.timerTicker = 0;
    this.children = []; //  new List(); // This List contains all of the Bob objects created by the Blitter.
    this.cullList = [];
    this.animList = [];
    this.animSyncToFrames = 0;
    this.animLastTime = 0;
    this.animateCulledOnly= false; // if true, only the items are animated if they are inside camera-worldview (culllist); if false, all animatable-item will 

    // statistics
    this.timeInMS_cullViewport = 0;
    this.timeInMS_setMap = 0;
    this.timeInMS_sortList = 0;

    // set defaults
    this.setDebug();
    this.setParentMap(); 
    this.removeTimer();
    this.setCamera(); // default camera to run cull() against
    this.setPosition();
    this.setExtraTilesToCull(); 
    this.setAnimateCulledOnly();

    // properties the renderer uses 
    this.setScrollFactor(); // always 1.0 ---> do not change!
    this.setAlpha(1);

    // process map-data
    this.setMap(mapData, mapConfig); // init an empty layer, texture and frame

    this.initDone = true;
  }

  preDestroy = () => {
    this.removeTimer();
    this.anims.destroy();
    this.anims = undefined;

    this.children = [];
    this.animList = [];
    this.cullList = [];
    this.renderList = [];
    super.preDestroy();
  }

  ///////////////////////////////////////////////////////////
  ///                                                     
  // helper
  ///                                                     
  ///////////////////////////////////////////////////////////

  isValidTileCoords = (tileX, tileY) => {
    return Boolean(!isNaN(tileX) && !isNaN(tileY) && tileX >= 0 && tileY >= 0 && tileX < this.map.width && tileY < this.map.height);
  }


  getTileUIDByTileCoords = (tileX, tileY) => { // return index or -1
    return this.isValidTileCoords(tileX, tileY) ? this.map.data2D[tileY][tileX].uid : -1;
  }


  getTileByTileCoords = (tileX, tileY) => {
    if (isNaN(tileY) && (tileX instanceof Object) && tileX.hasOwnProperty("x") && tileX.hasOwnProperty("y")) { tileY = tileX.y; tileX = tileX.x; } 
    if (tileY < 0 || tileY >= this.map.data2D.length) return null;
    if (tileX < 0 || tileX >= this.map.data2D[tileY].length) return null;
    return this.map.data2D[tileY][tileX];
  }

  setTileVisible  = (tile, value) => { return this.setTilesProperty(tile, "visible", value); } // this prop needs this.triggerRender(); 
  setTileDepth    = (tile, value) => { return this.setTilesProperty(tile, "depth"  , value); } // this prop needs this.triggerRender(); 
  setTileAlpha    = (tile, value) => { return this.setTilesProperty(tile, "alpha"  , value); } 
  setTileTint     = (tile, value) => { return this.setTilesProperty(tile, "tint"   , value); }
  setTileFlipX    = (tile, value) => { return this.setTilesProperty(tile, "flipX"  , value); }
  setTileFlipY    = (tile, value) => { return this.setTilesProperty(tile, "flipY"  , value); }
  setTileZ        = (tile, value) => { return this.setTilesProperty(tile, "z"      , value); }
  setTileIsRunning= (tile, value) => { return this.setTilesProperty(tile, "isRunning", value); }

  setTilesProperty= (tileList, property, value) => { // tileList:: tile or array of tiles
    if (tileList && property) {
      if (!Array.isArray(tileList)) tileList = [tileList];
      tileList && tileList.forEach(item => {
        if ( item.hasOwnProperty("tileX")
          && item.hasOwnProperty("tileY")
          && this.isValidTileCoords(item.tileX, item.tileY)
          && this.map.data2D[item.tileY][item.tileX].hasOwnProperty(property) 
        ) {
          this.map.data2D[item.tileY][item.tileX][property] = value;
          this.map.data2D[item.tileY][item.tileX].isAnimatable && property === "isRunning" && this._modifyAnimList(this.map.data2D[item.tileY][item.tileX], value);
        };
      });
      this._checkTriggerRenderByProperty(property) && this.triggerRender();
    };
    return this; 
  }

  _modifyAnimList = (item, value) => {
    if (value) { // add to list
      this.animList.push(item);
    } else { // remove from list
      this.animList = this.animList.filter( _item => { return _item !== item });
    }
  }

  _checkTriggerRenderByProperty = (property) => { // renderer is only dirty if something inside of getRenderList() change
   return (property === "visible"   // change item-count in getRenderList()
        || property === "alpha"     // change item-count in getRenderList()
        || property === "depth"     // trigger sort-algo in getRenderList()
        //|| property === "isRunning"
    );
  }

  /*
  setTileAssetkeyByTileCoords = (tileX, tileY, assetkey, frameID, isAnimatable, isRunning, animFrameIDStart, animFrameIDEnd) => {
    return this.isValidTileCoords(tileX, tileY) ? this.setTileAssetkey(this.map.data2D[tileY][tileX], assetkey, frameID, isAnimatable, isRunning, animFrameIDStart, animFrameIDEnd) : null;
  }

  // change texture (not just the frame of a texture) of tile
  setTilesAssetkey = (itemList, assetkey, frameID, isAnimatable, isRunning, animFrameIDStart, animFrameIDEnd) => {
    if (!itemList) return null;
    if (!Array.isArray(itemList)) itemList = [itemList];
    if (!assetkey) assetkey = ""; // key of texture to use 
    if (!frameID) frameID = 0;
    if (!isAnimatable) isAnimatable = false;
    if (!isRunning) isRunning = false;
    const texture = this.getTextureByKey(assetkey); // get texture from texturemanager (this.scene.textures)
    const frameTotal = this.getFrameCountByTexture(texture) || 0; // framecount used for boundary-checks (and animation-stuff)
    if (frameID < frameTotal) frameID = 0;
    const frame = this.getFrameFromTexture(texture, frameID);
    itemList.forEach(item => {
      item.assetkey = assetkey;
      item.frameTotal = frameTotal;
      item.isAnimatable = isAnimatable;
      item.isRunning = isRunning;
      item.animFrameIDStart = animFrameIDStart ? animFrameIDStart : 0;
      item.animFrameIDEnd = animFrameIDEnd ? animFrameIDEnd : item.frameTotal - 1;
      item.frameID = frameID;
      item.frame = frame;
      if (item.frame && (item.frame.width !== item.width || item.frame.height !== item.height)) {
        item.width = (item.frame) ? item.frame.width  : this.tileWidth;  
        item.height= (item.frame) ? item.frame.height : this.tileHeight; 
        item.centerX = item.x + item.width / 2;
        item.centerY = item.y + item.height/ 2;
        item.tileCenterX = item.centerX;
        item.tileCenterY = item.y + item.height - this.tileHeight2 - this.tilePaddingBottom;
      }
      this.map.data2D[item.tileY][item.tileX] = item;
    })
    return this;
  }
	*/
  setTileXYObjectLayer = (tileX, tileY, newObject) => {
  	return this.setTilesObjectLayer(this.map.data2D[tileY][tileX], newObject);
  }

  setTilesObjectLayer = (itemList, newObject) => {
    if (!itemList) return null;
    if (!Array.isArray(itemList)) itemList = [itemList];

    itemList.forEach(item => {
    	item.objectLayer = newObject;
      if (item.objectLayer) {
      	const obj = item.objectLayer;
        if (!obj.hasOwnProperty("assetkey")) obj.assetkey = ""; // key of texture to use 
        if (!obj.hasOwnProperty("frameID")) obj.frameID = 0;
        const objtexture = this.getTextureByKey(obj.assetkey);
        obj.frameTotal = this.getFrameCountByTexture(objtexture);
        obj.frame = this.getFrameFromTexture(objtexture, obj.frameID);

        if (!obj.hasOwnProperty("x")) obj.x = 0; // relative to item.tileCenterX
        if (!obj.hasOwnProperty("y")) obj.y = 0; // relative to item.tileCenterY
        if (!obj.hasOwnProperty("z")) obj.z = 0; // relative to item.z
        if (!obj.hasOwnProperty("visible")) obj.visible = true;
        if (!obj.hasOwnProperty("alpha"  )) obj.alpha = 1;
        if (!obj.hasOwnProperty("tint"   )) obj.tint = 0xffffff;
        if (!obj.hasOwnProperty("flipX"  )) obj.flipX = false;
        if (!obj.hasOwnProperty("flipY"  )) obj.flipY = false;
        if (!obj.hasOwnProperty("originX")) obj.originX = 0.5;
        if (!obj.hasOwnProperty("originY")) obj.originY = 1.0;

        if (!obj.hasOwnProperty("isAnimatable"    )) obj.isAnimatable = false;
        if (!obj.hasOwnProperty("isRunning"       )) obj.isRunning = false;
        if (!obj.hasOwnProperty("animFrameIDStart")) obj.animFrameIDStart = 0;
        if (!obj.hasOwnProperty("animFrameIDEnd"  )) obj.animFrameIDEnd = obj.frameTotal - 1;
      }
      this.map.data2D[item.tileY][item.tileX] = item;
    });
    
    return this;
	}


  /*
  setXYProperty = (tileX, tileY, property, value) => { 
    if (this.isValidTileCoords(tileX, tileY) && property) this.setTilesProperty(this.map.data2D[tileY][tileX], property, value);
    return this;
  }

  setXYProperty_unsafe = (tileX, tileY, property, value) => { // this is faster
    this.map.data2D[tileY][tileX][property] = value;
  }
  */

  getTextureByKey = (key) => { // imput:: key (name of texture / asset) OR texture
    const texture = this.scene.textures.get(key); // phaser/textures/textureManager:: fallback to __MISSING
    texture.frameNames = this.getFrameNamesByTexture(texture, true, false);
    return texture;
    //return this.scene.sys.textures.get(key);
  }

  /*
  getFrameCountByKey = (key) => { return this.getFrameCountByTexture( this.getTexture(key) ); }
  */

  getFrameCountByTexture = (texture) => {
    return (texture) ? texture.frameTotal - 1 : 0; // return without __BASE-frame
  }

  getFrameNamesByTexture = (texture, doSort, includeBase) => {
    if (!texture || !texture.frames || texture.frames.length <= 0) return [];
    const out = texture.getFrameNames(includeBase);
    return (doSort) ? out.sort() : out;
  } 

  getFrameFromTexture = (texture, frameID) => {
    if (!texture.hasOwnProperty("frameNames")) texture.frameNames = this.getFrameNamesByTexture(texture, true, false);
    const frameName = (frameID >= 0 && frameID < texture.frameNames.length) ? texture.frameNames[frameID] : "";
    //global.log("frameNames:: ", texture, texture.frameNames)
    //return texture.frames[frameName] || texture.frames["__BASE"]; 
    return texture.get(frameName); // safe
  }

  setTileFrameByID = (item, frameID, min, max) => { // frameID / animation sequence is ordered by filename of each frame
    if (isNaN(min)) min = 0;
    if (isNaN(max)) max = item.frameTotal - 1;

    item.frameID = (frameID >= min && frameID <= max) ? frameID : min;
    item.frame = this.getFrameFromTexture(item.frame.texture, item.frameID);
    //this.triggerRender();
    return item;
  }

  shrTileFrame = (item, min, max) => { // frameID / animation sequence is ordered by filename of each frame
    if (isNaN(min)) min = 0;
    if (isNaN(max)) max = item.frameTotal - 1;

    const frameID = (item.frameID < max) ? item.frameID + 1 : min;
    return this.setTileFrameByID(item, frameID);
  }

  shlTileFrame = (item, min, max) => { // frameID / animation sequence is ordered by filename of each frame
    if (isNaN(min)) min = 0;
    if (isNaN(max)) max = item.frameTotal - 1;

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

  setMap = (map, mapConfig) => {
    if (!map ) map = { };
    if (!mapConfig) mapConfig = { };

    const now = new Date();
    
    this.mapConfig = mapConfig;
    this.map = map;
    //this.map = {...layer}
    //this.map = Object.assign( {}, layer);
    //this.map = Object.assign( Object.create( Object.getPrototypeOf(layer)), layer);

    if (!this.map.hasOwnProperty("width" )) this.map.width = 0;
    if (!this.map.hasOwnProperty("height")) this.map.height = 0;
    if (!this.map.hasOwnProperty("data2D") || !Array.isArray(this.map.data2D)) this.map.data2D = [];

    this.tilePaddingBottom= mapConfig.hasOwnProperty("paddingBottom") ? mapConfig.paddingBottom : 0; // y-position of bottom-spike in pixels, messured from bottom

    this.tileWidth  = mapConfig.tileWidth;
    this.tileHeight = mapConfig.tileHeight;

    this.tileWidth2  = this.tileWidth  / 2;
    this.tileHeight2 = this.tileHeight / 2;


    // build map
    this.animList = []; // a list of all animabable items

    if (this.map.data2D.length > 0) {
      let i = 0; let lastKey; let texture; let frameTotal;
      for (let tileY = 0; tileY < this.map.height; tileY++) {
        for (let tileX = 0; tileX < this.map.width; tileX++) {
          let item = this.map.data2D[tileY][tileX];
          if (!item) continue;
          // used in renderer:: item.assetkey, item.frame, item.frame,sourceIndex, item.frame.x, item.frame.y, item.frame.width, item.frame.height, item.x, item.y, item.z, item.flipX, item.flipY, item.alpha, item.tint
          if (!item.hasOwnProperty("assetkey")) item.assetkey = ""; // key of texture to use 
          if (!item.hasOwnProperty("z"      )) item.z = 0;
          if (!item.hasOwnProperty("visible")) item.visible = true;
          if (!item.hasOwnProperty("alpha"  )) item.alpha = 1;
          if (!item.hasOwnProperty("tint"   )) item.tint = 0xffffff;
          if (!item.hasOwnProperty("flipX"  )) item.flipX = false;
          if (!item.hasOwnProperty("flipY"  )) item.flipY = false;

          if (!item.hasOwnProperty("depth"  )) item.depth = 0;

          if (item.assetkey !== lastKey) { // get texture
            texture = this.getTextureByKey(item.assetkey);
            frameTotal = this.getFrameCountByTexture(texture);
            lastKey = item.assetkey;
          }
          item.frameTotal = frameTotal || 0; // framecount used for boundary-checks (and animation-stuff)
          if (!item.hasOwnProperty("frameID")) item.frameID = Phaser.Math.Between(0, item.frameTotal - 1); // randomize if not present

          if (!item.hasOwnProperty("isAnimatable"    )) item.isAnimatable = false;
          if (!item.hasOwnProperty("isRunning"       )) item.isRunning = false;
          if (!item.hasOwnProperty("animFrameIDStart")) item.animFrameIDStart = 0;
          if (!item.hasOwnProperty("animFrameIDEnd"  )) item.animFrameIDEnd = item.frameTotal - 1;

          // get frame from texture
          item.frame = this.getFrameFromTexture(texture, item.frameID);

          // dims of the frame with fallback to tile-dims (should not happend)
          item.width = (item.frame) ? item.frame.width  : this.tileWidth;  
          item.height= (item.frame) ? item.frame.height : this.tileHeight; 

            // computed frame-positions in pixel-coords
          let localXY = this.tileCoordsToLocalCoords(tileX, tileY); // item.frame must exist before this function is called
          item.x = localXY.x; // top/left of the frame-rect 
          item.y = localXY.y;

          // center of the frame          
          item.centerX = item.x + item.width / 2;
          item.centerY = item.y + item.height/ 2;

          item.tileBottomX = item.centerX;
          item.tileBottomY = item.y + item.height - this.tilePaddingBottom;

          // center of the tile-diamaond. tile-center is not equal frame-center for "3D"-tiles or tiles with asymetric padding
          item.tileCenterX = item.centerX;
          item.tileCenterY = item.tileBottomY - this.tileHeight2;

          item.tileTopX = item.centerX;
          item.tileTopY = item.tileCenterY - this.tileHeight2;

          item.tileX = tileX;
          item.tileY = tileY;

          item.uid = i++;

          this.setTilesObjectLayer(item, item.objectLayer);

          this.children.push(item);

          if (item.isAnimatable && item.isRunning) this.animList.push(item); // add to list of items playing right now.
        }
      }
    };

    // calculate width and height of surrounding rectangle (left-spike to right-spike / top-spike to bottom-spike)
    const sumWidthHeight = this.map.width + this.map.height;
    this.width  = sumWidthHeight * this.tileWidth2; 
    this.height = sumWidthHeight * this.tileHeight2;
    if (sumWidthHeight === 1) { // special case for mapWidth = mapHeight = 1
      this.width = this.tileWidth;
      this.height= this.tileHeight;
    }

    this.width2 = this.width / 2
    this.height2= this.height / 2;

    this.timeInMS_setMap = new Date() - now;
    this.isDebug && global.log("isometricTilemap:: setTilemapLayer:: time (in ms):: ", this.timeInMS_setMap, this.map.data2D);

    this.triggerRender(); // trigger new render
    return this;
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
    
    const coordsystemShiftX = (this.map.height - 1) * this.tileWidth2;

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


  tileCoordsToLocalCoords = (tileX, tileY, ) => { // local-coords === world-coords without isoMap.setPosition
    if (!this.isValidTileCoords(tileX, tileY)) return null;

    // get the real height of this item (texture-frame). for 3d-tiles real item is greater than tile-height (think of a tree or a flag extending outside of tileheight)
    const frameHeight = this.map.data2D[tileY][tileX].height;
    const frameWidth  = this.map.data2D[tileY][tileX].width;

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
    const coordsystemShiftX = (this.map.height - 1) * this.tileWidth2;
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
        if (tileX >= 0 && tileY >= 0 && tileX < this.map.width && tileY < this.map.height) {
          let item = this.map.data2D[tileY][tileX] || null;
          if ( item 
            && item.frameID >= 0  // is valid frameID
            && item.frame         // has a texture-frame to display
            && item.visible       // is marked as visible
            && item.alpha > 0     // has a visible alpha-setting
            && item.x >= locTL.x  // is inside cameras worldview-bounds
            && item.x <= locBR.x 
            && item.y >= locTL.y 
            && item.y <= locBR.y 
          ) { 
            // add to renderlist
            cullList.push(item); 
            // if one (or more) items has a depth > 0 -> activate depth-sorting in prerender-function
            if (!this.sortChildrenFlag && item.depth > 0) this.sortChildrenFlag = true; 
          }
        }
      }
    }

    this.timeInMS_cullViewport = new Date() - now;
    this.isDebug && !this.animList.length && global.log("isometricTilemap:: cullByViewport:: time (in ms):: ", this.timeInMS_cullViewport, cullList, camera);

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
    this.isDebug && !this.animList.length && global.log("isometricTilemap:: sortList:: time (in ms):: ",this.timeInMS_sortList, listSorted, list);

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

  setAnimateCulledOnly = (value) => {
    this.animateCulledOnly = (!isNaN(value)) ? value : true;
    return this;
  }


  preUpdate = (time, delta) => {
    this.animSyncToFrames++;
    if (this.animSyncToFrames % 2 !== 0) return;

    this.animLastTime = time;
  };


  ///////////////////////////////////////////////////////////
  ///                                                     
  // timer stuff
  ///                                                     
  ///////////////////////////////////////////////////////////

  get timerList() { return this.timers }

  removeTimer = (name) => {
    this.timers && this.timers.forEach(timer => { if (!name || name === timer.name) timer.event.remove(false) });
    this.timers.length = 0;
    this.timerTicker = 0;
    return this;
  }

  addTimer = (config, callback) => { // for anim
    if (!config) config = { }
    const delay = config.hasOwnProperty("fps") ? 1000 / config.fps : config.hasOwnProperty("ms") ? config.ms : 0;
    if (delay > 0) {
      this.timers.push({ 
        name: config.hasOwnProperty("name") ? config.name : new Date(),
        event: this.scene.time.addEvent({ 
          delay: delay, 
          loop: true, 
          paused: false, 
          callbackScope: this, 
          callback: () => callback(this.timerTicker++, this.animSyncToFrames, this.animLastTime, this.children, this.renderList, this.animList),
        }),
      })
    }
    return this;
  }


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


  renderWebGL = (...params) => { // (renderer, src, interpolationPercentage, camera, parentMatrix)
    IsoWebGLRenderer(...params); 
  }

  renderCanvas = (...params) => { // (renderer, src, interpolationPercentage, camera, parentMatrix)
    IsoCanvasRenderer(...params); 
  }

  triggerRender = () => {
    this.dirty = true;
  }


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
        //|| (item.tileX===0 && item.tileY===this.map.height-1)                 // left spike
        //|| (item.tileX===this.map.width-1 && item.tileY===0)                  // right spike
         (item.tileX===this.map.width-1 && item.tileY===this.map.height-1)  // bottom spike
      ) { // render only at the spikes
        let w;

        // surrounding rectangle of full-texture frame
        w = this.tileCoordsToLocalCoords(item.tileX, item.tileY);
        w = this.localCoordsToWorldCoords(w.x, w.y);
        graphics.lineStyle(1, 0xffff00, 0.5).strokeRectShape({x: w.x, y: w.y, width: item.width, height: item.height,});      


        // surrounding rectangle of full-texture frame
        w = this.localCoordsToWorldCoords(item.x, item.y);
        graphics.lineStyle(1, 0xfd9099, 1.0).strokeRectShape({x: w.x, y: w.y, width: item.width, height: item.height,});      
  
        // position of image center
        w = this.localCoordsToWorldCoords(item.centerX, item.centerY);
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(w.x - item.width / 4, w.y, w.x + item.width / 4, w.y);
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(w.x, w.y - this.tileHeight2 / 4, w.x, w.y + this.tileHeight2 / 4);

        // position of bottom tile-spike (messured from top / left)
        w = this.localCoordsToWorldCoords(item.centerX, item.y + item.height - this.tilePaddingBottom);
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(w.x - item.width / 4, w.y, w.x + item.width / 4, w.y);

        // position of left / right tile-spikes (messured from top / left)
        w = this.localCoordsToWorldCoords(item.centerX, item.y + item.height - this.tileHeight2 - this.tilePaddingBottom);
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(w.x - item.width / 2, w.y, w.x + item.width / 2, w.y);
        graphics.lineStyle(1, 0xfd9099, 1.0).lineBetween(w.x, w.y - this.tileHeight2, w.x, w.y + this.tileHeight2);

        // tile diamond
        w = this.localCoordsToWorldCoords(item.tileCenterX, item.tileCenterY);
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
