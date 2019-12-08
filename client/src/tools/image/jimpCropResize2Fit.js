import Jimp from 'jimp';

export default (imgbase64, newSize, croppedAreaPixels) => {
  return new Promise( (resolve, reject) => {
    Jimp.read(imgbase64) // import buffer, base64 or file // https://github.com/oliver-moran/jimp/tree/master/packages/jimp
    .then(image => { // Do stuff with the image. supported types: @jimp/jpeg @jimp/png @jimp/bmp @jimp/tiff @jimp/gif
      let newWidth = newSize || 1000, newHeight = newSize || 1000;
      if (croppedAreaPixels.width >= croppedAreaPixels.height){ newHeight = Jimp.AUTO; } else { newWidth = Jimp.AUTO; }

      image
      .crop( croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height )
      .resize(newWidth, newHeight)
      //.scaleToFit( 1000, 1000 )
      //.greyscale()
      .getBase64Async(Jimp.AUTO)
      .then(imgbase64 => {
        resolve(imgbase64);
      })
      .catch(error => {
        reject(error);
      })
    })
    .catch(error => {
      reject(error);
    })
  })
}
