import {decorate, observable, action, runInAction, /*toJS,*/ } from 'mobx';
import ProtoStore from "./protoStore";
import deepCopy from 'tools/deepCopyObject';

import UserStore from 'store/user';
import PhaserStore from 'store/phaser';
import PixiStore from 'store/pixi';

import SystemStore from 'store/system';
import SocketIOStore from 'store/socketio';
import FacebookStore from 'store/facebook';

import sleep from "tools/debug/sleeper";

class Store extends ProtoStore {
	#__privateObervablesInit;
  	#__privateHelpersInit;
	#__initDone = false;

	// this.init(); -> store.init() needs to be called in constructor of App.js
	constructor() { super(); this.#__initDone = false; /*store init-state of all vars*/ this.#__privateObervablesInit = deepCopy(this._obervables); this.#__privateHelpersInit = deepCopy(this._helpers); };
	reset     = action(() 	=> { /*recover init-state*/ this.obervables = deepCopy(this.#__privateObervablesInit); this.helpers = deepCopy(this.#__privateHelpersInit); this.constants = deepCopy(this.#__privateHelpersInit); });
	clear 	= action(() 	=> this.clear_all() );
	clear_all = action(() 	=> Object.keys(this.obervables).forEach( (prop) => this.obervables[prop] = deepCopy(this.#__privateObervablesInit[prop]) ) );
	clear_obj = action((obj) 	=> this[obj] = deepCopy(this.#__privateObervablesInit[obj]) );

	// init of all observables
	_obervables = {
		system: null,

		user: null,
		phaser: null,
		pixi: null,

		socketio: null,
		facebook: null,
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

	init = action(() => {
		if (this.#__initDone) return;
		this.reset();

		global.log("store:: init:: create sub-stores. ");
		this._obervables.system = new SystemStore();

		this._obervables.user = new UserStore();
		this._obervables.phaser = new PhaserStore();
		this._obervables.pixi = new PixiStore();

		this._obervables.socketio = new SocketIOStore();
		this._obervables.facebook = new FacebookStore();

		// connect socket at app-start
	    if (!global.DEBUG_DISABLE_SOCKETCONNECT) {
			global.log("store:: init:: connect socket. ", global);
			this.socketio.connect();
		}

		this.#__initDone = true;
	})

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
	get system() { return this._obervables.system }
	set system(o) { runInAction(() => { this._obervables.system = o; }) }

	get user() { return this._obervables.user }
	set user(o) { runInAction(() => { this._obervables.user = o; }) }

	get phaser() { return this._obervables.phaser }
	set phaser(o) { runInAction(() => { this._obervables.phaser = o; }) }

	get pixi() { return this._obervables.pixi }
	set pixi(o) { runInAction(() => { this._obervables.pixi = o; }) }

	get socketio() { return this._obervables.socketio }
	set socketio(o) { runInAction(() => { this._obervables.socketio = o; }) }

	get facebook() { return this._obervables.facebook }
	set facebook(o) { runInAction(() => { this._obervables.facebook = o; }) }
};

decorate(Store, {
	_obervables: observable,
  	_helpers: observable,
});

export default new Store();
