const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      files = files.concat(walk(p));
    } else if (p.endsWith('.jsx') || p.endsWith('.js')) {
      files.push(p);
    }
  });
  return files;
}

const files = walk(path.join(__dirname, '../F_1/src'));
let missingAlt = false;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match <img ...>
  const imgRegex = /<img\s([^>]+)>/g;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const props = match[1];
    if (!props.includes('alt=')) {
      console.log(`Missing alt in ${file}: ${match[0]}`);
      missingAlt = true;
    }
  }
});

if (!missingAlt) {
  console.log('All img tags have alt attributes.');
}
