const fs = require('fs');
const path = require('path');

const srcDir = 'F_1/src';

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.jsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Replace all bg-linear-to- with bg-gradient-to-
      content = content.replace(/bg-linear-to-/g, 'bg-gradient-to-');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Fixed: ${filePath}`);
      }
    }
  });
}

console.log('🔧 Fixing Tailwind gradient syntax...\n');
walkDir(srcDir);
console.log('\n✅ Done! All bg-linear-to-* replaced with bg-gradient-to-*');
