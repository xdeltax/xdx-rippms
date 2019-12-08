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

  // init of all observables
  _obervables = {
    debug: true,
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

    tiles: {
      groundLayer: {
        width: 64,
        height: 64, // 32
      },
    },
    world: {
      worldNr: 1,
      width: 10,
      height: 20,
    },

    player: {
      worldNr: 1,
      createdAt: 0,
      name: "",
    },
    castle: {
      worldNr: 1,
      worldX: 5,
      worldY: 5,
      level: 1,
      power: 0,
    },

    vars: {
      lives: 0,
    },
  };

  _helpers = {
  };

  // setters and getters
  get config() { return this.obervables.config }
  set config(o) { runInAction(() => { this.obervables.config = o }) }

  get vars() { return this.obervables.vars }
  set vars(o) { runInAction(() => { this.obervables.vars = o }) }

      get lives() { return this.obervables.vars.lives; }
      set lives(v) { runInAction(() => { this.obervables.vars.lives = v; }) }
};

decorate(Store, {
	_obervables: observable,
  _helpers: observable,
});

export default Store;
