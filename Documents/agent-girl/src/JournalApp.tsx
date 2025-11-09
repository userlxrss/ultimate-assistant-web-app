import React from 'react';
import { NotificationProvider } from './components/NotificationSystem';
import JournalEnhanced from './components/JournalEnhanced';

const JournalApp: React.FC = () => {
  return (
    <NotificationProvider>
      <JournalEnhanced />
    </NotificationProvider>
  );
};

export default JournalApp;