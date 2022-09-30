const utils = require('./utils');
const fs = require('fs');
const path = require("path");
// for parcelv1, we can't disable file hashing, so we need to do it after each build manually
const file = utils.searchFiles('build', 'examples.')[0];

const hashedFileName = path.basename(file);
const fileName = 'examples.js';

fs.renameSync(path.resolve('build', hashedFileName), path.resolve('build', fileName));

const htmlFiles = utils.searchFiles(['build'], '.html');

for(let file of htmlFiles) {
    let content = utils.fileToStr(file);
    let replaced = content.replace(hashedFileName, fileName);
    utils.strToFile(file, replaced);
}