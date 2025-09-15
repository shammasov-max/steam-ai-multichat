import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx'];
const excludePatterns = [
  '.test.', '.spec.', 'jest.config', 'vitest.config', '.setup.',
  'eslint.config', 'tailwind.config', 'postcss.config', 'vite.config'
];

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

function shouldExclude(filePath) {
  const fileName = path.basename(filePath);
  
  // Check if it's in a test directory
  if (filePath.includes(path.sep + 'test' + path.sep) || 
      filePath.includes(path.sep + 'tests' + path.sep)) {
    return true;
  }
  
  // Check exclude patterns
  for (const pattern of excludePatterns) {
    if (fileName.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

function walkDir(dir, baseDir = dir) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files = files.concat(walkDir(fullPath, baseDir));
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (sourceExtensions.includes(ext) && !shouldExclude(fullPath)) {
          const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          const lines = countLines(fullPath);
          if (lines > 0) {
            files.push({ path: relativePath, lines });
          }
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
  
  return files;
}

console.log('\n=== Effect-Redux Project Structure and LOC Analysis ===');
console.log('Excluding: test files, configuration files, and generated files\n');

const packages = [
  { name: 'db', path: 'packages/db/src' },
  { name: 'dialogs', path: 'packages/dialogs/src' },
  { name: 'frontend', path: 'packages/frontend/src' },
  { name: 'isomorphic', path: 'packages/isomorphic/src' },
  { name: 'server', path: 'packages/server/src' },
  { name: 'steam-api', path: 'packages/steam-api/src' }
];

let grandTotal = 0;

for (const pkg of packages) {
  const packagePath = path.join(__dirname, pkg.path);
  console.log(`\n📦 Package: ${pkg.name}`);
  console.log(`   Path: ${pkg.path}`);
  console.log('   ' + '-'.repeat(50));
  
  const files = walkDir(packagePath);
  let packageTotal = 0;
  
  // Sort files by path
  files.sort((a, b) => a.path.localeCompare(b.path));
  
  for (const file of files) {
    console.log(`   ${file.path.padEnd(50)} ${file.lines.toString().padStart(6)} lines`);
    packageTotal += file.lines;
  }
  
  if (files.length === 0) {
    console.log('   [No source files found or directory not accessible]');
  }
  
  console.log('   ' + '-'.repeat(50));
  console.log(`   Package Total: ${packageTotal.toString().padStart(6)} lines`);
  
  grandTotal += packageTotal;
}

// Root level files
console.log('\n📦 Root Level Files');
console.log('   ' + '-'.repeat(50));

let rootTotal = 0;
const rootFiles = ['interactive-prompt.ts', 'prompt-example.ts'];

for (const fileName of rootFiles) {
  const filePath = path.join(__dirname, fileName);
  if (fs.existsSync(filePath)) {
    const lines = countLines(filePath);
    if (lines > 0) {
      console.log(`   ${fileName.padEnd(50)} ${lines.toString().padStart(6)} lines`);
      rootTotal += lines;
    }
  }
}

// Scripts folder
const scriptsPath = path.join(__dirname, 'scripts');
if (fs.existsSync(scriptsPath)) {
  const scriptFiles = fs.readdirSync(scriptsPath)
    .filter(f => f.endsWith('.ts'))
    .map(f => ({ name: `scripts/${f}`, lines: countLines(path.join(scriptsPath, f)) }));
  
  for (const file of scriptFiles) {
    if (file.lines > 0) {
      console.log(`   ${file.name.padEnd(50)} ${file.lines.toString().padStart(6)} lines`);
      rootTotal += file.lines;
    }
  }
}

console.log('   ' + '-'.repeat(50));
console.log(`   Root Total: ${rootTotal.toString().padStart(6)} lines`);

grandTotal += rootTotal;

// Summary
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));

console.log('\nProject Type: TypeScript/JavaScript Monorepo (Effect-Redux)');
console.log('Package Manager: Yarn Berry (v4.9.2)');
console.log('Build System: TypeScript Compiler (tsc)');
console.log('Test Runner: Vitest');

console.log('\nPackage Structure:');
console.log('  - db: Database layer with MongoDB integration');
console.log('  - dialogs: Dialog management services');
console.log('  - frontend: React/TypeScript frontend application');
console.log('  - isomorphic: Shared code between client and server');
console.log('  - server: Backend server application');
console.log('  - steam-api: Steam API integration');

console.log('\n' + '='.repeat(60));
console.log(`TOTAL SOURCE CODE LINES (excluding tests): ${grandTotal.toString().padStart(10)} lines`);
console.log('='.repeat(60));
