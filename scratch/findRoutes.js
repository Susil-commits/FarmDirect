const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../F_1/src');
const appJsxPath = path.join(srcPath, 'App.jsx');

const routesInApp = new Set();
const navPaths = new Set();

// 1. Get routes in App.jsx
const appContent = fs.readFileSync(appJsxPath, 'utf8');
const caseRegex = /case\s+['"]([^'"]+)['"]:/g;
let match;
while ((match = caseRegex.exec(appContent)) !== null) {
  routesInApp.add(match[1]);
}

// pattern matched routes in App.jsx
const startsWithRegex = /routePath\.startsWith\(['"]([^'"]+)['"]\)/g;
while ((match = startsWithRegex.exec(appContent)) !== null) {
  routesInApp.add(match[1]);
}

// 2. Find all navigate('...') or handleNavigation('...')
function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const navRegex = /(?:navigate|handleNavigation)\(['"]([^'"]+)['"]/g;
      let m;
      while ((m = navRegex.exec(content)) !== null) {
        navPaths.add(m[1]);
      }
    }
  });
}

walk(srcPath);

const missingRoutes = Array.from(navPaths).filter(nav => {
  // exact match
  if (routesInApp.has(nav.split('?')[0])) return false;
  
  // pattern match
  for (const route of routesInApp) {
    if (route.endsWith('/') && nav.startsWith(route)) {
      return false;
    }
  }

  // external or special routes
  if (nav.startsWith('http') || nav === '-1') return false;

  return true;
});

console.log('Missing routes in App.jsx:');
missingRoutes.forEach(r => console.log(r));
