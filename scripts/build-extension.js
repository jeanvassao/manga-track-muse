const fs = require('fs');
const path = require('path');

// Create necessary directories
const dirs = ['dist/icons', 'dist/assets'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Copy extension files to dist
const extensionFiles = [
  'public/manifest.json',
  'public/background.js',
  'public/content.js',
  'public/popup.html',
  'public/popup.js',
  'public/options.html',
  'public/options.js'
];

extensionFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const fileName = path.basename(file);
    fs.copyFileSync(file, `dist/${fileName}`);
    console.log(`Copied ${file} to dist/${fileName}`);
  }
});

// Copy icons
if (fs.existsSync('public/icons')) {
  const iconFiles = fs.readdirSync('public/icons');
  iconFiles.forEach(file => {
    fs.copyFileSync(`public/icons/${file}`, `dist/icons/${file}`);
    console.log(`Copied icon: ${file}`);
  });
}

// Create placeholder icons if the generated ones failed
const iconSizes = [16, 48, 128];
iconSizes.forEach(size => {
  const iconPath = `dist/icons/icon${size}.png`;
  if (!fs.existsSync(iconPath)) {
    // Copy base icon as placeholder
    if (fs.existsSync('dist/icons/icon-base.png')) {
      fs.copyFileSync('dist/icons/icon-base.png', iconPath);
      console.log(`Created placeholder icon${size}.png`);
    }
  }
});

console.log('Extension build completed! Files are ready in the dist folder.');
console.log('\nTo install the extension:');
console.log('1. Open Chrome and go to chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked" and select the dist folder');