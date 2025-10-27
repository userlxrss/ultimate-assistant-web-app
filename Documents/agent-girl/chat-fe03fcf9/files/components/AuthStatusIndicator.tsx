import React from 'react';

const AuthStatusIndicator: React.FC = ({ onGmailDisconnect, onMotionDisconnect, onGoogleDisconnect }: any) => {
  return (
    <div className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200">
      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </div>
  );
};

export { AuthStatusIndicator };