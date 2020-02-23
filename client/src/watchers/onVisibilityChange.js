// https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
import store from 'store'; // mobx-store

// Set the name of the hidden property and the change event for visibility
let hidden, visibilityChange;
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

const updateStatus = (event) => {
  //let hidden = document.hasOwnProperty("hidden") ? document.hidden : null;
  let visibilityState = document.hasOwnProperty("visibilityState") ? Document.visibilityState : null;

  store.appstate.set("app.watchers.visibility.hidden", hidden);
  store.appstate.set("app.watchers.visibility.visibilityState", visibilityState);

  global.log("watcher/visibility::", event, hidden, visibilityState, visibilityChange,);
}

// AppLandingPage:: componentDidMount
export const watchVisibilityStatus = () => {
  if (typeof document.addEventListener !== "undefined" && hidden !== undefined) {
    global.log("watcher/visibility:: addEventListener", );
    updateStatus();

    // Handle page visibility change
    document.addEventListener(visibilityChange, updateStatus, false);
  }
}

export const unwatchVisibilityStatus = () => {
  if (typeof document.addEventListener !== "undefined" && hidden !== undefined) {
    global.log("watcher/visibility:: removeEventListener", );
    document.removeEventListener(visibilityChange, updateStatus);
  }
}
