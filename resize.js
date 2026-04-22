const Jimp = require('jimp');
const fs = require('fs');

Jimp.read('favicon.png')
  .then(image => {
    return image
      .resize(64, 64) // resize
      .quality(80)
      .writeAsync('favicon.png'); // save
  })
  .then(() => {
    const stats = fs.statSync('favicon.png');
    console.log('Favicon resized successfully. New size: ' + stats.size + ' bytes');
  })
  .catch(err => {
    console.error(err);
  });
