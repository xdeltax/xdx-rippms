import {decorate, observable, runInAction, /*toJS,*/} from 'mobx';
import MobxPrototype from "./MobxPrototype";

class MobxAppState extends MobxPrototype {
  constructor(store) { super(store); /*store init-state of all vars::*/ this.saveInitialState(this._obervables, this._helpers); };

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
        socket: {
          isConnected: false,
          _callstats: { // updated at every socket-call-response
            timeclientout: 0, // unixtime from client right before sending request to server
            timeserverin: 0,  // unixtime from server right after incoming request
            timeserverout: 0, // unixtime from server right before sending result to client
            timeclientin: 0,  // unixtime from client right after incoming result
            client2client: 0, // transport-time from client request emit until back to client-event
            client2server: 0, // transport-time from client request emit to server-event
            server2server: 0, // processing time for database-query on server
            server2client: 0, // transport-time from server result emit to client-event
          },
          pongMS: 0, // updated at every socket ping-response
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

decorate(MobxAppState, {
  _obervables: observable,
});

export default MobxAppState;
