import store from 'store'; // mobx-store

let connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

const updateStatus = () => {
  let type = connection.effectiveType;
  let downLink = connection.effectiveType;

  store.set("system.app.watchers.connection.type", type);
  store.set("system.app.watchers.connection.downlink", downLink);

  global.log("watcher/connection::", connection, type, downLink, );
}

// AppLandingPage:: componentDidMount
export const watchConnectionStatus = () => {
  if (connection) {
    global.log("watcher/connection:: addEventListener", );
    updateStatus();
    connection.addEventListener('change', updateStatus);
  }
}

export const unwatchConnectionStatus = () => {
  if (connection) {
    global.log("watcher/connection:: removeEventListener", );
    connection.removeEventListener('change', updateStatus);
  }
}
