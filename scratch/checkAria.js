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

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match <button ...>
  const btnRegex = /<[bB]utton([^>]+)>/g;
  let match;
  while ((match = btnRegex.exec(content)) !== null) {
    const props = match[1];
    if (!props.includes('aria-label') && !props.includes('title') && props.includes('onClick')) {
      // Just flag buttons that might be icon-only (hard to tell statically, but we can print them)
      // Actually we'll just check if it's the mobile menu button
    }
  }
});
