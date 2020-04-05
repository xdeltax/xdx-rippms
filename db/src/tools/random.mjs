//global.absRandom    = (value) => Math.floor(value * Math.random());
//global.randomHash   = (value) => "hash" + global.absRandom(100000000);
export const random = (range) => Math.floor((range || 100) * Math.random());
