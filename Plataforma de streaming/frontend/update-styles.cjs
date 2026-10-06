const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  { search: /#7000ff/g, replace: '#023BE6' },
  { search: /#00ffcc/g, replace: '#00A3FF' },
  { search: /#e000ff/g, replace: '#023BE6' },
  { search: /Bebas Neue/g, replace: 'Inter' },
  { search: /Outfit/g, replace: 'Plus Jakarta Sans' },
  { search: /#011C6B/g, replace: '#011C6B' } // Just a dummy
];

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.css')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const files = walkSync(directoryPath);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  if (file.endsWith('index.css')) {
    // Update Google Fonts import
    content = content.replace(
      /@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Bebas\+Neue&family=Outfit:wght@300;400;500;600;700;800;900&display=swap'\);/,
      "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');"
    );
    
    // Update CSS variables
    content = content.replace(/--bg-void: #070414;/, '--bg-void: #011142;');
    content = content.replace(/--bg-deep: #0e0824;/, '--bg-deep: #041A6B;');
    content = content.replace(/--bg-card: #150d36;/, '--bg-card: #011C6B;');
    content = content.replace(/--bg-elevated: #1e134a;/, '--bg-elevated: #0F2C8C;');
    content = content.replace(/--bg-glass: rgba\(21, 13, 54, 0\.7\);/, '--bg-glass: rgba(1, 28, 107, 0.7);');
    
    content = content.replace(/--accent: #7000ff;/, '--accent: #023BE6;');
    content = content.replace(/--accent-light: #9333ea;/, '--accent-light: #2258F2;');
    content = content.replace(/--accent-hot: #c084fc;/, '--accent-hot: #00A3FF;');
    content = content.replace(/--accent-glow: rgba\(112, 0, 255, 0\.45\);/, '--accent-glow: rgba(2, 59, 230, 0.45);');
    content = content.replace(/--accent-dim: rgba\(112, 0, 255, 0\.18\);/, '--accent-dim: rgba(2, 59, 230, 0.18);');
    content = content.replace(/--accent-gradient: linear-gradient\(135deg, #7000ff 0%, #a855f7 50%, #e000ff 100%\);/, '--accent-gradient: linear-gradient(135deg, #023BE6 0%, #00A3FF 100%);');
    content = content.replace(/--cyan-neon: #00f0ff;/, '--cyan-neon: #00A3FF;');
    content = content.replace(/--magenta-neon: #e000ff;/, '--magenta-neon: #023BE6;');
    
    content = content.replace(/--border-hover: rgba\(168, 85, 247, 0\.4\);/, '--border-hover: rgba(34, 88, 242, 0.4);');
    content = content.replace(/--border-active: rgba\(112, 0, 255, 0\.8\);/, '--border-active: rgba(2, 59, 230, 0.8);');
    
    content = content.replace(/--shadow-glow: 0 0 45px rgba\(112, 0, 255, 0\.35\);/, '--shadow-glow: 0 0 45px rgba(2, 59, 230, 0.35);');
    content = content.replace(/--shadow-cyan: 0 0 35px rgba\(0, 240, 255, 0\.3\);/, '--shadow-cyan: 0 0 35px rgba(0, 163, 255, 0.3);');
    
    // Update Border Radiuses for softer look
    content = content.replace(/--radius-sm: 8px;/, '--radius-sm: 6px;');
    content = content.replace(/--radius-md: 14px;/, '--radius-md: 10px;');
    content = content.replace(/--radius-lg: 20px;/, '--radius-lg: 14px;');
    content = content.replace(/--radius-xl: 28px;/, '--radius-xl: 20px;');

    // Global replaces for specific colors/fonts inside index.css body
    content = content.replace(/rgba\(112, 0, 255/g, 'rgba(2, 59, 230'); // 112, 0, 255 is old #7000ff
    content = content.replace(/rgba\(224, 0, 255/g, 'rgba(2, 59, 230'); // old #e000ff
    content = content.replace(/rgba\(0, 240, 255/g, 'rgba(0, 163, 255'); // old cyan-neon
  }

  replacements.forEach(r => {
    content = content.replace(r.search, r.replace);
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
console.log('Update complete.');
