import {decorate, observable, action, runInAction, toJS,} from 'mobx';
import ProtoStore from "./protoStore";
import deepCopy from 'tools/deepCopyObject';
import deepMerge from 'tools/deepMergeObject';

import { saveToPersistentDatabase, deletePersistentDatabase, } from "db/persistent";

import store from "store";

class Store extends ProtoStore {
  #__privateObervablesInit;
  #__privateHelpersInit;
  constructor() { super(); /*store init-state of all vars*/ this.#__privateObervablesInit = deepCopy(this._obervables); this.#__privateHelpersInit = deepCopy(this._helpers); };
  reset     = action(() 	 => { /*recover init-state*/ this.obervables = deepCopy(this.#__privateObervablesInit); this.helpers = deepCopy(this.#__privateHelpersInit); this.constants = deepCopy(this.#__privateHelpersInit); });
  clear 		= action(() 	 => this.clear_all() );
  clear_all = action(() 	 => Object.keys(this.obervables).forEach( (prop) => this.obervables[prop] = deepCopy(this.#__privateObervablesInit[prop]) ) );
  clear_obj = action((obj) => this[obj] = deepCopy(this.#__privateObervablesInit[obj]) );

  _constants = {
    genderREADONLY: ["unknown", "male", "female", ],
  }

  // init of all observables
  _obervables = {
    world: {
      worldID: null,
	  	tileID: null,
	  	tileX: 0,
	  	tileY: 0,
	  	texttureKey: "",
	  	frameID: 0,
    },
  };

  _helpers = {
  };

  // setters and getters
  get const() { return this.constants; }
  set const(v) { runInAction(() => { this.constants = v; }) }

  // user / user-credentials
  get world() { return this._obervables.world; }
  set world(v) { runInAction(() => { this._obervables.world = v; }) }


  get worldid() { return this.world.worldid; }
  set worldid(v) { runInAction(() => { this.world.worldid = v; }) }



};

decorate(Store, {
  _obervables: observable,
  _helpers: observable,
});

export default Store;
