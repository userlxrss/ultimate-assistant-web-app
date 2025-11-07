// This is a replacement for the theme buttons section in CleanSettingsPage.tsx

// Replace the handleThemeChange function (around line 762):
const handleThemeChange = (newTheme: 'light' | 'dark') => {
  // Use the unified theme manager
  if (typeof window !== 'undefined' && window.setTheme) {
    window.setTheme(newTheme);
    setThemeState(newTheme);
    console.log(`🌙 Settings theme changed to ${newTheme} (unified system)`);
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
    console.log(`🌙 Settings theme changed to ${newTheme} (fallback system)`);
  }
};

// Replace the theme buttons section (around line 1143-1192):
<div className="theme-selector grid grid-cols-2 gap-3">
  <button
    className={`theme-option p-0 bg-transparent border-2 ${
      theme === 'light'
        ? 'border-blue-500 shadow-lg shadow-blue-200'
        : 'border-gray-300 dark:border-gray-600'
    } rounded-xl cursor-pointer transition-all duration-200 overflow-hidden hover:scale-105 hover:-translate-y-1`}
    data-theme-option="light"
    onClick={() => handleThemeChange('light')}
  >
    <div className="theme-preview light w-full h-20 p-3 flex flex-col gap-2">
      <div className="preview-bar h-2 bg-white rounded shadow-sm w-1/2"></div>
      <div className="preview-content flex-1 bg-gray-100 rounded"></div>
    </div>
    <div className="theme-label py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
      ☀️ Light
    </div>
  </button>
  <button
    className={`theme-option p-0 bg-transparent border-2 ${
      theme === 'dark'
        ? 'border-blue-500 shadow-lg shadow-blue-200'
        : 'border-gray-300 dark:border-gray-600'
    } rounded-xl cursor-pointer transition-all duration-200 overflow-hidden hover:scale-105 hover:-translate-y-1`}
    data-theme-option="dark"
    onClick={() => handleThemeChange('dark')}
  >
    <div className="theme-preview dark w-full h-20 p-3 flex flex-col gap-2">
      <div className="preview-bar h-2 bg-gray-700 rounded shadow-sm w-1/2"></div>
      <div className="preview-content flex-1 bg-gray-800 rounded"></div>
    </div>
    <div className="theme-label py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
      🌙 Dark
    </div>
  </button>
</div>