import React from 'react';
import MainApp from './MainApp';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <MainApp />
      </div>
    </ErrorBoundary>
  );
}

export default App;
