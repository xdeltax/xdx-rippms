class MobxStore {
  _observed = {
  };

  get mobx() { return this._observed; }

  async init() {

  }
}

const mobxStore = new MobxStore();
export default mobxStore;
