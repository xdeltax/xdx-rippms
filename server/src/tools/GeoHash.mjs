import {clog, } from "./consoleLog.mjs";

/*
const mapwidth = 30; // needs to be an integer factor of divider
const mapheight= 10; // needs to be an integer factor of divider
const divider = undefined; // hash-base = sqr(divider); 3: 3 x 3 = 9 tiles; divider = undefined -> autodetect
const digits = 1; // 0: integer only; 3: target resolution x.xxx; digits = undefined -> 0
const geohash = new GeoHash(mapwidth, mapheight, digits, divider);
const deviderUsed = geohash.divider;
const hash = geohash.getHashFromPoint(7,8)
const rect = geohash.getRectFromHash(hash);
clog("HASH:: ", deviderUsed, hash, rect, Math.round(rect.x), Math.round(rect.y));
*/

export default class GeoHash {
  digits;
  divider;
  width;
  height;
  baseArr;

  constructor(width, height, digits, divider, ) {
    this.digits = (!digits) ? 1 : Math.pow(10, digits);

    this.width  = width * this.digits;
    this.height = height* this.digits;

    this.divier = divider;
    if (!this.divider) this.divider = this.calcDivider(this.width, this.height);

    if (!this.divider) throw new Error ("width and height needs to be an integer factor of divider");
    if (this.divider < 2 || this.divider > 8) throw new Error ("divider needs to be between 2 and 9");
    if (this.width / this.divider !== Math.floor(this.width / this.divider)) throw new Error ("width needs to be an integer factor of divider");
    if (this.height/ this.divider !== Math.floor(this.height/ this.divider)) throw new Error ("height needs to be an integer factor of divider");
    if (this.width < this.divider) throw new Error ("width needs to be a equal or greater than divider");
    if (this.height < this.divider) throw new Error ("height needs to be a equal or greater than divider");
    /*
    this.baseArr = [];
    this.baseArr["2"] = "ABCD"; // divider: 2 x 2 => base 4
    this.baseArr["3"] = "ABCDEFGHI"; // divider: 3 x 3 -> base 9
    this.baseArr["4"] = "ABCDEFGHIJKLMNOP"; // divider 4 X 4 -> base 16
    this.baseArr["5"] = "ABCDEFGHIJKLMNOPQRSTUVWXY"; // divider 5 X 5 -> base 25
    this.baseArr["6"] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // divider 6 X 6 -> base 36
    this.baseArr["7"] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklm"; // divider 7 x 7 -> base 49 -> 26 + 26 - 3
    this.baseArr["8"] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz_-"; // divider 8 x 8 = 64
    this.baseArr["9"] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz_-!#$%()[]{}.,*+;<>"; // divider 9 x 9 = 81 -> 26 + 26 + 10 = 62 + 22 special chars
    */
    this.setDivider(this.divider);
  };

  getDivider = () => this.divider;

  setDivider = (value) => {
    this.divider = value;
    switch (value) {
      case 2: this.baseArr = "ABCD"; break; // divider: 2 x 2 => base 4
      case 3: this.baseArr = "ABCDEFGHI"; break; // divider: 3 x 3 -> base 9
      case 4: this.baseArr = "ABCDEFGHIJKLMNOP"; break; // divider 4 X 4 -> base 16
      case 5: this.baseArr = "ABCDEFGHIJKLMNOPQRSTUVWXY"; break; // divider 5 X 5 -> base 25
      case 6: this.baseArr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; break; // divider 6 X 6 -> base 36
      case 7: this.baseArr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklm"; break; // divider 7 x 7 -> base 49 -> 26 + 26 - 3
      case 8: this.baseArr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz_-"; break; // divider 8 x 8 = 64
      //case 9: this.baseArr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz_-!#$%()[]{}.,*+;<>"; break; // divider 9 x 9 = 81 -> 26 + 26 + 10 = 62 + 22 special chars
      default:this.baseArr = ""; break;
    }
  }

  calcDivider = (width, height) => {
    let divider = null;
    for (let i = 8; i >= 2; i--) {
      clog("calcDivider:: ", i, width, height, Math.floor(width / i), width / i)
      if (width >= i && height >= i && Math.floor(width / i) === width / i && Math.floor(height / i) === height / i) {
        divider = i;
        break;
      }
    }
    return divider;
  }

  getRectFromHash = (hash) => { // return: x/y: top/left corner of rectangle and width/height
    if (!hash) return null;
    return this._getXYFromHash_INTERNAL(hash, 0, 0, 0, this.width, this.height);
  }

  _getXYFromHash_INTERNAL = (hash, stage, xTL, yTL, widthX, widthY) => {
    if (stage >= hash.length) return {x: xTL / this.digits, y: yTL / this.digits, width: widthX / this.digits, height: widthY / this.digits}; // ABORT-CRITERIA
    const indexInBaseString = this.baseArr.indexOf(hash[stage]);
    const newWidthX = widthX / this.divider;
    const newWidthY = widthY / this.divider;
    const areaIndexY = Math.floor(indexInBaseString / this.divider);
    const areaIndexX = indexInBaseString - this.divider * areaIndexY;
    const newXTopLeft = xTL + areaIndexX * newWidthX;
    const newYTopLeft = yTL + areaIndexY * newWidthY;
    return this._getXYFromHash_INTERNAL(hash, stage + 1, newXTopLeft, newYTopLeft, newWidthX, newWidthY)
  }

  getHashFromPoint = (x, y) => {
    const xx = x * this.digits;
    const yy = y * this.digits;
    if (xx < 0 || yy < 0 || this.width < this.divider || this.height < this.divider || xx >= this.width || yy >= this.height) return null;
    return this._getHashFromXY_INTERNAL(xx, yy, this.width, this.height, "", 0);
  };

  _getHashFromXY_INTERNAL = (x, y, widthX, widthY, hash, stage) => {
    const newWidthX = widthX / this.divider;
    const newWidthY = widthY / this.divider;
    if ((newWidthX < 1 && newWidthY < 1) || stage > 25) return hash; // ABORT-CRITERIA
    const areaIndexX = Math.floor(x / newWidthX);
    const areaIndexY = Math.floor(y / newWidthY);
    const hashChar = this.baseArr[areaIndexX + this.divider * areaIndexY] || "";
    //const hashChar = this.baseArr[this.divider][areaIndexX + this.divider * areaIndexY] || "";
    //clog("1::", x.toFixed(2), widthX.toFixed(2), newWidthX.toFixed(2), areaIndexX.toFixed(2), hash, hashChar, stage);
    return this._getHashFromXY_INTERNAL(x - areaIndexX * newWidthX, y - areaIndexY * newWidthY, newWidthX, newWidthY, hash + hashChar, stage + 1);
  }
}

/*
_getXYFromHash_ORIGINAL = (hash, stage, xTL, yTL, widthX, widthY) => {
  if (stage >= hash.length || widthX < 0 || widthY < 0) return {x: xTL, y: yTL, width: widthX, height: widthY}; // ABORT-CRITERIA

  const hashChar = hash[stage];
  const indexInBaseString = this.baseArr.indexOf(hashChar);

  const newWidthX = widthX / this.divider;  // 99 / 3 = 33
  const newWidthY = widthY / this.divider;

  const areaIndexY = Math.floor(indexInBaseString / this.divider);
  const areaIndexX = indexInBaseString - this.divider * areaIndexY;

  const newXTopLeft = xTL + areaIndexX * newWidthX;
  const newYTopLeft = yTL + areaIndexY * newWidthY;

  //const newXBottomRight = newXTopLeft + newWidthX;
  //const newYBottomRight = newYTopLeft + newWidthY;

  clog("2:: ", stage, indexInBaseString, hashChar,);
  clog(" :: ", areaIndexX, areaIndexY, xTL, yTL, )
  clog(" :: ", newXTopLeft, newYTopLeft,  newWidthX, newWidthY, );

  return this._getXYFromHash_INTERNAL(hash, stage + 1, newXTopLeft, newYTopLeft, newWidthX, newWidthY)
}

const _getHashFromXY_ORGINAL = (x, y, widthX, widthY, divider, hash) => {
  if (!hash) hash = "";
  let error = false;

  const newWidthX = widthX / divider;  // 99 / 3 = 33
  const newWidthY = widthY / divider;

  const areaX = x / newWidthX; // 30 / 33 = 0.909 (0 to divider - 1)
  const areaY = y / newWidthY; // 99 / 33 = 3 -> invalid

  const areaIndexX = Math.floor(areaX); // 0 to divider - 1 -> 0 -> area 1 of 3 areas (0 .. 2)
  const areaIndexY = Math.floor(areaY); // 0 to divider - 1

  const newX = x - areaIndexX * newWidthX;
  const newY = y - areaIndexY * newWidthY;

  const indexInBaseString = areaIndexX + divider * areaIndexY;
  //if (indexInBaseString >= baseArr[divider].length) clog("XXXXXXXXXX:: indexInBaseString:: ", indexInBaseString);

  const hashChar = baseArr[divider][indexInBaseString] || null;

  clog("1:: ", x.toFixed(2), widthX.toFixed(2), newX.toFixed(2), newWidthX.toFixed(2), newWidthX.toFixed(2), )
  clog("2:: ", areaX.toFixed(2), areaIndexX.toFixed(2), indexInBaseString, hash, hashChar)

  if (newWidthX < 1 || newWidthY < 1 || !hashChar) error = true;

  return !error ? _getHashFromXY_ORGINAL(newX, newY, newWidthX, newWidthY, divider, hash + hashChar) : hash;
}
*/
