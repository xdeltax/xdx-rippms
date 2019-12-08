// usage::     let _title = tryFallback(() => userProfile.get_("username"), "");
export default /*const tryFallback =*/ (fn, fallback = null, _this = null) => {
  try {
    return fn()
  } catch (error) {
    global.log("TRYFALLBACK CATCH:: ", error, _this ? _this : "")
    return fallback;
  }
}
