import React from 'react';
import { Users } from 'lucide-react';
import ModuleUnavailable from '../common/ModuleUnavailable';

const ContactsApp: React.FC = () => {
  return (
    <ModuleUnavailable
      icon={<Users className="w-8 h-8" />}
      title="Contacts Unavailable"
      message="The Contacts module is currently unavailable due to technical issues. We're working to resolve this problem."
      description="This feature has been temporarily disabled while we troubleshoot connectivity issues with Google Contacts integration."
      status="Under Maintenance"
    />
  );
};

export default ContactsApp;