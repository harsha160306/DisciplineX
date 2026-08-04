const fs = require('fs');

function fix(filepath) {
  let content = fs.readFileSync(filepath, 'utf-8');
  content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
  fs.writeFileSync(filepath, content, 'utf-8');
}

fix('c:/Users/poral/OneDrive/Desktop/ARP2/ARP/Frontend/src/pages/Home.jsx');
fix('c:/Users/poral/OneDrive/Desktop/ARP2/ARP/Frontend/src/pages/History.jsx');
console.log('Fixed files');
