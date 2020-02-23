import store from 'store'; // mobx-store

const updateStatus = () => {
  const orientation = window.screen.orientation;

  store.appstate.set("app.watchers.orientation.type", orientation.type);
  store.appstate.set("app.watchers.orientation.angle", orientation.angle);

  global.log("watcher/orientation:: orientationchange:: ", orientation);
}

// AppLandingPage:: componentDidMount
export const watchOrientationStatus = () => {
  global.log("watcher/connection:: addEventListener", );
  updateStatus();
  window.addEventListener("orientationchange", updateStatus);
}

export const unwatchOrientationStatus = () => {
  global.log("watcher/connection:: removeEventListener", );
  window.removeEventListener("orientationchange", updateStatus);
}
