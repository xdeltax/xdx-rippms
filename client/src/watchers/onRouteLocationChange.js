import store from 'store'; // mobx-store

/*
/ AppRouter.js::
/ 	getSnapshotBeforeUpdate(prevProps, prevState) { // called right before every render
/    	updateRouteLocation(this.props.location.pathname, prevProps.location.pathname );
/    	return null; // return snapshot
/   }
*/
export const updateRouteLocation = (newPathname, oldPathname) => {
  if (newPathname !== oldPathname) { // on every url-change
    store.set("system.app.watchers.route.pathname", newPathname);

    global.log("watcher:: routeLocation:: new pathname:: ", newPathname, );
  }
}
