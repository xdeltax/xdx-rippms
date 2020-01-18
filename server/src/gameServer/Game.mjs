import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);
import {unixtime} from "../tools/datetime.mjs";
import debugSleeper from "../tools/sleeper.mjs";

import * as nodegameloop from '../tools/node-gameloop.mjs';

// ===============================================
// gameloop
// ===============================================
export default class Game {
  gameloopID = null;
  fps = 15;
  frameCount = 0;
  playing = false;
  startTimeUnix = 0;
  runningForSec = 0;

  constructor(fps, stopAfterSec) {
    this.setFps(fps);
    this.setStopAfterSec(stopAfterSec);
  }

  setFps = (fps) => {
    this.fps = (fps) ? fps : 15;
  }

  setStopAfterSec = (stopAfterSec) => {
    this.stopAfterSec = (stopAfterSec) ? stopAfterSec : 0;
  }

  init = async () => {
    const t1 = new Date();
    clog("game:: init:: start.", )

    /*
    const { WorldMap } = require('./game/WorldMap.js');
    const worldMap = new WorldMap(5000);
    worldMap.display();
    clog("mapinit:: timeInMS:: ", new Date - t1);
    clog("mapinit:: mapsize:: ", worldMap.map.data2D.length, worldMap.map.data2D.length * worldMap.map.data2D[0].length);
    */

    this.onInitDone && this.onInitDone();
    clog("game:: init:: done.", )
  }

  preload = async () => {
    clog("game:: preload:: start.", )

    await debugSleeper(5000);

    this.onPreloadDone && this.onPreloadDone();
    clog("game:: preload:: done.", )
  }

  start = () => {
    // start the loop at 30 fps (1000/30ms per frame) and grab its id
    this.gameloopID = nodegameloop.setGameLoop(this.update, 1000 / this.fps);
    this.playing = true;
    this.startTimeUnix = unixtime();
    this.unixtime = unixtime();
    this.timeCount = unixtime();

    const timeInSec = this.stopAfterSec || 0; // stop the loop x seconds later
    if (timeInSec !== 0) setTimeout(this.stop, timeInSec * 1000);

    this.onStart && this.onStart();
  }

  stop = () => {
    clog(`stopping the game loop after ${this.runningForSec.toFixed(2)} sec`);
    nodegameloop.clearGameLoop(this.gameloopID);
    this.playing = false;
    this.startTimeUnix = 0;

    this.onStop && this.onStop();
  }

  update = (delta) => { // `delta` is the delta time from the last frame
    this.frameCount++;
    this.unixtime = unixtime();
    this.runningForSec = this.unixtime - this.startTimeUnix;
    //clog('update:: ', this.frameCount, delta.toFixed(6));

    if (this.unixtime - this.timeCount >= 2) { // in seconds
      this.timeCount = unixtime();
      clog("gameloop:: ", this.runningForSec.toFixed(2), this.frameCount, this.fps, delta.toFixed(6), (delta * this.fps).toFixed(6), (1 / delta).toFixed(2));
    }

    //if (this.frameCount % 30 === 0)
    //clog("gameloop:: ", this.runningForSec.toFixed(2), this.frameCount, this.fps, delta.toFixed(6), (delta * this.fps).toFixed(6), (1 / delta).toFixed(2));

    // fps: 20 fps -> delta = 0.05000 -> delta * fps = 1 sec -> fps = 1 sec / delta = 1 / 0.05 = 20 fps
    // fps: 500 fps-> delta, max = 0.0160 -> max fps = 1 / 0.016 = 62.5 fps
  }
}
