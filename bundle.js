// Standalone Single-File HTML Generator
// Bundles index.html, styles.css, and ui.js into a single offline index-standalone.html file

const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlPath = path.join(baseDir, 'index.html');
const cssPath = path.join(baseDir, 'styles.css');
const uiPath = path.join(baseDir, 'ui.js');
const outputPath = path.join(baseDir, 'index-standalone.html');

console.log('Bundling single-file standalone HTML for University of Ruhuna Agri GPA Calculator...');

let html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const ui = fs.readFileSync(uiPath, 'utf8');

// Replace CSS link with inline <style>
html = html.replace(
  '<link rel="stylesheet" href="styles.css">',
  `<style>\n${css}\n</style>`
);

// Replace script tag with inline <script>
html = html.replace(
  '<script src="ui.js"></script>',
  `<script>\n${ui}\n</script>`
);

fs.writeFileSync(outputPath, html, 'utf8');
console.log(`✔ Successfully generated standalone single-file: ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
