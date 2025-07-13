#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const iconPath = path.join(__dirname, '..', 'src-tauri', 'icons', '128x128@2x.png');

try {
  // Check if the source icon exists
  if (!fs.existsSync(iconPath)) {
    console.error('❌ Source icon not found:', iconPath);
    process.exit(1);
  }

  // Check if tauri CLI is available
  try {
    execSync('tauri --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Tauri CLI not found. Please install @tauri-apps/cli');
    process.exit(1);
  }

  // Generate icons
  console.log('🎨 Generating icons...');
  execSync(`tauri icon "${iconPath}"`, { stdio: 'inherit' });
  console.log('✅ Icons generated successfully');

} catch (error) {
  console.error('❌ Icon generation failed:', error.message);
  process.exit(1); // Fail the build
}
