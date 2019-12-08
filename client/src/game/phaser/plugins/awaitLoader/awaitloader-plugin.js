import * as Phaser from 'phaser'
import loaderCallback from './awaitLoaderCallback.js';

class AwaitLoaderPlugin extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager) {
        super(pluginManager);

        pluginManager.registerFileType('awaitLoaderPlugin', loaderCallback);
    }

    addToScene(scene) {
        scene.sys.load['awaitLoaderPlugin'] = loaderCallback;
    }
}

export default AwaitLoaderPlugin;
