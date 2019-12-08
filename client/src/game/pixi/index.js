import { Viewport } from 'pixi-viewport'
//import * as Cull from 'pixi-cull'; //const Cull = require('pixi-cull');

import * as PIXI from 'pixi.js';
import { Application } from '@pixi/app';
import { Container } from '@pixi/display';
import { ParticleContainer } from '@pixi/particles';
import { Graphics } from '@pixi/graphics';
import { Text } from '@pixi/text';
//import { Point } from '@pixi/math';
import { Sprite } from '@pixi/sprite'; // SpriteRenderer,

import myImage from './assets/logo192.png';

export default class /*PixiGame*/ extends /*PIXI.*/Application {
  helpers = {
    updateCounter: 0,
  }

  // this = app
  constructor(react = null, size = {width: 1280, height: 720}) {
    let pixiConfig = {
      width: size.width,
      height: size.height,
      autoDensity: true,
      antialias: true,
      //backgroundColor: 0x061639,
      transparent: true,
    };

    super(pixiConfig); // this.app = new PIXI.Application(pixiConfig);

    this.app = this; // PIXI-app:: this.app.renderer...; this.renderer...; this.react.app.renderer...

    // this == (pixi)app
    // this.react == PixiGameContainer
    // this.react.store == (mobx)store
    // this.react.app == (pixi)app == this
    global.log("PixiGame:: constructor:: ", this, react);

    // start pixi-init sequence manually to be able to use async/await
    this.initAsync();
  }

  initAsync = async () => {
    this.app.renderer.autoResize = true;
    this.app.view.style.border = "1px dashed black";

    await this.preload();
    await this.createScene();
    await this.createSprites();
    await this.createObjects();
    await this.createContainers();
    await this.createText();
    await this.createInteration();

    // start update loop
    this.ticker.add(this.update);
  };


  preload = async () => {
    this.resources = await this._loaderAddAsync({name: "myImage", url: myImage, }, );

  };

  createScene = async () => {
    this.scene1 = new /*PIXI.*/Container();
    this.scene1.visible = false;
    this.scene1.sortableChildren = true; // true: all items of scene1 will be sorted by their zIndex

    this.scene2 = new /*PIXI.*/Container();
    this.scene2.visible = false;
    this.scene2.sortableChildren = false; // true: all items of scene1 will be sorted by their zIndex

    // create viewport
    this.viewport = new /*PIXI.*/Viewport({
      visible: false,
      interaction: this.app.renderer.plugins.interaction, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
      screenWidth: this.app.view.offsetWidth,
      screenHeight: this.app.view.offsetHeight,
    });
    this.viewport.tileSize = 128;
    this.viewport.tileMaxX = 100;
    this.viewport.tileMaxY = 100;
    this.viewport.worldWidth  = this.viewport.tileMaxX * this.viewport.tileSize;
    this.viewport.worldHeight = this.viewport.tileMaxY * this.viewport.tileSize;

    this.viewport
    .drag()
    .pinch()
    .wheel()
    .decelerate() // decelerate after a move
    //.moveCenter(this.viewport.worldWidth / 2, this.viewport.worldHeight / 2)
    .fitWorld(false)

    global.log("viewport:: ", this.viewport.tileSize, this.viewport.tileMaxX, this.viewport.tileMaxY)

    // set display order
    this.app.stage.addChild(this.viewport);
    this.app.stage.addChild(this.scene1);
    this.app.stage.addChild(this.scene2);

    // set visibility
    this.viewport.visible = true;
    this.scene1.visible = true;
    this.scene2.visible = true;

    //this.app.stage = this.scene1;
  };

  createInteration = async (resources) => {

    // global touchevents on full render-view
    this.app.renderer.plugins.interaction.on('pointerdown', (e) => {
      //this.culler.cull(this.viewport.getVisibleBounds());
      //global.log("culler::", this.culler, this.culler.stats());
      global.log("pointerdown heights:: ", e, e.data.global, this.app.renderer.height, this.app.stage.height, this.app.view.offsetHeight, this.viewport.worldWidth, this.viewport.worldHeight, this.viewport.screenWidth, this.viewport.screenHeight,)

      //let pnt = /*PIXI.*/Point; let x = e.data.global.x; let y = e.data.global.y;
      //this.app.renderer.plugins.interaction.mapPositionToPoint(pnt, x, y);
      //global.log("mapPositionToPoint:: ", x, pnt.x, y, pnt.y);
    });

    // Mouse & touch events are normalized into
    // the pointer* events for handling different
    // button events.
    //    .on('pointertap', onButtonUp) // Fired when a pointer device button is pressed and released on the display object.
    //    .on('pointerdown', onButtonDown) // Fired when a pointer device button is pressed on the display object.
    //    .on('pointerup', onButtonUp) // Fired when a pointer device button is released over the display object. Not always fired when some buttons are held down while others are released. In those cases, use mousedown and mouseup instead.
    //    .on('pointerupoutside', onButtonUp) // Fired when a pointer device button is released outside the display object that initially registered a pointerdown.
    //    .on('pointerover', onButtonOver) // Fired when a pointer device is moved onto the display object
    //    .on('pointerout', onButtonOut); // Fired when a pointer device is moved off the display object
    //    .on('pointermove', onButtonOver) // Fired when a pointer device is moved while over the display object
  };

  createSprites = async (resources) => {
    // create sprite
    this.sprite1 = new /*PIXI.*/Sprite(this.resources.myImage.texture); // create sprite

    // Setup the position
    //this.sprite1.position.set(this.app.renderer.width / 2, this.app.renderer.height / 2);
    this.sprite1.position.set(this.app.view.offsetWidth / 2, this.app.view.offsetHeight / 2);

    // Rotate around the center
    this.sprite1.anchor.x = 0.5;
    this.sprite1.anchor.y = 0.5;

    // react to user-events
    this.sprite1.interactive = true; // Opt-in to interactivity
    this.sprite1.buttonMode = true; // Shows hand cursor

    // set z-index for visibility-sorting
    this.sprite1.zIndex = 2;

    // add to scene
    this.scene1.addChild(this.sprite1);
  };

  createObjects = async (resources) => {
    this.shape = new /*PIXI.*/Graphics(); // Create a single graphics context
    this.shape.beginFill(0x00, 1.0); // fill color (color, alpha)
    this.shape.lineStyle(1, 0xffffff, 1.0, 0); // lineStyle (width, color, alpha, alignment, native) // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
    this.shape.drawRect(0, 0, 50, 50); // (x, y, width, height)
    this.shape.endFill(); // fill shape with color
    this.shape.pivot.set(this.shape.width / 2, this.shape.height / 2) ; // The pivot point of the displayObject that it rotates around.
    this.shape.position.set(50 / 2, 50 / 2); // the coordinate of the object relative to the local coordinates of the parent
    this.shape.alpha = 0.1; // alpha of full object (outline AND fill)
    this.shape.zIndex = 1;
    this.scene1.addChild(this.shape);

    // convert shape to sprite
    const shapeTexture = this.app.renderer.generateTexture(this.shape);
    this.shapeSprite = new Sprite(shapeTexture);
    this.shapeSprite.pivot.set(this.shapeSprite.width / 2, this.shapeSprite.height / 2) ; // The pivot point of the displayObject that it rotates around.
    this.shapeSprite.position.set(this.app.view.offsetWidth - 25, this.app.view.offsetHeight - 25);
    this.scene1.addChild(this.shapeSprite);

    global.log("isSprite:: ", this.shape.isSprite)
    global.log("isSprite:: ", this.shapeSprite.isSprite)
  }

  createContainers = async (resources) => {
    let particleContainer1 = new ParticleContainer(this.viewport.tileMaxX * this.viewport.tileMaxY, { alpha: true, autoResize: true, });
    for (let y = 0; y < this.viewport.tileMaxY; y++) {
      for (let x = 0; x < this.viewport.tileMaxX; x++) {
        let sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        sprite.tint = 0xffffff * Math.random();
        sprite.width = sprite.height = this.viewport.tileSize;
        sprite.position.set(x * this.viewport.tileSize, y * this.viewport.tileSize);
        particleContainer1.addChild(sprite);
        //this.viewport.addChild(sprite);
      }
    }
    this.viewport.addChild(particleContainer1);
  }

  createText = async (resources) => {
    this.message = new Text( "The End!",  {align: "left", fontFamiliy: "arial", fontSize: 12} );
    this.message.position.set(0, this.app.view.offsetHeight - 15);
    this.scene2.addChild(this.message);
  }

  update = (delta) => {
    //global.log("fps:: ", this.app.ticker.FPS, delta) // minFPS maxFPS
    //global.log("this.culler.Stats.total", this.culler.stats() );

    this.helpers.updateCounter++
    if (this.helpers.updateCounter > 15) {
      this.helpers.updateCounter = 0;
      this.message.text = `FPS: ${this.app.ticker.FPS.toFixed(2)} Delta: ${delta.toFixed(4)} `; // visible: ${this.culler.stats().visible}
    }
    this.sprite1.rotation += 0.01;
    this.shape.rotation -= 0.01;
    this.shapeSprite.rotation -= 0.01;
  };

  _loaderAddAsync = (items) => {
    return new Promise( (resolve, reject) => {
      this.app.loader.add(items).load( (loader, resources) => {
        resolve(resources);
      });
    });
  };
};
