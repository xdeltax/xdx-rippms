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
		const now = new Date();

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
    var prevAssetkey = ""; // XDX-MOD
    var tintEffect = false;
    var alpha = camera.alpha * src.alpha;
    var roundPixels = camera.roundPixels;

    const _pipe = (itemAssetkey, itemX, itemY, itemZ, frame, itemAlpha, itemTint, flipX, flipY) => {
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
      if (frame.sourceIndex !== prevTextureSourceIndex || itemAssetkey !== prevAssetkey) { // XDX-MOD 
        pipeline.setTexture2D(frame.glTexture, 0);

        prevTextureSourceIndex = frame.sourceIndex;
        prevAssetkey = itemAssetkey; // XDX-MOD
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
        prevAssetkey = ""; // XDX-MOD
      }
    }

    for (let index = 0; index < list.length; index++) {
      const item = list[index];
      const frame = item.frame;
      let itemAlpha = item.alpha * alpha;

      if (itemAlpha > 0) _pipe(item.assetkey, item.x, item.y, item.z, item.frame, itemAlpha, item.tint, item.flipX, item.flipY);

      if (item.hasOwnProperty("objectLayer") && item.objectLayer && item.objectLayer.visible === true && item.objectLayer.alpha > 0) {
      	const obj = item.objectLayer;
      	itemAlpha *= obj.alpha;
      	const objX = item.centerX - obj.originX * obj.frame.width; // center origin of object to tile 
      	const objY = item.tileBottomY - obj.originY * obj.frame.height; // center origin of object to tile 

      	if (itemAlpha > 0) _pipe(obj.assetkey, objX + obj.x, objY + obj.y, item.z + obj.z, obj.frame, itemAlpha, obj.tint, obj.flipX, obj.flipY);
      }
			
    }

   	//global.log("renderer time (in ms):: ", new Date() - now);
};
