module.exports = (obj,depth) => {
  global.ddd("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  global.ddd("INSPECT;:", require('util').inspect(obj, {showHidden:1, depth:depth, colors:1} ));
  global.ddd("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
};
