import React from 'react';
import { RealGmailClient } from './components/email/RealGmailClient';

type EmailView = 'inbox' | 'sent' | 'drafts' | 'starred' | 'important' | 'compose' | 'view';

const EmailApp: React.FC = () => {
  return <RealGmailClient />;
};

export default EmailApp;