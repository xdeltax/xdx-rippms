//https://nodejs.org/api/buffer.html#buffer_buffer_from_buffer_alloc_and_buffer_allocunsafe

//export const createBuffer = (bufferBytes, width, height) => new ArrayBuffer(bufferBytes * width * height);
//export const createDataView = (arraybuffer) => new DataView(arraybuffer);

//export const createBufferUnsafe = (bufferBytes, width, height) => Buffer.allocUnsafe(bufferBytes * width * height); // buffer = uint8array // no fill => faster
export const createBuffer = (bufferBytes, width, height) => Buffer.alloc(bufferBytes * width * height); // buffer = uint8array // fill with zeros
export const createDataView = (buffer) => buffer;

export const isBuffer = (buffer) => Buffer.isBuffer(buffer);

export const string2buffer = (buffer, binary) => buffer.from(binary, "binary");
export const buffer2string = (buffer) => buffer.toString("binary");

//'ascii': For 7-bit ASCII data only. This encoding is fast and will strip the high bit if set.
//'utf8': Multibyte encoded Unicode characters. Many web pages and other document formats use UTF-8.
//'utf16le': 2 or 4 bytes, little-endian encoded Unicode characters. Surrogate pairs (U+10000 to U+10FFFF) are supported.
//'ucs2': Alias of 'utf16le'.
//'base64': Base64 encoding. When creating a Buffer from a string, this encoding will also correctly accept "URL and Filename Safe Alphabet" as specified in RFC 4648, Section 5.
//'latin1': A way of encoding the Buffer into a one-byte encoded string (as defined by the IANA in RFC 1345, page 63, to be the Latin-1 supplement block and C0/C1 control codes).
//'binary': Alias for 'latin1'.
//'hex': Encode each byte as two hexadecimal characters. Data truncation may occur for unsanitized input. For example:

//console.log(buf.toString('hex'));// Prints: 68656c6c6f20776f726c64
//console.log(buf.toString('base64')); // Prints: aGVsbG8gd29ybGQ=
//console.log(Buffer.from('fhqwhgads', 'ascii'));// Prints: <Buffer 66 68 71 77 68 67 61 64 73>
//console.log(Buffer.from('fhqwhgads', 'utf16le'));// Prints: <Buffer 66 00 68 00 71 00 77 00 68 00 67 00 61 00 64 00 73 00>
export const pack2uint8 = (arrayOfObjcts) => { // obj = [{value: 16, bits: 4,}, {value: 11, bits: 4,}];
  let result = "";
  arrayOfObjcts.forEach( (obj, idx, arr) => {
    result = (idx >= arr.length - 1) ? result + obj.value : result + obj.value << obj.bits;
  });
  return result;
}

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
