// Test Gmail connection with provided credentials
const testGmailConnection = async () => {
  try {
    console.log('🔐 Testing Gmail connection with provided credentials...');

    const response = await fetch('http://localhost:3012/api/gmail/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'tuescalarina3@gmail.com',
        appPassword: 'ehsdovndpswpnsqz'
      })
    });

    const data = await response.json();
    console.log('📬 Authentication response:', data);

    if (response.ok && data.success) {
      console.log('✅ Gmail authentication successful!');

      // Test fetching emails
      const emailResponse = await fetch(`http://localhost:3012/api/gmail/emails/${data.sessionId}?limit=10`);
      const emailData = await emailResponse.json();

      console.log('📧 Email fetch response:', emailData);

      if (emailResponse.ok) {
        console.log(`✅ Successfully fetched ${emailData.emails?.length || 0} emails`);
        if (emailData.emails && emailData.emails.length > 0) {
          console.log('📧 First email:', emailData.emails[0].subject);
        }
      } else {
        console.error('❌ Failed to fetch emails:', emailData.error);
      }
    } else {
      console.error('❌ Gmail authentication failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
};

// Run the test
testGmailConnection();