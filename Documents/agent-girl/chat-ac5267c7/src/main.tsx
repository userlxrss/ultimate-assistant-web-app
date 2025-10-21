import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🚀 main.tsx is loading...');
console.log('React version:', React.version);

try {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  console.log('✅ React root created successfully');

  root.render(
    <App />
  );

  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Error rendering app:', error);
  document.getElementById('root')!.innerHTML = `
    <div style="color: red; padding: 20px;">
      <h1>❌ Render Error</h1>
      <p>${error.message}</p>
    </div>
  `;
}