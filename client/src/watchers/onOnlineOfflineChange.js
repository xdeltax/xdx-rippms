//import {runInAction} from 'mobx';
//import rxdbStore from 'rxdbStore'; // rxdb-database

let wentOffline = 0;
let wentOnline = 0;
let lastDiff = 0;

const updateStatus = (event, callback) => {
  //global.log("************** watcher/online::", event.type, callback);
  if (event.type === "offline"){
    wentOffline = global.nowUnix();
    lastDiff = (wentOnline === 0) ? 0 : wentOffline - wentOnline;
    /*
    runInAction(()=>{
      rxdbStore.app.setProp("watcher.connection.isOnline", false);
      rxdbStore.app.setProp("watcher.connection.wentOffline", global.now());
    });
    */
    //this.props.onWentOffline && this.props.onWentOffline(store.navigator.wasSince);
  } else
  if (event.type === "online"){
    wentOnline = global.nowUnix();
    lastDiff = (wentOffline === 0) ? 0 : wentOnline - wentOffline;
    /*
    runInAction(()=>{
      rxdbStore.app.setProp("watcher.connection.isOnline", true);
      rxdbStore.app.setProp("watcher.connection.wentOnline", global.now());
    });
    */
    //this.props.onWentOnline && this.props.onWentOnline(store.navigator.wasSince);
  }
  callback && callback(event.type, wentOnline, wentOffline, lastDiff) // "online" / "offline"
}

// AppLandingPage:: componentDidMount
export const watchOnlineOfflineStatus = (callback) => {
  global.log("watcher/online:: addEventListener", );
  updateStatus({type: (navigator.onLine || null) ? "online" : "offline"}, callback)
  window.addEventListener('online', (event) => updateStatus(event, callback));
  window.addEventListener('offline',(event) => updateStatus(event, callback));
}

export const unwatchOnlineOfflineStatus = () => {
  global.log("watcher/online:: removeEventListener", );
  window.removeEventListener('online', updateStatus);
  window.removeEventListener('offline', updateStatus);
}
