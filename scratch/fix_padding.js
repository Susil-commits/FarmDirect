const fs = require('fs');
const path = require('path');
const pagesDir = path.join('F_1', 'src', 'pages');
const files = [
  'Privacy.jsx', 'Terms.jsx', 'Refund.jsx', 'Pricing.jsx', 
  'Support.jsx', 'HowItWorks.jsx', 'Contact.jsx', 'About.jsx', 
  'JoinAsFarmer.jsx', 'StartShopping.jsx', 'ShoppingCart.jsx', 'Wishlist.jsx'
];
let modifiedCount = 0;
files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Some pages have py-16, py-12, py-20. We replace py-XX with pt-32 pb-XX
    const regex = /className=\"[^\"]*?py-(\d+)[^\"]*?\"/;
    if (regex.test(content)) {
      content = content.replace(regex, (match, num) => {
        // If it already has pt-something, don't replace
        if (match.includes('pt-')) return match;
        return match.replace(`py-${num}`, `pt-32 pb-${num}`);
      });
      
      // Also look for fixed pt-something that might be too small, e.g. pt-12
      // but let's just focus on py- first.
      
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedCount++;
      console.log('Fixed padding on ' + file);
    } else {
        // Fallback for pt-16
        const regexPt = /className=\"[^\"]*?pt-(\d+)[^\"]*?\"/;
        if (regexPt.test(content)) {
          content = content.replace(regexPt, (match, num) => {
             if (parseInt(num) < 24) {
                 return match.replace(`pt-${num}`, `pt-32`);
             }
             return match;
          });
          fs.writeFileSync(filePath, content, 'utf8');
          modifiedCount++;
          console.log('Fixed padding on ' + file);
        }
    }
  }
});
console.log('Total fixed: ' + modifiedCount);
