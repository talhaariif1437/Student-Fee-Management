// Build script to prepare the www folder for Capacitor Android App packaging
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WWW_DIR = path.join(__dirname, 'www');

// Clean and recreate www directory
if (fs.existsSync(WWW_DIR)) {
  fs.rmSync(WWW_DIR, { recursive: true, force: true });
}
fs.mkdirSync(WWW_DIR, { recursive: true });

// Copy individual files
const filesToCopy = ['index.html', 'manifest.json', 'sw.js'];
filesToCopy.forEach((file) => {
  const src = path.join(__dirname, file);
  const dest = path.join(WWW_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} -> www/${file}`);
  }
});

// Copy directories
const dirsToCopy = ['css', 'js', 'public'];
dirsToCopy.forEach((dir) => {
  const src = path.join(__dirname, dir);
  const dest = path.join(WWW_DIR, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`Copied ${dir}/ -> www/${dir}/`);
  }
});

console.log('✅ www directory is ready for Capacitor Android sync!');
