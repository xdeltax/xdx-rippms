import store from 'store'; // mobx-store

// AppRouter:: componentDidUpdate()
export const updateRouteLocation = (newPathname, oldPathname) => {
  if (newPathname !== oldPathname) { // on every url-change
    store.set("system.app.watchers.route.pathname", newPathname);

    global.log("watcher:: routeLocation:: new pathname:: ", newPathname, );
  }
}
