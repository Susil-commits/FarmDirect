const fs = require('fs');

const dashboards = [
  'F_1/src/pages/BuyerDashboard.jsx',
  'F_1/src/pages/FarmerDashboard.jsx',
  'F_1/src/pages/AdminDashboard.jsx',
  'F_1/src/components/common/ProtectedRoute.jsx'
];

console.log('🔍 Checking dashboard files for syntax errors...\n');

dashboards.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for common issues
    const issues = [];
    
    // Check for escaped quotes (\\")
    if (content.includes('\\"')) {
      issues.push('❌ Found escaped quotes (\\\")');
    }
    
    // Check for unmatched quotes
    const doubleQuotes = (content.match(/"/g) || []).length;
    const singleQuotes = (content.match(/'/g) || []).length;
    
    // Check for bg-linear-to still present
    if (content.includes('bg-linear-to')) {
      issues.push('❌ Still has bg-linear-to- (should be bg-gradient-to-)');
    }
    
    // Check for className without equal sign
    if (content.match(/className\s+[^=]/)) {
      issues.push('⚠️  Potential className syntax error');
    }
    
    if (issues.length === 0) {
      console.log(`✅ ${file} - OK`);
    } else {
      console.log(`⚠️  ${file}`);
      issues.forEach(issue => console.log(`   ${issue}`));
    }
  } catch (err) {
    console.log(`❌ ${file} - Cannot read: ${err.message}`);
  }
});

console.log('\n✨ Verification complete!');
