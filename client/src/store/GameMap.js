import PrototypeStore from "./PrototypeStore";
import * as bytebuffer4Tilemap from "game/tools/bytebuffer4Tilemap";
import * as localDatabase from "localDatabase/index.js"; // loadAppData, saveAppData, deleteAppData
import * as gameMapAPI from "api/gameMapAPI.js";

export default class GameMap extends PrototypeStore {
  constructor(store) {
    super(store); /*store init-state of all vars::*/
    this.init();

    this.saveInitialState(this._nonobervables, this._helpers);
  };

  _constants = {
  }

  // init of all observables
  _nonobervables = {
    tilemap: {
      mapid: 0,
      mapstyle: 0,
      //tileset: ["", "", "", ""],

      width: 10,
      height: 10,

      bufferBytes: 2,
      buffer: null,
      dataview: null,

      updatedAt: 0,
    },

  };

  _helpers = {
  };

  // setters and getters
  get tilemap() { return this._nonobervables.tilemap }
  set tilemap(o) { this._nonobervables.tilemap = o }

  init = (bufferBytes) => {
    this.tilemap.bufferBytes = bufferBytes || 1; // 2 bytes per entry

    this.tilemap.buffer   = bytebuffer4Tilemap.createBuffer(this.tilemap.bufferBytes, this.tilemap.width, this.tilemap.height);
    this.tilemap.dataview = bytebuffer4Tilemap.createDataView(this.tilemap.buffer);

    global.log("GameMap:: init:: ", this.tilemap.bufferBytes, this.tilemap.dataview)
  }


  updatecheckMapGroundlayer = async () => {
    const {err, res} = await gameMapAPI.updatecheckMapGroundLayer();
    if (res) {};
    if (!err) {
	  	//const { } = res || {};

      //this.set_obj(this.tilemap.buffer, buffer);

      this.merge_all({
        //user: user || {},
      });

      await localDatabase.saveAppData();
    }

    if (err) {
      //this.clear_all();
    }
  }

};
