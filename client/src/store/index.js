import {decorate, observable, action, runInAction, /*toJS,*/ } from 'mobx';
import MobxPrototype from "./MobxPrototype";
//import deepCopy from 'tools/deepCopyObject';

// appstate
import AppStateMobx from './AppStateMobx.js';

// spinner / ...
import AppActionsMobx from './AppActionsMobx.js';

// user-data
//import UserMobx from './UserMobx.js';
//import MobxUsercard from './MobxUsercard.js';

// debug
import sleep from "tools/sleeper";

class Store extends MobxPrototype {
	#__initDone = false;
	constructor(store) { super(store); this.#__initDone = false; /*store init-state of all vars::*/ this.saveInitialState(this._obervables, this._helpers); };
	// this.init(); -> store.init() needs to be called in constructor of App.js

	_obervables = {
		appstate: null,
		appactions: null,

		//user: null,
		//usercard: null,
	};

	_nonobervables = {
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
		this._obervables.appstate = new AppStateMobx(this);

		// tracks visual actions (spinners, hints, statusmessages)
		this._obervables.appactions = new AppActionsMobx(this);

		// stores data of active user
		//this._obervables.user = new UserMobx(this);
		//this._obervables.usercard = new MobxUsercard(this);

		this.#__initDone = true;
		resolve();

	}));

	// helpers
	sleep = async (v) => await sleep(v || 1000);



	// getters and setters
	get appState() { return this._obervables.appstate }
	set appState(o) { runInAction(() => { this._obervables.appstate = o; }) }

	get appActions() { return this._obervables.appactions }
	set appActions(o) { runInAction(() => { this._obervables.appactions = o; }) }

	//get user() { return this._obervables.user }
	//set user(o) { runInAction(() => { this._obervables.user = o; }) }

	//get usercard() { return this._obervables.usercard }
	//set usercard(o) { runInAction(() => { this._obervables.usercard = o; }) }
};

decorate(Store, {
	_obervables: observable,
});

const store = new Store();

export default store;
