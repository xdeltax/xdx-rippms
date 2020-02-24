import {decorate, observable, action, runInAction, /*toJS,*/ } from 'mobx';
import MobxPrototype from "./MobxPrototype";
import deepCopy from 'tools/deepCopyObject';

// appstate
import MobxAppState from './MobxAppState.js';

// spinner / ...
import MobxAppActions from './MobxAppActions.js';

// user-data
import MobxUser from './MobxUser.js';
import MobxUsercard from './MobxUsercard.js';

// game-data
import MobxGame from './MobxGame';
import NonOGame from './NonOGame';

//import SocketIOStore from 'store/socketio';

// debug
import sleep from "tools/debug/sleeper";

class Store extends MobxPrototype {
	#__initDone = false;
	constructor(store) { super(store); this.#__initDone = false; /*store init-state of all vars::*/ this.saveInitialState(this._obervables, this._helpers); };
	// this.init(); -> store.init() needs to be called in constructor of App.js

	_obervables = {
		appstate: null,
		appactions: null,

		user: null,
		usercard: null,

		game: null,
	};

	_nonobervables = {
		game: null,
	};

	_helpers = {
	};

	_constants = {
	}


	init = action(() => new Promise(resolve => {
		if (this.#__initDone) return;
		this.reset();

		// *** observables
		// stores all states of the app (width, height, position, tab, colors, ...)
		this._obervables.appstate = new MobxAppState(this);

		// tracks visual actions (spinners, hints, statusmessages)
		this._obervables.appactions = new MobxAppActions(this);

		// stores data of active user
		this._obervables.user = new MobxUser(this);
		this._obervables.usercard = new MobxUsercard(this);

		// stores data of running game
		this._obervables.game = new MobxGame(this);


		// *** NON-observables
		this._nonobervables.game = new NonOGame(this);


		this.#__initDone = true;
		resolve();
	}));

	// helpers
	sleep = async (v) => await sleep(v || 1000);



	// getters and setters
	get appstate() { return this._obervables.appstate }
	set appstate(o) { runInAction(() => { this._obervables.appstate = o; }) }

	get appactions() { return this._obervables.appactions }
	set appactions(o) { runInAction(() => { this._obervables.appactions = o; }) }

	get user() { return this._obervables.user }
	set user(o) { runInAction(() => { this._obervables.user = o; }) }

	get usercard() { return this._obervables.usercard }
	set usercard(o) { runInAction(() => { this._obervables.usercard = o; }) }

	get game() { return this._obervables.game }
	set game(o) { runInAction(() => { this._obervables.game = o; }) }

	get gameNonO() { return this._nonobervables.game }
	set gameNonO(o) { runInAction(() => { this._nonobervables.game = o; }) }


  get isAuthenticated() {
    return Boolean(this.user.isValid && this.usercard.isValid);
  }

};

decorate(Store, {
	_obervables: observable,
});

const store = new Store();

export default store;
