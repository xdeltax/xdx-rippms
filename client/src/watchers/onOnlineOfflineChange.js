import store from 'store'; // mobx-store

const updateStatus = (event) => {
  global.log("watcher/online::", event.type);
  if (event.type === "offline"){
    store.set("system.app.watchers.connection.isOnline", false);
    store.set("system.app.watchers.connection.wentOffline", global.now());

    //this.props.onWentOffline && this.props.onWentOffline(store.navigator.wasSince);
  } else
  if (event.type === "online"){
    store.set("system.app.watchers.connection.isOnline", true);
    store.set("system.app.watchers.connection.wentOnline", global.now());

    //this.props.onWentOnline && this.props.onWentOnline(store.navigator.wasSince);
  }
}

// AppLandingPage:: componentDidMount
export const watchOnlineOfflineStatus = () => {
  global.log("watcher/online:: addEventListener", );
  updateStatus({type: (navigator.onLine || null) ? "online" : "offline"})
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
}

export const unwatchOnlineOfflineStatus = () => {
  global.log("watcher/online:: removeEventListener", );
  window.removeEventListener('online', updateStatus);
  window.removeEventListener('offline', updateStatus);
}
