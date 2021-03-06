import {decorate, observable, runInAction, action, toJS, } from 'mobx';
import ProtoStore from "./protoStore";
import deepCopy from 'tools/deepCopyObject';

class Store extends ProtoStore {
  #__privateObervablesInit;
  #__privateHelpersInit;
  constructor() { super(); /*store init-state of all vars*/ this.#__privateObervablesInit = deepCopy(this._obervables); this.#__privateHelpersInit = deepCopy(this._helpers); };
  reset     = action(() 	 => { /*recover init-state*/ this.obervables = deepCopy(this.#__privateObervablesInit); this.helpers = deepCopy(this.#__privateHelpersInit); this.constants = deepCopy(this.#__privateHelpersInit); });
  clear 		= action(() 	 => this.clear_all() );
  clear_all = action(() 	 => Object.keys(this.obervables).forEach( (prop) => this.obervables[prop] = deepCopy(this.#__privateObervablesInit[prop]) ) );
  clear_obj = action((obj) => this[obj] = deepCopy(this.#__privateObervablesInit[obj]) );
  
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

decorate(Store, {
	_obervables: observable,
  _helpers: observable,
});

export default Store;
