import NonOPrototype from "./NonOPrototype";

class NonOGame extends NonOPrototype {
  constructor(store) { super(store); /*store init-state of all vars::*/ this.saveInitialState(this._nonobervables, this._helpers); };

  _constants = {
  }

  // init of all observables
  _nonobervables = {
    tilemap: {
    },

  };

  _helpers = {
  };

  // setters and getters
  get tilemap() { return this._nonobervables.tilemap }
  set tilemap(o) { this._nonobervables.tilemap = o }

};

export default NonOGame;
