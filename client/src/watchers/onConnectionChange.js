//import {runInAction} from 'mobx';
//import rxdbStore from 'rxdbStore'; // rxdb-database

let connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

const updateStatus = (event, callback) => {
  //const connection = event.currentTarget;
  let type = connection.effectiveType; // "4g"
  let downlink = connection.downlink; // 10
  /*
  runInAction(()=>{
    rxdbStore.app.setProp("watcher.connection.type", type);
    rxdbStore.app.setProp("watcher.connection.downlink", downlink);
  });
  */
  //global.log("watcher/connection::", connection, type, downlink, event, callback);
  callback && callback(type, downlink)
}

// AppLandingPage:: componentDidMount
export const watchConnectionStatus = (callback) => {
  if (connection) {
    global.log("watcher/connection:: addEventListener", );
    updateStatus({currentTarget: connection}, callback);
    connection.addEventListener('change', (event) => updateStatus(event, callback));
  }
}

export const unwatchConnectionStatus = () => {
  if (connection) {
    global.log("watcher/connection:: removeEventListener", );
    connection.removeEventListener('change', updateStatus);
  }
}
