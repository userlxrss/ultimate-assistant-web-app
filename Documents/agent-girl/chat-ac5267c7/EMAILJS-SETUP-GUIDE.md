# EmailJS Integration Setup Guide

## CRITICAL - IMMEDIATE ACTION REQUIRED

This guide will help you set up EmailJS to enable real email verification for your authentication system.

## What is EmailJS?

EmailJS is a free email service that allows you to send emails directly from your frontend application without requiring a backend server. It's perfect for development and small-scale applications.

## Quick Setup Steps (15 minutes)

### 1. Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click **"Sign Up"** and create a free account
3. Verify your email address

### 2. Create Email Service

1. After logging in, click **"Email Services"** in the sidebar
2. Click **"Add New Service"**
3. Choose **"Gmail"** (recommended for free tier)
4. Click **"Connect Account"** and authorize with your Gmail
5. Give your service a name (e.g., "Productivity Hub Mail")
6. Click **"Create Service"**

**Note**: The service ID will look like `service_xxxxxxxxxxxx`

### 3. Create Email Templates

#### A. Email Verification Template

1. Click **"Email Templates"** in the sidebar
2. Click **"Create New Template"**
3. **Template Name**: "Email Verification"
4. **Subject**: `Verify your Productivity Hub account - {{verification_code}}`
5. **Content** (HTML format):

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #9333ea; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .code { background: #e0e7ff; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; }
        .button { background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Productivity Hub!</h1>
        </div>
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi {{to_name}},</p>
            <p>Thank you for signing up for Productivity Hub! Please use the verification code below to complete your registration:</p>

            <div class="code">{{verification_code}}</div>

            <p>This code will expire in 10 minutes.</p>

            <p><a href="{{verification_link}}" class="button">Verify Email</a></p>

            <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
            <p>Need help? Contact us at {{support_email}}</p>
        </div>
    </div>
</body>
</html>
```

6. **Template Variables** (EmailJS will auto-detect these):
   - `{{to_name}}`
   - `{{to_email}}`
   - `{{verification_code}}`
   - `{{verification_link}}`
   - `{{company_name}}`
   - `{{support_email}}`
   - `{{current_year}}`

7. Click **"Save"**

#### B. Password Reset Template

1. Click **"Create New Template"** again
2. **Template Name**: "Password Reset"
3. **Subject**: `Reset your Productivity Hub password`
4. **Content** (HTML format):

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
        .button { background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi {{to_name}},</p>
            <p>We received a request to reset the password for your Productivity Hub account.</p>

            <div class="warning">
                <strong>Security Notice:</strong> This link will expire in {{reset_expires}}. If you didn't request this reset, please ignore this email.
            </div>

            <p><a href="{{reset_link}}" class="button">Reset Password</a></p>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>{{reset_link}}</p>

            <p>For security reasons, this reset token is: <strong>{{reset_token}}</strong></p>
        </div>
        <div class="footer">
            <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
            <p>Need help? Contact us at {{support_email}}</p>
        </div>
    </div>
</body>
</html>
```

6. **Template Variables**:
   - `{{to_name}}`
   - `{{to_email}}`
   - `{{reset_token}}`
   - `{{reset_link}}`
   - `{{company_name}}`
   - `{{support_email}}`
   - `{{current_year}}`
   - `{{reset_expires}}`

7. Click **"Save"**

### 4. Get Your Public Key

1. Click **"Account"** in the sidebar
2. Your **Public Key** will be displayed
3. Copy this key - it looks like `xxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 5. Update Configuration

Update the EmailJS configuration in `/Users/larstuesca/Documents/agent-girl/chat-ac5267c7/public/auth/authManager.js`:

```javascript
// In the constructor (lines 13-19), replace with your actual values:
this.emailjs = {
    serviceId: 'service_your_actual_service_id', // Replace with your service ID
    templateIdVerification: 'template_your_verification_template_id', // Replace with verification template ID
    templateIdPasswordReset: 'template_your_password_reset_template_id', // Replace with password reset template ID
    publicKey: 'your_actual_emailjs_public_key' // Replace with your public key
};
```

## Test Your Configuration

### Method 1: Use the Browser Console

1. Open your application in a browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Test the email sending:

```javascript
// Test verification email
window.authManager.sendVerificationEmail('your-test-email@gmail.com', '123456', 'Test User');

// Test password reset email
window.authManager.sendPasswordResetEmail('your-test-email@gmail.com', 'reset_token_123', 'Test User');
```

### Method 2: Test Through Signup

1. Go to your signup page
2. Fill out the form with a real email address
3. Submit the form
4. Check your email for the verification code

## Troubleshooting

### Common Issues

1. **"EmailJS not loaded" Error**
   - Ensure you have internet connection
   - Check if the EmailJS CDN is accessible
   - Clear browser cache and reload

2. **"The user ID is not registered" Error**
   - Verify your Public Key is correct
   - Ensure you're using the correct account

3. **"The service ID is not registered" Error**
   - Check your service ID in EmailJS dashboard
   - Ensure the service is active

4. **"The template ID is not registered" Error**
   - Verify template IDs in EmailJS dashboard
   - Ensure templates are saved and active

5. **Gmail Authorization Issues**
   - Make sure you completed the Gmail authorization
   - Check Gmail security settings - may need to allow "less secure apps"

### Email Not Arriving?

1. Check spam/junk folder
2. Verify the "To" email address is correct
3. Check EmailJS dashboard for send history
4. Verify Gmail service is connected properly

## Rate Limits (Free Plan)

- **200 emails per month**
- **1 email per second**
- Suitable for development and small applications

For production with high volume, consider upgrading to EmailJS Pro or switching to a backend email service.

## Production Considerations

1. **Security**: Your EmailJS public key is visible in frontend code - this is safe by design
2. **Rate Limiting**: Implement client-side cooldown (already included in authManager.js)
3. **Email Templates**: Use professional HTML templates (included above)
4. **Error Handling**: Comprehensive error handling is already implemented
5. **Monitoring**: Check EmailJS dashboard for email delivery status

## Alternative Email Services

If EmailJS doesn't meet your needs:

1. **Resend** - Developer-friendly email API
2. **SendGrid** - Professional email service
3. **Mailgun** - Powerful email API for developers
4. **AWS SES** - Amazon's email service (requires backend)

These require backend implementation and are more suitable for production applications.

## Support

- **EmailJS Documentation**: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- **EmailJS Support**: support@emailjs.com
- **GitHub Issues**: [https://github.com/emailjs-com/emailjs-sdk](https://github.com/emailjs-com/emailjs-sdk)

---

**IMPORTANT**: Replace the placeholder values in authManager.js with your actual EmailJS credentials to enable real email sending!