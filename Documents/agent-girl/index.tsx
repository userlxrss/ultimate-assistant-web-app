import React from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardApp } from './Dashboard';

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