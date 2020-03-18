//import rxdbStore from 'rxdbStore'; // rxdb-database

/*
/ AppRouter.js::
/ 	getSnapshotBeforeUpdate(prevProps, prevState) { // called right before every render
/    	updateRouteLocation(this.props.location.pathname, prevProps.location.pathname );
/    	return null; // return snapshot
/   }
*/
let callback;

export const updateRouteLocation = (newPathname, oldPathname) => {
  if (newPathname !== oldPathname) { // on every url-change
    //rxdbStore.app.setProp("watcher.route.pathname", newPathname);

    callback && callback(oldPathname, newPathname);

    global.log("watcher:: routeLocation:: new pathname:: ", newPathname, );
  }
}

export const watchRouteLocation = (_callback) => {
  global.log("watcher/routeLocation:: addCallback", );
  callback = _callback;
}

export const unwatchRouteLocation = () => {
  global.log("watcher/routeLocation:: removeCallback", );
  callback = null;
}
