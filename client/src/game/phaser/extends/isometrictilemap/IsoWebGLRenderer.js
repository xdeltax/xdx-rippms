import * as Phaser from 'phaser'
/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2019 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

var Utils = Phaser.Renderer.WebGL.Utils; // XDX-MOD:: require('../../renderer/webgl/Utils');

/**
 * Renders this Game Object with the WebGL Renderer to the given Camera.
 * The object will not render if any of its renderFlags are set or it is being actively filtered out by the Camera.
 * This method should not be called directly. It is a utility function of the Render module.
 *
 * @method Phaser.GameObjects.Blitter#renderWebGL
 * @since 3.0.0
 * @private
 *
 * @param {Phaser.Renderer.WebGL.WebGLRenderer} renderer - A reference to the current active WebGL renderer.
 * @param {Phaser.GameObjects.Blitter} src - The Game Object being rendered in this call.
 * @param {number} interpolationPercentage - Reserved for future use and custom pipelines.
 * @param {Phaser.Cameras.Scene2D.Camera} camera - The Camera that is rendering the Game Object.
 * @param {Phaser.GameObjects.Components.TransformMatrix} parentMatrix - This transform matrix is defined if the game object is nested
 */
export default (renderer, src, interpolationPercentage, camera, parentMatrix) => {
		//const now = new Date();

    var list = src.getRenderList();

    if (list.length === 0) return;

    var pipeline = src.pipeline; // XDX-MOD:: this.pipline

    renderer.setPipeline(pipeline, src);

    var cameraScrollX = camera.scrollX * src.scrollFactorX;
    var cameraScrollY = camera.scrollY * src.scrollFactorY;

    var calcMatrix = pipeline._tempMatrix1;

    calcMatrix.copyFrom(camera.matrix);

    if (parentMatrix) {
      calcMatrix.multiplyWithOffset(parentMatrix, -cameraScrollX, -cameraScrollY);

      cameraScrollX = 0;
      cameraScrollY = 0;
    }

    var isomapX = src.x - cameraScrollX;
    var isomapY = src.y - cameraScrollY;
    var prevTextureSourceIndex = -1;
    var prevAssetID = null; // XDX-MOD
    var tintEffect = false;
    var alpha = camera.alpha * (src.alpha || 1);
    var roundPixels = camera.roundPixels;



    const _pipe = (itemAssetID, itemX, itemY, itemZ, frame, itemAlpha, itemTint, flipX, flipY) => {
      let width = frame.width;
      let height= frame.height;

      let x = isomapX + itemX + frame.x;
      let y = isomapY + itemY + frame.y - itemZ; // XDX-MOD

      if (flipX) { width *= -1; x += frame.width; }
      if (flipY) { height*= -1; y += frame.height; }

      const xw = x + width;
      const yh = y + height;

      let tx0 = calcMatrix.getX(x, y);
      let ty0 = calcMatrix.getY(x, y);

      let tx1 = calcMatrix.getX(xw, yh);
      let ty1 = calcMatrix.getY(xw, yh);

      const tint = Utils.getTintAppendFloatAlpha(itemTint, itemAlpha);

      //  Bind texture only if the Texture Source is different from before
      if (frame.sourceIndex !== prevTextureSourceIndex || itemAssetID !== prevAssetID) { // XDX-MOD
        pipeline.setTexture2D(frame.glTexture, 0);

        //global.log("xxx", frame.sourceIndex)

        prevTextureSourceIndex = frame.sourceIndex;
        prevAssetID = itemAssetID; // XDX-MOD
      }

      if (roundPixels) {
        tx0 = Math.round(tx0);
        ty0 = Math.round(ty0);
        tx1 = Math.round(tx1);
        ty1 = Math.round(ty1);
      }

      //  TL x/y, BL x/y, BR x/y, TR x/y
      if (pipeline.batchQuad(tx0, ty0, tx0, ty1, tx1, ty1, tx1, ty0, frame.u0, frame.v0, frame.u1, frame.v1, tint, tint, tint, tint, tintEffect, frame.glTexture, 0)) {
        prevTextureSourceIndex = -1;
        prevAssetID = null; // XDX-MOD
      }
    }



    for (let index = 0; index < list.length; index++) {
      const item = list[index];

			//const item_assetID = item.assetID;
			/*
      const localXY = src.tileCoordsToLocalCoords(item.tileX, item.tileY) || {}; //const localXY = src.getItemXY(item) || {}; // short for: src.tileCoordsToLocalCoords(tileX, tileY); // item.frame must exist before this function is called
      const item_x = localXY.x || 0; // top/left of the frame-rect
      const item_y = localXY.y || 0;
      const item_z = item.z || 0;
			*/
      //const item_alpha = item.alpha || 1;
      //const item_tint  = item.tint  || 0xffffff;
      //const item_flipX = item.flipX || false;
      //const item_flipY = item.flipY || false;

      const itemAlpha = (item.alpha || 1) * alpha;

      if (itemAlpha > 0) {
        const asset = src.assetIDs[item.assetID] || [];
        const frame = asset[item.frameID || 0] || null; // item.frame;

        if (frame) {
					const localXY = src.tileCoordsToLocalCoords(item.tileX, item.tileY) || {}; //const localXY = src.getItemXY(item) || {}; // short for: src.tileCoordsToLocalCoords(tileX, tileY); // item.frame must exist before this function is called
          _pipe(item.assetID, localXY.x, localXY.y, item.z || 0, frame, itemAlpha, item.tint || 0xffffff, item.flipX || false, item.flipY || false);
        }
      }

      /*
      if (item.hasOwnProperty("objectLayer") && item.objectLayer && item.objectLayer.visible === true && item.objectLayer.alpha > 0) {
      	const obj = item.objectLayer;

        const obj_assetID= obj.assetID|| 0;
        const obj_frameID = obj.frameID || 0;
        const obj_x = obj.x || 0;
        const obj_y = obj.y || 0;
        const obj_z = obj.z || 0;
        const obj_alpha = obj.alpha || 1;
        const obj_tint  = obj.tint  || 0xffffff;
        const obj_flipX = obj.flipX || false;
        const obj_flipY = obj.flipY || false;

        const objAlpha = itemAlpha * obj_alpha;

      	if (objAlpha > 0) {
          const objAsset = src.assetIDs[obj_assetID] || [];
          const objFrame = objAsset[obj_frameID] || null; // item.frame;

          if (objFrame) {
        	   const objX = item.centerX - obj.originX * objFrame.width; // center origin of object to tile
        	   const objY = item.tileBottomY - obj.originY * objFrame.height; // center origin of object to tile

             _pipe(obj_assetkey, objX + obj_x, objY + obj_y, item_z + obj_z, objFrame, objAlpha, obj_tint, obj_flipX, obj_flipY);
          }
        }
      }
      */
    }

   	//global.log("renderer time (in ms):: ", new Date() - now);
};
