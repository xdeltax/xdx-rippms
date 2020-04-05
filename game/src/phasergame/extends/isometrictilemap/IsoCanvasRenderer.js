/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2019 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

/**
 * Renders this Game Object with the Canvas Renderer to the given Camera.
 * The object will not render if any of its renderFlags are set or it is being actively filtered out by the Camera.
 * This method should not be called directly. It is a utility function of the Render module.
 *
 * @method Phaser.GameObjects.Blitter#renderCanvas
 * @since 3.0.0
 * @private
 *
 * @param {Phaser.Renderer.Canvas.CanvasRenderer} renderer - A reference to the current active Canvas renderer.
 * @param {Phaser.GameObjects.Blitter} src - The Game Object being rendered in this call.
 * @param {number} interpolationPercentage - Reserved for future use and custom pipelines.
 * @param {Phaser.Cameras.Scene2D.Camera} camera - The Camera that is rendering the Game Object.
 * @param {Phaser.GameObjects.Components.TransformMatrix} parentMatrix - This transform matrix is defined if the game object is nested
 */
export default (renderer, src, interpolationPercentage, camera, parentMatrix) => {
    var list = src.getRenderList();

    if (list.length === 0) return;

    var ctx = renderer.currentContext;

    var alpha = camera.alpha * (src.alpha || 1);

    if (alpha === 0) return;

    //  Blend Mode + Scale Mode
    ctx.globalCompositeOperation = renderer.blendModes[src.blendMode];

    ctx.imageSmoothingEnabled = !(!renderer.antialias || src.frame.source.scaleMode);

    var cameraScrollX = src.x - camera.scrollX;// * src.scrollFactorX;
    var cameraScrollY = src.y - camera.scrollY;// * src.scrollFactorY;

    ctx.save();

    if (parentMatrix) {
    	parentMatrix.copyToContext(ctx);
    }

    var roundPixels = camera.roundPixels;

    const _pipe = (/*itemAssetID,*/ itemX, itemY, itemZ, frame, itemAlpha, /*itemTint,*/ flipX, flipY) => {
      const cd = frame.canvasData;
      let dx = frame.x;
      let dy = frame.y;
      let fx = 1;
      let fy = 1;

      if (itemAlpha > 0) {
	      ctx.globalAlpha = itemAlpha;

	      if (!(flipX || flipY)) {
          if (roundPixels) {
            dx = Math.round(dx);
            dy = Math.round(dy);
          }
          ctx.drawImage(frame.source.image, cd.x, cd.y, cd.width, cd.height, dx + itemX + cameraScrollX, dy + itemY + cameraScrollY - itemZ, cd.width, cd.height);
	      } else {
          if (flipX) { fx = -1; dx -= cd.width; }
          if (flipY) { fy = -1; dy -= cd.height;}
          ctx.save();
          ctx.translate(itemX + cameraScrollX, itemY + cameraScrollY - itemZ); // XDX-MOD
          ctx.scale(fx, fy);
          ctx.drawImage(frame.source.image, cd.x, cd.y, cd.width, cd.height, dx, dy, cd.width, cd.height);
          //ctx.restore();
        }
      }
    }

    for (let i = 0; i < list.length; i++) {
      const item = list[i];

      let itemAlpha = (item.alpha || 1) * alpha;

      if (itemAlpha > 0) {
        const asset = src.assetIDs[item.assetID] || [];
        const frame = asset[item.frameID || 0] || null; // item.frame;

        if (frame) {
					const localXY = src.tileCoordsToLocalCoords(item.tileX, item.tileY) || {}; //const localXY = src.getItemXY(item) || {}; // short for: src.tileCoordsToLocalCoords(tileX, tileY); // item.frame must exist before this function is called
          _pipe(/*item.assetID,*/ localXY.x, localXY.y, item.z || 0, frame, itemAlpha, item.tint || 0xffffff, item.flipX || false, item.flipY || false);
        }
      }

      /*
      if (item.hasOwnProperty("objectLayer") && item.objectLayer && item.objectLayer.visible === true && item.objectLayer.alpha > 0) {
      	const obj = item.objectLayer;
      	itemAlpha *= obj.alpha;
      	const objX = item.centerX - obj.originX * obj.frame.width; // center origin of object to tile
      	const objY = item.tileBottomY - obj.originY * obj.frame.height; // center origin of object to tile

      	if (itemAlpha > 0) _pipe(objX + obj.x, objY + obj.y, item.z + obj.z, obj.frame, itemAlpha, obj.flipX, obj.flipY);
      }
      */
    }

    ctx.restore();
};
