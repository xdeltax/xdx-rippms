const path = require('path');

module.exports = (txt) => {
  // ===============================================
  // global-helpers
  // ===============================================
  global.base_dir = __dirname;
  global.abs_path = (p) => { return path.join(global.base_dir, p) } // abs_path('lib/Utils.js');
  global.requireX = (f) => { return require(abs_path('/' + f)) } // instead of: require('../../../lib/Utils.js'); -> requireX('lib/Utils.js');

  global.getRandomInt = (max) => { return Math.floor(Math.random() * Math.floor(max)); }
  global.absRandom 		= (max) => Math.floor(max*Math.random());
  global.randomHash 	= () => "hash"+Math.floor(100000000*Math.random());

  global.now = () => new Date().toLocaleTimeString();
  global.clog  = console.log.bind(console);
  global.elog  = console.error.bind(console);
  global.log 	 = ( ...restArgs ) => { clog (txt || "", global.now(), restArgs); };
  global.gerror= ( ...restArgs ) => { elog (txt || "", global.now(), restArgs); };

  global.numCPU = process.env.NUMBER_OF_PROCESSORS;
}
