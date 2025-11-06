import React from 'react';
import { OAuthIntegration } from '../components/oauth/OAuthIntegration';

export const OAuthPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <OAuthIntegration />
    </div>
  );
};