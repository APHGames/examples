const utils = require("./utils");
const fs = require('fs');
const path = require('path');

// a strange behavior from parcel occurs in the example.js being renamed to the first
// html file that uses it - hence this little fix
const jsFiles = utils.searchFiles(['build'], ['.js']).filter(f => f.endsWith('.js')); // filter out jsons
if(jsFiles.length > 1) {
    throw new Error('Expected 1 javascript file. Found ' + jsFiles.length + ' instead!');    
}

const htmlFiles = utils.searchFiles(['build'], ['.html']);
const fileToRename = jsFiles[0]; 
const fileName = fileToRename.split(path.sep)[fileToRename.split(path.sep).length - 1];

// rename the js file itself
fs.renameSync(fileToRename, 'build/examples.js');

// rename its links from all html files
for(let file of htmlFiles) {
    let content = utils.fileToStr(file);
    const replaced = content.split(fileName).join('examples.js');
    utils.strToFile(file, replaced);
}