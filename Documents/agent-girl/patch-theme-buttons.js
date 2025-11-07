#!/usr/bin/env node

/**
 * Patch theme buttons in CleanSettingsPage.tsx to use unified theme manager
 */

const fs = require('fs');
const path = require('path');

const settingsFilePath = path.join(__dirname, 'src/components/CleanSettingsPage.tsx');

console.log('🔧 Patching theme buttons in CleanSettingsPage.tsx...');

try {
  // Read the current file
  let content = fs.readFileSync(settingsFilePath, 'utf8');

  // Replace the handleThemeChange function
  const oldHandleThemeChange = /const handleThemeChange = \(newTheme: 'light' \| 'dark'\) => \{[\s\S]*?\};/;
  const newHandleThemeChange = `const handleThemeChange = (newTheme: 'light' | 'dark') => {
    // Use the unified theme manager
    if (typeof window !== 'undefined' && window.setTheme) {
      window.setTheme(newTheme);
      setThemeState(newTheme);
      console.log(\`🌙 Settings theme changed to \${newTheme} (unified system)\`);
    } else {
      // Fallback to direct DOM manipulation
      const htmlElement = document.documentElement;
      const bodyElement = document.body;

      if (newTheme === 'dark') {
        htmlElement.classList.add('dark');
        bodyElement.classList.add('dark');
        htmlElement.setAttribute('data-theme', 'dark');
        bodyElement.setAttribute('data-theme', 'dark');
      } else {
        htmlElement.classList.remove('dark');
        bodyElement.classList.remove('dark');
        htmlElement.setAttribute('data-theme', 'light');
        bodyElement.setAttribute('data-theme', 'light');
      }

      // Save to both keys for compatibility
      localStorage.setItem('app-theme', newTheme);
      localStorage.setItem('theme', newTheme);

      setThemeState(newTheme);
      console.log(\`🌙 Settings theme changed to \${newTheme} (fallback system)\`);
    }
  };`;

  content = content.replace(oldHandleThemeChange, newHandleThemeChange);

  // Replace light theme button onClick
  content = content.replace(
    /onClick=\(\) => \{\s*\/\/ DIRECT THEME FIX - NO MORE COMPLICATED SYSTEMS\s*document\.documentElement\.classList\.remove\('dark'\);\s*document\.body\.classList\.remove\('dark'\);\s*document\.documentElement\.setAttribute\('data-theme', 'light'\);\s*localStorage\.setItem\('theme', 'light'\);\s*console\.log\('☀️ LIGHT THEME APPLIED - DIRECT METHOD'\);\s*\}/,
    `onClick={() => handleThemeChange('light')}`
  );

  // Replace dark theme button onClick
  content = content.replace(
    /onClick=\(\) => \{\s*\/\/ DIRECT THEME FIX - NO MORE COMPLICATED SYSTEMS\s*document\.documentElement\.classList\.add\('dark'\);\s*document\.body\.classList\.add\('dark'\);\s*document\.documentElement\.setAttribute\('data-theme', 'dark'\);\s*localStorage\.setItem\('theme', 'dark'\);\s*console\.log\('🌙 DARK THEME APPLIED - DIRECT METHOD'\);\s*\}/,
    `onClick={() => handleThemeChange('dark')}`
  );

  // Write the patched file
  fs.writeFileSync(settingsFilePath, content);

  console.log('✅ Theme buttons patched successfully!');
  console.log('📝 CleanSettingsPage.tsx updated to use unified theme manager');

} catch (error) {
  console.error('❌ Error patching theme buttons:', error.message);
  process.exit(1);
}