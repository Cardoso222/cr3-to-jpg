const exiftool = require("exiftool-vendored").exiftool
const fs = require('fs');

const folder = './rawImages/';
const dir = './output/';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

fs.readdir(folder, (err, files) => {
  return Promise.all(files.map(async file => {
    if (file.split('.')[1] == 'CR3') {
      await exiftool.extractJpgFromRaw(`${folder}${file}`, `${dir}${file.split('.')[0]}.jpg`);
    }
  }))
  .finally(() => exiftool.end())
  .catch((err) => {
    throw err;
  })
  .then(() => {
    console.log('All files converted!')
  });
});

