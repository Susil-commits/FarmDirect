const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('dist')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.ts')) {
      let originalContent = fs.readFileSync(file, 'utf8');
      
      // Remove console.logs (very basic regex, catches most lines)
      let newContent = originalContent.replace(/^[ \t]*console\.log\(.*\);?[ \t]*\r?\n/gm, '');
      
      if (originalContent !== newContent) {
        fs.writeFileSync(file, newContent);
        results.push(file);
      }
    }
  });
  return results;
}

const frontendUpdated = walk('F_1/src');
console.log('Cleaned console.logs from ' + frontendUpdated.length + ' files in frontend.');

const backendUpdated = walk('backend-ts/src');
console.log('Cleaned console.logs from ' + backendUpdated.length + ' files in backend.');
