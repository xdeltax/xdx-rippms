import {decorate, observable, action, runInAction, toJS, } from 'mobx';
import ProtoStore from "./protoStore";
import deepCopy from 'tools/deepCopyObject';
import deepMerge from 'tools/deepMergeObject';

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
    vars: {
      lives: 0,
    },
  };

  _helpers = {
    game: null,
  };

  // setters and getters
  get game() { return this._helpers.game; }
  set game(o) { runInAction(() => { this._helpers.game = o; }) }

  get vars() { return this._obervables.vars }
  set vars(o) { runInAction(() => { this._obervables.vars = o }) }

  get lives() { return this._obervables.vars.lives; }
  set lives(v) { runInAction(() => { this._obervables.vars.lives = v; }) }
};

decorate(Store, {
	_obervables: observable,
  _helpers: observable,
});

export default Store;
