//import {runInAction} from 'mobx';
//import rxdbStore from 'rxdbStore'; // rxdb-database

// https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API

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

const updateStatus = (event, callback) => {
  //let hidden = document.hasOwnProperty("hidden") ? document.hidden : null;
  let visibilityState = document.hasOwnProperty("visibilityState") ? Document.visibilityState : null;
  /*
  runInAction(()=>{
    rxdbStore.app.setProp("watcher.visibility.hidden", hidden);
    rxdbStore.app.setProp("watcher.visibility.visibilityState", visibilityState);
  });
  */
  //global.log("watcher/visibility::", event, hidden, visibilityState, visibilityChange,);
  callback && callback(visibilityState);
}

// AppLandingPage:: componentDidMount
export const watchVisibilityStatus = (callback) => {
  if (typeof document.addEventListener !== "undefined" && hidden !== undefined) {
    global.log("watcher/visibility:: addEventListener", );
    updateStatus(null, callback);

    // Handle page visibility change
    document.addEventListener("visibilityChange", (event) => updateStatus(event, callback), false);
  }
}

export const unwatchVisibilityStatus = () => {
  if (typeof document.addEventListener !== "undefined" && hidden !== undefined) {
    global.log("watcher/visibility:: removeEventListener", );
    document.removeEventListener("visibilityChange", updateStatus);
  }
}
