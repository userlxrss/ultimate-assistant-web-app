import React from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardApp } from './Dashboard';

// Export theme components for other modules
export { ThemeProvider, useTheme } from './ThemeContext';
export { ThemeToggle } from './ThemeToggle';
export { UserProvider, useUser } from './UserContext';

// Main Dashboard Application
const App: React.FC = () => {
  return <DashboardApp />;
};

// Initialize the dashboard app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root element not found');
}

export default App;