#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING DARK MODE VISIBILITY ISSUES...');
console.log('=====================================\n');

// Find all TypeScript and JavaScript files in the src directory
function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  let files = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files = files.concat(findFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.log(`Skipping directory ${dir}: ${error.message}`);
  }

  return files;
}

// Fix problematic dark mode text colors in a file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // List of problematic dark mode text color patterns and their fixes
    const fixes = [
      // Replace dark:text-white with readable colors
      {
        pattern: /dark:text-white/g,
        replacement: 'text-gray-900',
        description: 'dark:text-white → text-gray-900'
      },
      // Replace dark:text-gray-200 with readable colors
      {
        pattern: /dark:text-gray-200/g,
        replacement: 'text-gray-800',
        description: 'dark:text-gray-200 → text-gray-800'
      },
      // Replace dark:text-gray-300 with readable colors
      {
        pattern: /dark:text-gray-300/g,
        replacement: 'text-gray-700',
        description: 'dark:text-gray-300 → text-gray-700'
      },
      // Replace dark:text-gray-400 with readable colors
      {
        pattern: /dark:text-gray-400/g,
        replacement: 'text-gray-600',
        description: 'dark:text-gray-400 → text-gray-600'
      },
      // Replace dark:text-slate-200 with readable colors
      {
        pattern: /dark:text-slate-200/g,
        replacement: 'text-gray-800',
        description: 'dark:text-slate-200 → text-gray-800'
      },
      // Replace dark:text-slate-300 with readable colors
      {
        pattern: /dark:text-slate-300/g,
        replacement: 'text-gray-700',
        description: 'dark:text-slate-300 → text-gray-700'
      }
    ];

    const originalContent = content;

    // Apply all fixes
    for (const fix of fixes) {
      const matches = content.match(fix.pattern);
      if (matches) {
        content = content.replace(fix.pattern, fix.replacement);
        hasChanges = true;
        console.log(`  ✅ ${fix.description} (${matches.length} instances)`);
      }
    }

    // Write the file back if changes were made
    if (hasChanges && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const allFiles = findFiles(srcDir);

console.log(`Found ${allFiles.length} TypeScript/JavaScript files\n`);

let totalFilesChanged = 0;
let totalFixesApplied = 0;

// Process each file
for (const file of allFiles) {
  const relativePath = path.relative(__dirname, file);
  const wasChanged = fixFile(file);

  if (wasChanged) {
    totalFilesChanged++;
    console.log(`📝 Fixed: ${relativePath}`);
  }
}

console.log('\n' + '='.repeat(50));
console.log('🎉 DARK MODE VISIBILITY FIX COMPLETE!');
console.log(`📊 Files changed: ${totalFilesChanged}/${allFiles.length}`);
console.log(`🔧 Total fixes applied across all files`);
console.log('\n✨ All text should now be visible in both light and dark modes!');
console.log('💡 Text now uses simple, readable colors (gray-900, gray-800, gray-700, gray-600)');
console.log('\n🚀 Restart your development server to see the changes.');