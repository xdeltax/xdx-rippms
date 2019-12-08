// AppLandingPage:: componentDidMount
export const watchUnloadAppEventAndUpdate = (func) => {
  global.log("watcher/onAppLoadUnload:: addEventListener:: beforeunload", );

  window.addEventListener("beforeunload", func, {once: true});
}

/*
// AppLandingPage:: componentWillUnmount
export const unwatchUnloadAppEvent = (func) => {
  global.log("watcher/onAppLoadUnload:: removeEventListener:: beforeunload", );

  window.removeEventListener("beforeunload", func)
}
*/
