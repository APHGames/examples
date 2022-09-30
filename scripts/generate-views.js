const fs = require('fs');
const utils = require('./utils');
const path = require('path');

const examplesInfo = JSON.parse(fs.readFileSync('examples-info.json', "utf8"));
const exampleTemplate = fs.readFileSync('scripts/example-template.html', "utf8");
let indexTemplate = fs.readFileSync('scripts/index-template.html', "utf8");


if(!fs.existsSync('view')) {
    fs.mkdirSync('view');
}

utils.deleteFolderRecursive('view', true);

const allGroups = [...new Set(examplesInfo.map(ex => ex.group))];

let indexContent = '';

for(let group of allGroups) {
    const groupExamples = examplesInfo.filter(ex => ex.group === group);

    indexContent += `<h2>${group}</h2>`;
    indexContent += "<div class='list'>";

    for(let example of groupExamples) {
        indexContent += `<a href='./${example.file_name}.html'>${example.name}</a>`;
        const exampleContent = exampleTemplate.replace('#TITLE', example.name).replace('#OBJECT', example.object);
        fs.writeFileSync(path.resolve('view', `${example.file_name}.html`), exampleContent);
        console.log(example.file_name);
    }

    indexContent += "</div>";
}

indexTemplate = indexTemplate.replace('#CONTENT', indexContent);
fs.writeFileSync(path.resolve('view', 'index.html'), indexTemplate);
console.log('OK');