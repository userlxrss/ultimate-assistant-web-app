import React from 'react';
import { NotificationProvider } from './components/NotificationSystem';
import JournalTab from '../JournalTab';

const JournalApp: React.FC = () => {
  return (
    <NotificationProvider>
      <JournalTab />
    </NotificationProvider>
  );
};

export default JournalApp;