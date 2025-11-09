import React from 'react';
import { NotificationProvider } from './components/NotificationSystem';
import JournalSimple from './components/JournalSimple';

const JournalApp: React.FC = () => {
  return (
    <NotificationProvider>
      <JournalSimple />
    </NotificationProvider>
  );
};

export default JournalApp;