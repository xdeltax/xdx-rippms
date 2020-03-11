export const createArrayBuffer = (bufferBytes, width, height) => new ArrayBuffer(bufferBytes * width * height);

export const createDataView = (arraybuffer) => new DataView(arraybuffer);


// groundlayer in 2 bytes (16 bit); restrictions: assetID: 0..63; frameID: 0..127
export const groundlayer_objectToUint16 = (obj) => {
  /*
  // 16bit-stuff:: frameID(7bit) assetID(6bit) flipX(1bit) flipY(1bit) hidden(1bit)
  const bit16 = (Number(obj.frameID || 0) << 9)   // frameID 127 -> hex 00000000 01111111 << 9 = 11111110 00000000
              + (Number(obj.assetID || 0) << 3)   // assetID  63 -> hex 00000000 00111111 << 3 = fffffff1 11111000
              + (Number(obj.flipX   || 0) << 2)   // flipX     1 -> hex 00000000 00000001 << 2 = fffffffa aaaaax00
              + (Number(obj.flipY   || 0) << 1)   // flipY     1 -> hex 00000000 00000001 << 1 = fffffffa aaaaaxy0
              + (Number(obj.hidden  || 0)     );  // hidden    1 -> hex 00000000 00000001 << 0 = fffffffa aaaaaxyh
  this.dataview.setUint16(this.bufferbytes * (tileX + tileY * this.tilemapConfig.width), bit16); // uses always big-endian
  */
  return  (Number(obj.frameID || 0) << 9)   // frameID 127 -> hex 00000000 01111111 << 9 = 11111110 00000000
        + (Number(obj.assetID || 0) << 3)   // assetID  63 -> hex 00000000 00111111 << 3 = fffffff1 11111000
        + (Number(obj.flipX   || 0) << 2)   // flipX     1 -> hex 00000000 00000001 << 2 = fffffffa aaaaax00
        + (Number(obj.flipY   || 0) << 1)   // flipY     1 -> hex 00000000 00000001 << 1 = fffffffa aaaaaxy0
        + (Number(obj.hidden  || 0)     );  // hidden    1 -> hex 00000000 00000001 << 0 = fffffffa aaaaaxyh
};

// groundlayer in 2 bytes (16 bit)
export const groundlayer_uint16ToObject = (tileX, tileY, bit16) => {
  const hidden  =  bit16 & 1;         // fffffffa aaaaaxyh & 0x00000000 00000001 -> h
  const flipY   = (bit16 >>> 1) & 1;  // 0fffffff aaaaaaxy & 0x00000000 00000001 -> y
  const flipX   = (bit16 >>> 2) & 1;  // 00ffffff faaaaaax & 0x00000000 00000001 -> x
  const assetID = (bit16 >>> 3) & 63; // 000fffff ffaaaaaa & 0x00000000 00111111 -> aaaaaa
  const frameID = (bit16 >>> 9) & 127;// 00000000 0fffffff & 0x00000000 01111111 -> fffffff
  return { // item
    // required
    assetID: assetID,
    frameID: frameID,

    // optional (or 0)
    flipX: flipX || 0,
    flipY: flipY || 0,
    hidden: hidden || 0,

    // unsupported for now
    z: 0,
    depth: 0,
    alpha: 1.0,
    tint: 0xffffff,

    // computed:: insert tileX/Y information, because its lost in a transformation from the 2d-array to an 1d-array in getRenderList / cullList
    tileX: tileX,
    tileY: tileY
  };
};


// groundlayer in 1 byte (8 bit); restrictions: assetID: 0..3; frameID: 0..63
export const groundlayer_objectToUint8 = (obj) => {
  // 8bit-stuff:: frameID (6bit) assetID(2bit)
  // frameID 63 -> hex 00111111 << 2 = 11111100
  // assetID  3 -> hex xxxxxx11
  //const bit8 = (frameID << 2) + assetID;
  //this.dataview.setUint8(tileX + tileY * this.tilemapConfig.width, bit8); // uses always big-endian
  //this.bufferview[tileX + tileY * width] = bit8; // assetID 2bit 0..3; frameID 6bit 0..63
  return (obj.frameID << 2) + obj.assetID;
};

// groundlayer in 1 byte (8 bit)
export const groundlayer_uint8ToObject = (tileX, tileY, bit8) => {
  const assetID = bit8 & 3;   // 3 === 0x11000000
  const frameID = bit8 >>> 2; // shift 2 bits -> remove aa and fill with 0

  return { // item
    // required
    assetID: assetID,
    frameID: frameID,

    // optional (or 0)
    flipX: 0,
    flipY: 0,
    hidden: 0,

    // unsupported for now
    z: 0,
    depth: 0,
    alpha: 1.0,
    tint: 0xffffff,

    // computed:: insert tileX/Y information, because its lost in a transformation from the 2d-array to an 1d-array in getRenderList / cullList
    tileX: tileX,
    tileY: tileY
  };
};
