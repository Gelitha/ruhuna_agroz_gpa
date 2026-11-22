// Comprehensive TypeScript Build & Standalone Distribution Pipeline
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting AgriGPA Build Pipeline...\n');

try {
  // 1. Typecheck & Generate Declaration Files
  console.log('1️⃣ Typechecking TypeScript files with tsc...');
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('✔ TypeScript typecheck passed successfully.\n');

  // 2. Bundle Browser UI
  console.log('2️⃣ Bundling browser distribution with esbuild...');
  execSync('npx esbuild src/ui.ts --bundle --outfile=ui.js --platform=browser --minify-whitespace', { stdio: 'inherit' });
  console.log('✔ Generated ui.js (Browser bundle).\n');

  // 3. Compile Node.js CommonJS Modules for testing & tooling
  console.log('3️⃣ Compiling CommonJS modules for Node test suite...');
  execSync('npx esbuild src/database.ts --outfile=database.js --format=cjs', { stdio: 'inherit' });
  execSync('npx esbuild src/app.ts --outfile=app.js --format=cjs', { stdio: 'inherit' });
  console.log('✔ Generated database.js and app.js.\n');

  // 4. Generate Single-File Offline index-standalone.html
  console.log('4️⃣ Generating offline index-standalone.html...');
  require('./bundle.js');
  console.log('✔ Offline standalone distribution generated.\n');

  // 5. Run Verification Tests
  console.log('5️⃣ Running Unit & Integration Tests...');
  execSync('node test.js', { stdio: 'inherit' });

  console.log('\n🎉 BUILD COMPLETE & 100% VERIFIED!');
} catch (err) {
  console.error('\n❌ Build pipeline failed:', err.message);
  process.exit(1);
}

