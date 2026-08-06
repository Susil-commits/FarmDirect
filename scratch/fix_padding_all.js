const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const pagesDir = path.join('F_1', 'src', 'pages');
let modifiedCount = 0;

walkDir(pagesDir, function(filePath) {
  if (filePath.endsWith('.jsx') && !filePath.includes('Home.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // We look for top-level divs like <div className="... min-h-screen ...">
    // This is typically the outermost wrapper.
    // If it has py-\d+ or pt-\d+, we want to ensure pt is at least 28 (112px) to clear the navbar safely on mobile/desktop.

    // Regex to find className that includes min-h-screen and a py- or pt- class
    const regex = /className=\"([^\"]*?min-h-screen[^\"]*?)\"/g;
    
    content = content.replace(regex, (match, classNames) => {
      let classes = classNames.split(' ').filter(Boolean);
      let newClasses = [];
      let hasPaddingTop = false;
      let hasPaddingBottom = false;
      let paddingBottomValue = '12';

      for (let cls of classes) {
        if (cls.startsWith('py-')) {
          let val = cls.split('-')[1];
          paddingBottomValue = val;
          // Skip pushing py- since we will split it into pt and pb
        } else if (cls.startsWith('pt-')) {
          hasPaddingTop = true;
          let val = parseInt(cls.split('-')[1]);
          if (val < 24) {
            newClasses.push('pt-28');
          } else {
            newClasses.push(cls);
          }
        } else if (cls.startsWith('pb-')) {
          hasPaddingBottom = true;
          newClasses.push(cls);
        } else {
          newClasses.push(cls);
        }
      }

      // If it had py-, we need to explicitly add pt- and pb- if not already present
      if (!hasPaddingTop && paddingBottomValue) {
        newClasses.push('pt-28');
        if (!hasPaddingBottom) {
          newClasses.push(`pb-${paddingBottomValue}`);
        }
      } else if (!hasPaddingTop) {
         // Default if it had no padding at all on min-h-screen, to be safe.
         // Actually if it had no padding, let's just add pt-28.
         newClasses.push('pt-28');
      }

      // Clean up duplicates if any
      newClasses = [...new Set(newClasses)];
      return `className="${newClasses.join(' ')}"`;
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedCount++;
      console.log('Fixed layout padding on ' + filePath);
    }
  }
});
console.log('Total fixed: ' + modifiedCount);
