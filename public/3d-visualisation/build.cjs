const fs = require('fs');
const path = require('path');
const dir = __dirname;
const template = fs.readFileSync(path.join(dir, 'template.html'), 'utf8');
const style = fs.readFileSync(path.join(dir, 'style.css'), 'utf8');
const app = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');
const output = template.replace('/* STYLE */', () => style).replace('/* SCRIPT */', () => app);
fs.writeFileSync(path.join(dir, 'index.html'), output, { encoding: 'utf8' });
console.log('Successfully built index.html (' + output.length + ' bytes)');
