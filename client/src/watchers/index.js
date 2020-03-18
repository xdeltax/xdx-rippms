import { watchOnlineOfflineStatus, unwatchOnlineOfflineStatus } from "./onOnlineOfflineChange";
import { watchConnectionStatus, unwatchConnectionStatus } from "./onConnectionChange";
import { watchOrientationStatus, unwatchOrientationStatus } from "./onOrientationChange";
import { watchVisibilityStatus, unwatchVisibilityStatus } from "./onVisibilityChange";
import { watchRouteLocation, unwatchRouteLocation } from "./onRouteLocationChange";


export const start = (connectionCallback, onlineOfflineCallback, orientationCallback, visibilityStateCallback, routeLocationCallback) => {
  watchConnectionStatus((connection_type, connection_downLink) => { connectionCallback && connectionCallback(connection_type, connection_downLink); });
  watchOnlineOfflineStatus((event_type, wentOnline, wentOffline, lastDiffInSec) => { onlineOfflineCallback && onlineOfflineCallback(event_type, wentOnline, wentOffline, lastDiffInSec); });
  watchOrientationStatus((orientation_type, orientation_angle) => { orientationCallback && orientationCallback(orientation_type, orientation_angle); });
  watchVisibilityStatus((visibilityState) => { visibilityStateCallback && visibilityStateCallback(visibilityState); });
  watchRouteLocation((oldPathname, newPathname) => { routeLocationCallback && routeLocationCallback(oldPathname, newPathname); });
}

export const stop = () => {
  unwatchConnectionStatus();
  unwatchOnlineOfflineStatus();
  unwatchOrientationStatus();
  unwatchVisibilityStatus();
  unwatchRouteLocation();
}
