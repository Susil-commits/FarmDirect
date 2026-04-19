const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting comprehensive error cleanup...\n');

// Step 1: Fix all bg-linear-to -> bg-gradient-to globally
console.log('📝 Step 1: Fixing invalid Tailwind gradient syntax...');
try {
  const result = execSync(
    'grep -r "bg-linear-to" F_1/src --include="*.jsx" -l | xargs -I {} sed -i "s/bg-linear-to/bg-gradient-to/g" {}',
    { shell: '/bin/bash', encoding: 'utf8' }
  );
  console.log('✅ Tailwind gradients fixed');
} catch (e) {
  // Try Windows approach
  try {
    execSync(
      'Get-ChildItem -Path F_1/src -Recurse -Include "*.jsx" | ForEach-Object { (Get-Content $_.FullName) -replace "bg-linear-to", "bg-gradient-to" | Set-Content $_.FullName }',
      { shell: 'powershell', encoding: 'utf8' }
    );
    console.log('✅ Tailwind gradients fixed');
  } catch (err) {
    console.log('⚠️  Using Node.js fallback for gradient fixes');
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.jsx')) {
          let content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('bg-linear-to')) {
            content = content.replace(/bg-linear-to/g, 'bg-gradient-to');
            fs.writeFileSync(filePath, content, 'utf8');
          }
        }
      });
    };
    walkDir('F_1/src');
    console.log('✅ Tailwind gradients fixed (Node.js)');
  }
}

// Step 2: Run ESLint --fix to auto-fix what it can
console.log('\n📝 Step 2: Running ESLint --fix automatically...');
try {
  execSync('cd F_1 && npx eslint --fix src/', { stdio: 'ignore' });
  console.log('✅ ESLint auto-fixes applied');
} catch (e) {
  console.log('✅ ESLint ran (some issues remain)');
}

// Step 3: Check build
console.log('\n📝 Step 3: Verifying build...');
try {
  const buildResult = execSync('cd F_1 && npm run build 2>&1 | tail -5', { encoding: 'utf8' });
  if (buildResult.includes('built in')) {
    console.log('✅ Build SUCCESSFUL');
  }
} catch (e) {
  console.log('❌ Build check failed');
}

// Step 4: Count remaining errors
console.log('\n📝 Step 4: Counting remaining ESLint problems...');
try {
  const lintResult = execSync('cd F_1 && npm run lint 2>&1 | tail -1', { encoding: 'utf8', shell: '/bin/bash' });
  console.log('📊 ' + lintResult.trim());
} catch (e) {
  const match = e.toString().match(/(\d+)\s+problems/);
  if (match) {
    console.log(`📊 ${match[1]} remaining problems`);
  }
}

console.log('\n✨ Cleanup complete!');
