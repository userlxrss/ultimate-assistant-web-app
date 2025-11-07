/**
 * Dark Mode Testing Script
 * Run this in the browser console to test dark mode functionality
 */

function testDarkModeFix() {
  console.log('🧪 Testing Dark Mode Fixes...\n');

  // Test 1: Check if ThemeContext is working
  console.log('1. Testing ThemeContext Integration:');
  try {
    const hasThemeContext = !!document.querySelector('[data-theme-context]') ||
                          window.useTheme !== undefined;
    console.log(`   ✓ ThemeContext available: ${hasThemeContext}`);
  } catch (error) {
    console.log(`   ❌ ThemeContext error: ${error.message}`);
  }

  // Test 2: Check localStorage functionality
  console.log('\n2. Testing localStorage:');
  const currentTheme = localStorage.getItem('theme') || localStorage.getItem('user_preferences:theme');
  console.log(`   ✓ Saved theme: ${currentTheme || 'none'}`);

  // Test 3: DOM class manipulation
  console.log('\n3. Testing DOM classes:');
  const htmlElement = document.documentElement;
  const hasDarkClass = htmlElement.classList.contains('dark');
  console.log(`   ✓ Dark class present: ${hasDarkClass}`);
  console.log(`   ✓ All classes: ${htmlElement.className}`);

  // Test 4: CSS variables
  console.log('\n4. Testing CSS variables:');
  const computedStyle = getComputedStyle(document.body);
  const bgColor = computedStyle.getPropertyValue('background-color');
  const textColor = computedStyle.getPropertyValue('color');
  console.log(`   ✓ Background color: ${bgColor}`);
  console.log(`   ✓ Text color: ${textColor}`);

  // Test 5: Tailwind dark mode detection
  console.log('\n5. Testing Tailwind dark mode:');
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  console.log(`   ✓ System prefers dark: ${isDarkMode}`);

  // Test 6: Theme toggle functionality
  console.log('\n6. Testing theme toggle:');
  const themeButton = document.querySelector('[data-theme-toggle]') ||
                      Array.from(document.querySelectorAll('button')).find(btn =>
                        btn.textContent?.includes('Dark Mode') ||
                        btn.textContent?.includes('Light Mode')
                      );

  if (themeButton) {
    console.log('   ✓ Theme toggle button found');
    console.log(`   ✓ Button text: ${themeButton.textContent}`);
  } else {
    console.log('   ❌ Theme toggle button not found');
  }

  // Test 7: Component contrast check
  console.log('\n7. Testing component contrast:');
  const cards = document.querySelectorAll('[class*="card"], [class*="bg-white"]');
  console.log(`   ✓ Cards found: ${cards.length}`);

  cards.forEach((card, index) => {
    if (index < 3) { // Check first 3 cards
      const cardBg = getComputedStyle(card).backgroundColor;
      const cardText = getComputedStyle(card).color;
      console.log(`   ✓ Card ${index + 1}: bg=${cardBg}, text=${cardText}`);
    }
  });

  console.log('\n🎉 Dark mode test complete!');

  // Manual toggle test
  console.log('\n🔄 Manual toggle test:');
  console.log('Run these commands to test toggle:');
  console.log('toggleTheme() // Test manual toggle');
  console.log('document.documentElement.classList.toggle("dark") // Test DOM toggle');

  return {
    hasDarkClass,
    savedTheme: currentTheme,
    bgColor,
    textColor,
    themeButtonFound: !!themeButton
  };
}

// Auto-run the test
testDarkModeFix();

// Make function globally available
window.testDarkModeFix = testDarkModeFix;