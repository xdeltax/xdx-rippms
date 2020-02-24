//import debuglog from "../debug/consolelog.mjs"; const clog = debuglog(import.meta.url);

/*
[ { x: 0, y: 0, hash: '203AAA' }, { l: 0, t: 0, r: 0, b: 0, dim: 1 } ]
[ { x: 1, y: 0, hash: '203AAB' }, { l: 1, t: 0, r: 1, b: 0, dim: 1 } ]
[ { x: 2, y: 0, hash: '203ABA' }, { l: 2, t: 0, r: 2, b: 0, dim: 1 } ]
[ { x: 3, y: 0, hash: '203ABB' }, { l: 3, t: 0, r: 3, b: 0, dim: 1 } ]
[ { x: 4, y: 0, hash: '203BAA' }, { l: 4, t: 0, r: 4, b: 0, dim: 1 } ]
[ { x: 5, y: 0, hash: '203BAB' }, { l: 5, t: 0, r: 5, b: 0, dim: 1 } ]
[ { x: 0, y: 1, hash: '203AAC' }, { l: 0, t: 1, r: 0, b: 1, dim: 1 } ]
[ { x: 1, y: 1, hash: '203AAD' }, { l: 1, t: 1, r: 1, b: 1, dim: 1 } ]
[ { x: 2, y: 1, hash: '203ABC' }, { l: 2, t: 1, r: 2, b: 1, dim: 1 } ]
[ { x: 3, y: 1, hash: '203ABD' }, { l: 3, t: 1, r: 3, b: 1, dim: 1 } ]
[ { x: 4, y: 1, hash: '203BAC' }, { l: 4, t: 1, r: 4, b: 1, dim: 1 } ]
[ { x: 5, y: 1, hash: '203BAD' }, { l: 5, t: 1, r: 5, b: 1, dim: 1 } ]
*/
/*
{ x: 0, y: 0, hash: '203A' }, { l: 0, t: 0, r: 3, b: 3, dim: 4 } ]
{ x: 1, y: 0, hash: '203A' }, { l: 0, t: 0, r: 3, b: 3, dim: 4 } ]
{ x: 2, y: 0, hash: '203A' }, { l: 0, t: 0, r: 3, b: 3, dim: 4 } ]
{ x: 3, y: 0, hash: '203A' }, { l: 0, t: 0, r: 3, b: 3, dim: 4 } ]
{ x: 4, y: 0, hash: '203B' }, { l: 4, t: 0, r: 7, b: 3, dim: 4 } ]
{ x: 5, y: 0, hash: '203B' }, { l: 4, t: 0, r: 7, b: 3, dim: 4 } ]
{ x: 0, y: 1, hash: '203A' }, { l: 0, t: 0, r: 3, b: 3, dim: 4 } ]
{ x: 1, y: 1, hash: '203A' }, { l: 0, t: 0, r: 3, b: 3, dim: 4 } ]
{ x: 2, y: 1, hash: '203A' }, { l: 0, t: 0, r: 3, b: 3, dim: 4 } ]
{ x: 3, y: 1, hash: '203A' }, { l: 0, t: 0, r: 3, b: 3, dim: 4 } ]
{ x: 4, y: 1, hash: '203B' }, { l: 4, t: 0, r: 7, b: 3, dim: 4 } ]
{ x: 5, y: 1, hash: '203B' }, { l: 4, t: 0, r: 7, b: 3, dim: 4 } ]
*/

let  fastPow = []; //Math.pow(divider, exponent);
fastPow[2] = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 525288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432];
fastPow[3] = [1, 3, 9, 27, 81, 254, 729, 2187, 6561, 19683, 59049, 177147, 531441, 1594323, 4782969, 14348907, 43046721];
fastPow[4] = [1, 4, 16, 64, 256, 1024, 4096, 16384, 65536, 262144, 1048576, 4194304, 16777216, 67108864];
fastPow[5] = [1, 5, 25, 125, 625, 3125, 15625, 78125, 390625, 1953125, 9765625, 48828125];
fastPow[6] = [1, 6, 36, 216, 1296, 7776, 46656, 279936, 1679616, 10077696, 60466176];
fastPow[7] = [1, 7, 49, 343, 2401, 16807, 117649, 823543, 5764801, 40353607, 282475249];
fastPow[8] = [1, 8, 64, 512, 4096, 32768, 262144, 2097152, 16777216, 134217728];

let baseArray = [];
baseArray[2] = "ABCD"; // divider: 2 x 2 => base 4
baseArray[3] = "ABCDEFGHI"; // divider: 3 x 3 -> base 9
baseArray[4] = "ABCDEFGHIJKLMNOP"; // divider 4 X 4 -> base 16
baseArray[5] = "ABCDEFGHIJKLMNOPQRSTUVWXY"; // divider 5 X 5 -> base 25
baseArray[6] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // divider 6 X 6 -> base 36
baseArray[7] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklm"; // divider 7 x 7 -> base 49 -> 26 + 26 - 3
baseArray[8] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz_-"; // divider 8 x 8 = 64
//baseArray[9]="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz_-!#$%()[]{}.,*+;<>"; // divider 9 x 9 = 81 -> 26 + 26 + 10 = 62 + 22 special chars

/*
let baseXYZArray = [];
baseXYZArray[2] = "ABCDEFGH"; // 2 x 2 = 4 x 2 = 8
baseXYZArray[3] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0"; // 3 x 3 = 9 x 3 = 27
baseXYZArray[4] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz_-"; // 4 x 4 = 16x 4 = 64
*/

const mathLogBase = (a, x) => Math.log(x) / Math.log(a); // log,a(x)

export const calcExponent = (divider, x, y) => {
  // dimXY needs to be fit power(divider, xx) with xx is an integer
  // set a divider and the range to use -> calculate the next dimXY to fullfill divider^xx = dimXY with xx integer
  // a^xx = y -> log,a(a^xx) = log,a(y) -> x = log,a(y) -> xx = mathLogBase(a, y)
  // x = log(divider, divXY) -> x needs to be floored integer
  if (!x) x = 0;
  if (!y) y = 0;
  if (!divider || divider < 2) divider = 2;
  let dimXY = (x > y) ? x : y;
  const xx = mathLogBase(divider, dimXY);
  return (xx === Math.floor(xx)) ? xx : Math.floor(xx + 1);
}

export const point2hash = (x, y, divider, exponent) => {
  if (!divider) return null;
  if (!exponent) return null;
  //const exponentTag = exponent.toString().padStart(2, "0");

  let dimXY = fastPow[divider][exponent] || Math.pow(divider, exponent);
  if (x < 0 || y < 0 || x >= dimXY || y >= dimXY) return null;

  let hash = "";
  let stage = 0;
  while (stage++ <= 25) {
    dimXY = dimXY / divider;
    if (dimXY < 1) break; // ABORT-CRITERIA

    const areaIndexX = Math.floor(x / dimXY);
    const areaIndexY = Math.floor(y / dimXY);

    const hashChar = (baseArray[divider] || "").charAt(areaIndexX + divider * areaIndexY);
    if (!hashChar) break; // ABORT-CRITERIA

    //global.log("_point2hash:: ", x.toFixed(2), newDimXY.toFixed(2), areaIndexX.toFixed(2), hash, hashChar, stage);
    x = x - areaIndexX * dimXY;
    y = y - areaIndexY * dimXY;
    hash = hash + hashChar;
  }

  return (hash) ? divider + /*exponentTag +*/ hash : null;
}

export const hash2rect = (taggedHash, cutoff) => {
  if (!taggedHash || typeof taggedHash !== 'string' || taggedHash.length < 2) return null; // (divider:1)(exponent:2)(hash:1..x)

  // extract divider from hash
  const divider = Number(taggedHash.charAt(0)); // extract position 0
  if (!Number.isInteger(divider)) return null;

  // extract hash
  let hash = taggedHash.slice(1); // remove first char
  const exponent = hash.length;  // extract exponent from hash (exponent = length of original hash)
  if (!exponent) return null;

  if (cutoff) hash = hash.slice(0, -cutoff);
  if (hash.length <= 0) return null;

  // calc dimensions of hash-map (use from precalculated array or fallback to math)
  let dimXY = fastPow[divider][exponent] || Math.pow(divider, exponent);
  let xTL = 0;
  let yTL = 0;
  for (let stage = 0; stage < hash.length; stage++) {
    const hashChar = hash.charAt(stage);
    const baseIndex= (baseArray[divider] || "").indexOf(hashChar);

    const areaIndexY = Math.floor(baseIndex / divider);
    const areaIndexX = baseIndex - divider * areaIndexY;

    dimXY = dimXY / divider;
    xTL = xTL + areaIndexX * dimXY;
    yTL = yTL + areaIndexY * dimXY;
  }

  return {
    x1: xTL,
    y1: yTL,
    x2: xTL + dimXY - 1,
    y2: yTL + dimXY - 1,
    dim: dimXY,
  };
}

/*
export const hash2rect = (taggedHash, cutoff) => { // return: x/y: top/left corner of rectangle and width/height
  if (!taggedHash || taggedHash.length < 2) return null; // (divider:1)(exponent:2)(hash:1..x)

  // extract divider from hash
  const divider = Number(taggedHash.charAt(0)); // extract position 0
  if (!Number.isInteger(divider)) return null;

  // extract hash
  let hash = taggedHash.slice(1); // remove first char
  if (!hash) return null;

  // extract exponent from hash (exponent = length of original hash)
  const exponent = hash.length;
  if (!exponent) return null;

  if (cutoff) hash = hash.slice(0, -cutoff);

  // calc dimensions of hash-map (use from precalculated array or fallback to math)
  const validDimXY = fastPow[divider][exponent] || Math.pow(divider, exponent);

  //clog("hash2rect:: ", divider, exponent, validDimXY, hash);
  return _hash2rectRecursion(hash, 0, 0, validDimXY, divider, 0);
}

const _hash2rectRecursion = (hash, xTL, yTL, dimXY, divider, stage) => {
  //clog("_hash2rect:: ", xTL.toFixed(2), yTL.toFixed(2), dimXY.toFixed(2), hash, stage);
  if (stage >= hash.length) return {
    x1: xTL,
    y1: yTL,
    x2: xTL + dimXY - 1,
    y2: yTL + dimXY - 1,
    dim: dimXY,
  }; // ABORT-CRITERIA

  const hashChar = hash.charAt(stage);
  //const baseArr  = _getBaseArr(divider);
  const baseIndex= (baseArray[divider] || "").indexOf(hashChar);
  //const indexInBaseString = this._getBaseArr(divider).indexOf(hash.charAt(stage)); // this.baseArr.indexOf(hash[stage]);

  const newDimXY   = dimXY / divider;
  const areaIndexY = Math.floor(baseIndex / divider);
  const areaIndexX = baseIndex - divider * areaIndexY;

  const newXTopLeft = xTL + areaIndexX * newDimXY;
  const newYTopLeft = yTL + areaIndexY * newDimXY;
  return _hash2rectRecursion(hash, newXTopLeft, newYTopLeft, newDimXY, divider, stage + 1)
}
*/


/*
export const point2hash = (x, y, divider, exponent) => {
  if (!divider) return null;
  if (!exponent) return null;
  //const exponentTag = exponent.toString().padStart(2, "0");

  const validDimXY = fastPow[divider][exponent] || Math.pow(divider, exponent);
  if (x < 0 || y < 0 || x >= validDimXY || y >= validDimXY) return null;

  global.log("1::", _point2hashLoop(x, y, validDimXY, divider, "", 0));
  global.log("2::", _point2hashRecursion(x, y, validDimXY, divider, "", 0));
  const hash = _point2hashLoop(x, y, validDimXY, divider, "", 0);

  return (hash) ? divider + hash : null;
};


export const point2hash = (x, y, divider, exponent) => {
  if (!divider) return null;
  if (!exponent) return null;
  //const exponentTag = exponent.toString().padStart(2, "0");

  const validDimXY = fastPow[divider][exponent] || Math.pow(divider, exponent);
  if (x < 0 || y < 0 || x >= validDimXY || y >= validDimXY) return null;

  global.log("1::", _point2hashLoop(x, y, validDimXY, divider, "", 0));
  global.log("2::", _point2hashRecursion(x, y, validDimXY, divider, "", 0));
  const hash = _point2hashLoop(x, y, validDimXY, divider, "", 0);

  return (hash) ? divider + hash : null;
};

const _point2hashRecursion = (x, y, dimXY, divider, hash, stage) => {
  const newDimXY = dimXY / divider;
  if (newDimXY < 1 || stage > 25) return hash; // ABORT-CRITERIA

  const areaIndexX = Math.floor(x / newDimXY);
  const areaIndexY = Math.floor(y / newDimXY);

  //const baseArr = _getBaseArr(divider);
  const hashChar = (baseArray[divider] || "").charAt(areaIndexX + divider * areaIndexY);
  if (!hashChar) return hash; // ABORT-CRITERIA

  //clog("_point2hash:: ", x.toFixed(2), newDimXY.toFixed(2), areaIndexX.toFixed(2), hash, hashChar, stage);

  // return hash with dividertag
  return _point2hashRecursion(x - areaIndexX * newDimXY, y - areaIndexY * newDimXY, newDimXY, divider, hash + hashChar, stage + 1);
}
*/
