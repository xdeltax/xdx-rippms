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
    state: {
      dataRelevance: { // used to track: last update to/from server, last data from localstorage (app start / end)
        localstorage: {
          lastReadCall: 0, // unixtime (client-time) the store was read from localstorage (usually: at application startup in app.js-componentDidMount)
          lastWriteCall: 0, // unixtime (client-time) the store was saved to localstorage (usually: at application exit in app.js-componentWillUnmount)
        },
        serverstorage: {
          lastReadCall: 0, // unixtime (client-time) the user-data was read from server
          lastWriteCall: 0, // unixtime (client-time) the user-data was written to the servers database
        },
      },

    }, // of state

    app: { // used in app.js to set style of first div
      size: {
        minWidth: "360px",
        minHeight: "360px",
        maxWidth: null,
        maxHeight: null,
      },


      behaviour: {

      },

      watchers: {
        orientation: { // AppLandingPage:: componentDidMount:: -> watchers/orientation.js:: window.screen.orientation
          type: "",
          angle: 0,
        },
        connection: {  // AppLandingPage:: componentDidMount:: -> watchers/connection.js::  navigator.connection
          type: "",
          downlink: 0,

          isOnline: false, // navigator.onLine;
          wentOffline: 0,
          wentOnline: 0,
        },
        route: {
          pathname: "", // AppRouter:: componentDidUpdate
        },
        visibility: {
          hidden: null,
          visibilityState: null,
        },
      },

      header: { // hide / show topbar (backbutton * label * profile * toggle)
        visible: false,
        //height: 48,
      },
      bottomNavigation: { // hide / show navigationbar at bottom of app
        visible: false,
        //height: 48, // variant "dense" -> minHeight 48
      },
      game: { // hide / show phaser-container
        visible: false,
      },
    }, // of app

    //https://material-ui.com/de/customization/default-theme/?expend-path=$.zIndex
    colors: { // application colors
      app: {
        text: 'black',
        background: 'rgba(240, 255, 240, 1.0)',
      },
      login: {
        text: 'blue',
        background: 'rgba(255, 238, 238, 1.0)',
      },
      auth: {
        text: 'blue',
        background: 'rgba(230, 255, 230, 1.0)',
      },

      overlay: { // color of modals (spinner, alert, ...)
        text: 'blue',
        background: "linear-gradient(140deg, rgba(255,255,255,0.7) 20%, rgba(230,255,230,0.7) 50%, rgba(255,255,255,0.7) 80%)", //'rgba(255, 238, 238, 0.9)',
        //background: 'linear-gradient(to right bottom, #430089, #82ffa1)', //'rgba(255, 238, 238, 0.9)',
      },
      menu: { // color of menus,
        text: 'blue',
        background: 'rgba(255, 238, 238, 0.9)',
      },
      header: { // topbar
        text: 'white',
        selected: 'yellow',
        background: 'rgba(0, 150, 255, 0.9)',
      },
      navigation: { // bottombar
        text: 'blue',
        selected: 'white',
        background: 'rgba(0, 150, 255, 0.9)',
      },
    }, // of colors


  };

  // init of all non-observables
  _helpers = {

  };


  // getter and setter
  get debug() { return this.obervables.debug }
	set debug(o) { runInAction(() => { this.obervables.debug = o; }) }

  get app() { return this._obervables.app }
	set app(o) { runInAction(() => { this.obervables.app = o; }) }

  get colors() { return this.obervables.colors }
	set colors(o) { runInAction(() => { this.obervables.colors = o; }) }

  get state() { return this.obervables.state }
	set state(o) { runInAction(() => { this.obervables.state = o; }) }
};

decorate(Store, {
  _obervables: observable,
  _helpers: observable,
});

export default Store;
