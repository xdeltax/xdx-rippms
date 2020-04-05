class MemoryStore {
  get app() { return this._data; }
  get actions() { return this.app.actions; }
  set actions(v){ this.app.actions = v; }
  get color() { return this.app.config.color; }

  _data = {
    actions: {
      hideSpinner: true,
    },

    config: {
      size: {
        minWidth: "360px", // used in ./AppLandingPage
        minHeight: "360px", // used in ./AppLandingPage
        maxWidth: null, // used in ./AppLandingPage
        maxHeight: null, // used in ./AppLandingPage
      },

      color: { // application colors
        app: {
          text: 'black', // used in ./AppLandingPage with fallback black
          background: 'rgba(240, 255, 240, 1.0)', // used in ./AppLandingPage with fallback white
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
        game: {
          text: "white",
          background: '#000000',
        }
      },
    },

    state: {
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
    },

    watcher: {
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
        isConnected: false, // set in ./api/socket.js
        pongMS: 0, // updated at every socket ping-response // set in ./api/socket.js
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
      },

      route: {
        pathname: "", // AppRouter:: componentDidUpdate
      },

      visibility: {
        hidden: null,
        visibilityState: null,
      },

      versions: {
        map: null,
      },
    },
  };

  async init() {

  }
}

const memStore = new MemoryStore();
export default memStore;
