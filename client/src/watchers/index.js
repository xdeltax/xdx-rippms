import { watchOnlineOfflineStatus, unwatchOnlineOfflineStatus } from "./onOnlineOfflineChange";
import { watchConnectionStatus, unwatchConnectionStatus } from "./onConnectionChange";
import { watchOrientationStatus, unwatchOrientationStatus } from "./onOrientationChange";
import { watchVisibilityStatus, unwatchVisibilityStatus } from "./onVisibilityChange";


export const start = () => {
  watchConnectionStatus();
  watchOnlineOfflineStatus();
  watchOrientationStatus();
  watchVisibilityStatus();
}

export const stop = () => {
  unwatchConnectionStatus();
  unwatchOnlineOfflineStatus();
  unwatchOrientationStatus();
  unwatchVisibilityStatus();
}
