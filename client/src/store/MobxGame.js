import {decorate, observable, runInAction, /*toJS,*/} from 'mobx';
import MobxPrototype from "./MobxPrototype";

class MobxGame extends MobxPrototype {
  constructor(store) { super(store); /*store init-state of all vars::*/ this.saveInitialState(this._obervables, this._helpers); };

  _constants = {
  }

  // init of all observables
  _obervables = {
    debug: true,

    player: {
    },

    world: {
    	worldID: null,
    	groundLayer: null, // array[2500] of array[2500] of itemID
    	objectLayer: null, // array[2500] of array[2500] of objectID
    },


    config: {
      gameTitle: "a phaser 3 game",
      gameVersion: "v1.00.00",

      antialias: false, // default: true; Draw all image textures ani-aliased. The default is for smooth textures, but disable if your game features pixel art

      colors: {
        text: "yellow",
        background: 'rgba(0, 238, 238, 1.0)',
        transparent: false, // slower
      },
    },

    test: {
      counter: 0,
    },
  };

  _helpers = {
  };

  // setters and getters
  get config() { return this._obervables.config }
  set config(o) { runInAction(() => { this._obervables.config = o }) }

  get test() { return this._obervables.test }
  set test(o) { runInAction(() => { this._obervables.test = o }) }

      get counter() { return this.test.counter; }
      set counter(v) { runInAction(() => { this.test.counter = v; }) }
};

decorate(MobxGame, {
	_obervables: observable,
  _helpers: observable,
});

export default MobxGame;
