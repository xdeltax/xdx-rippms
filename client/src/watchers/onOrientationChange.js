//import {runInAction} from 'mobx';
//import rxdbStore from 'rxdbStore'; // rxdb-database

const updateStatus = (event, callback) => {
  const orientation = window.screen.orientation;
  /*
  runInAction(()=>{
    rxdbStore.app.setProp("watcher.orientation.type", orientation.type);
    rxdbStore.app.setProp("watcher.orientation.angle", orientation.angle);
  });
  */
  //global.log("watcher/orientation:: orientationchange:: ", orientation);
  callback && callback(orientation.type, orientation.angle);
}

// AppLandingPage:: componentDidMount
export const watchOrientationStatus = (callback) => {
  global.log("watcher/connection:: addEventListener", );
  updateStatus(null, callback);
  window.addEventListener("orientationchange", (event) => updateStatus(event, callback));
}

export const unwatchOrientationStatus = () => {
  global.log("watcher/connection:: removeEventListener", );
  window.removeEventListener("orientationchange", updateStatus);
}
