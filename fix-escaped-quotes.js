const fs = require('fs');
const path = require('path');

const srcDir = 'F_1/src';

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixedCount += walkDir(filePath);
    } else if (file.endsWith('.jsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Replace all escaped quotes in className attributes
      content = content.replace(/className=\\\"/g, 'className="');
      content = content.replace(/\\\"/g, '"');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Fixed: ${filePath}`);
        fixedCount++;
      }
    }
  });
  
  return fixedCount;
}

console.log('🔧 Removing all escaped quotes...\n');
const fixed = walkDir(srcDir);
console.log(`\n✅ Fixed ${fixed} files!`);
