import {decorate, observable, action, runInAction, /*toJS,*/ } from 'mobx';
import MobxPrototype from "./MobxPrototype";
import deepCopy from 'tools/deepCopyObject';

// appstate
import MobxAppState from './MobxAppState.js';

// user-data
import MobxUser from './MobxUser.js';
import MobxUsercard from './MobxUsercard.js';

// game-data
import MobxGame from './MobxGame';

//import SocketIOStore from 'store/socketio';

// debug
import sleep from "tools/debug/sleeper";

class Store extends MobxPrototype {
	#__initDone = false;
	constructor(store) { super(store); this.#__initDone = false; /*store init-state of all vars::*/ this.saveInitialState(this._obervables, this._helpers); };
	// this.init(); -> store.init() needs to be called in constructor of App.js

	// init of all observables
	_obervables = {
		appstate: null,

		user: null,
		usercard: null,

		game: null,

		//socketio: null,
	};

	_helpers = {
		isLoadingNow: false,
		isSavingNow: false,
		isSpinnerVisible: false,
		hintText: "",
		unsavedChangesUser: false, // if userprofile was changed but no api-call to server triggered by user "save-button"
	};

	_constants = {
	}

	init = action(() => new Promise(resolve => {
		if (this.#__initDone) return;
		this.reset();

		// stores all states of the app (width, height, position, tab, colors, ...)
		this._obervables.appstate = new MobxAppState(this);

		// stores data of active user
		this._obervables.user = new MobxUser(this);
		this._obervables.usercard = new MobxUsercard(this);

		// stores data of running game
		this._obervables.game = new MobxGame();

		//this.socketio = new SocketIOStore();

		this.#__initDone = true;
		resolve();
	}));

	// helpers
	sleep = async (v) => await sleep(v || 1000);

	get hint() { return this.helpers.hintText }
	set hint(v) { runInAction(() => { this.helpers.hintText = v; })}

	get isSpinnerVisible() { return this.helpers.isSpinnerVisible }
	set isSpinnerVisible(v) { runInAction(() => { this.helpers.isSpinnerVisible = v; })}

	get loadingNowStatus() { return this.helpers.isLoadingNow }
	set loadingNowStatus(v) { runInAction(() => {
		this.helpers.isLoadingNow = v;
		if (v === true) {
			this.isSpinnerVisible = true;
		} else {
			this.isSpinnerVisible = false;
			this.helpers.hint = "";
		}
	}) }

	get savingNowStatus() { return this.helpers.isSavingNow }
	set savingNowStatus(v) { runInAction(() => {
		this.helpers.isSavingNow = v;
		if (v === true) {
			this.isSpinnerVisible = true;
		} else {
			this.isSpinnerVisible = false;
			this.helpers.hint = "";
		}
	}) }

	get unsavedChangesUser() { return this.helpers.unsavedChangesUser }
	set unsavedChangesUser(v) { runInAction(() => { this.helpers.unsavedChangesUser = v; }) }

	showSpinner = (text, timeout) => {
		this.hint = text || "";
		this.isSpinnerVisible = true;
		if (timeout) {
			this.timer = setTimeout(()=>{
				this.hideSpinner();
				clearInterval(this.timer);
			}, timeout);
		}
	};

	hideSpinner = () => {
		if (this.timer) clearInterval(this.timer);
		this.isSpinnerVisible = false;
		this.hint = "";
	};

	// getters and setters
	get appstate() { return this._obervables.appstate }
	set appstate(o) { runInAction(() => { this._obervables.appstate = o; }) }

	get user() { return this._obervables.user }
	set user(o) { runInAction(() => { this._obervables.user = o; }) }

	get usercard() { return this._obervables.usercard }
	set usercard(o) { runInAction(() => { this._obervables.usercard = o; }) }

	get game() { return this._obervables.game }
	set game(o) { runInAction(() => { this._obervables.game = o; }) }

	//get socketio() { return this._obervables.socketio }
	//set socketio(o) { runInAction(() => { this._obervables.socketio = o; }) }


  get isAuthenticated() {
    return Boolean(this.user.isValid && this.usercard.isValid);
  }

};

decorate(Store, {
	_obervables: observable,
  _helpers: observable,
});

const store = new Store();

export default store;
