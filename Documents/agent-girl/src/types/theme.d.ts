// TypeScript declarations for ThemeManager
declare global {
  interface Window {
    themeManager?: {
      theme: 'light' | 'dark';
      setTheme: (theme: 'light' | 'dark') => void;
      toggleTheme: () => void;
      applyTheme: (theme: 'light' | 'dark') => void;
      updateToggleButtons: () => void;
    };
  }
}

export {};