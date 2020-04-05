import * as Phaser from 'phaser'

export default class MySprite extends Phaser.GameObjects.Sprite {

    constructor (scene, x, y, key, frame)
    {
        super(scene, x, y, key);
        scene.add.existing(this); // add to scene
        //scene.physics.add.existing(this);

        //this.setInteractive();
        //this.on("pointerdown", () => { })

        //this.setTexture('cachedtexturekey');
        //this.setPosition(x, y);
    }
    preload()
    {

    	global.log("MYSPRITE *********** preload")
    }
    create()
    {
    	global.log("MYSPRITE *********** create")

    }
    preUpdate (time, delta)
    {
    	super.preUpdate(time, delta);
      // do stuff with this.myExtra
    	//global.log("MYSPRITE *********** preUpdate")
    }

}