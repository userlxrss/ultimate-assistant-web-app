/**
 * DIRECT EMAIL SERVICE - NO THIRD PARTY BS
 * Uses your existing Gmail SMTP to send real emails
 * Clients just sign up, they get a real email. That's it.
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        // Use your existing Gmail credentials from .env
        this.transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', // false for 587, true for 465
            auth: {
                user: process.env.SMTP_USER || process.env.GMAIL_USER,
                pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
            }
        });
    }

    async sendVerificationEmail(userData) {
        try {
            // Generate verification code
            const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

            // Create verification link
            const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/verify-email.html?email=${encodeURIComponent(userData.email)}&code=${verificationCode}`;

            // Professional HTML email template
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verify Your Email - Analytics Dashboard</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: #f8fafc;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">📧 Verify Your Email</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to Analytics Dashboard</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${userData.username || 'there'},</h2>

            <p style="color: #4b5563; margin-bottom: 25px; font-size: 16px;">
                Thanks for signing up! To complete your registration and start using the dashboard,
                please verify your email address by clicking the button below or using the verification code.
            </p>

            <!-- Verification Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}"
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px;
                          font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    ✅ Verify Email Address
                </a>
            </div>

            <!-- Verification Code -->
            <div style="background: #f3f4f6; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; border: 2px dashed #d1d5db;">
                <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
                    📱 Or use this verification code:
                </h3>
                <div style="background: #1f2937; color: white; padding: 20px; border-radius: 8px;
                           font-family: 'Courier New', monospace; font-size: 28px; letter-spacing: 4px;
                           font-weight: bold; display: inline-block; margin: 10px auto;">
                    ${verificationCode}
                </div>
                <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 14px;">
                    Code expires in 24 hours
                </p>
            </div>

            <!-- Instructions -->
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>📌 Note:</strong> If you didn't create an account, please ignore this email.
                    Your account won't be activated until you verify your email.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Need help? Reply to this email or contact support
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2024 Analytics Dashboard. Making data beautiful.
            </p>
        </div>
    </div>
</body>
</html>`;

            const mailOptions = {
                from: `"${process.env.EMAIL_FROM_NAME || 'Analytics Dashboard'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
                to: userData.email,
                subject: `Verify your email - Verification Code: ${verificationCode}`,
                html: htmlContent,
                text: `
Hi ${userData.username || 'there'},

Thanks for signing up for Analytics Dashboard!

Your verification code is: ${verificationCode}

Or click this link to verify: ${verificationLink}

This code expires in 24 hours.

If you didn't create an account, please ignore this email.
                `
            };

            // Send the email
            const info = await this.transporter.sendMail(mailOptions);

            console.log('✅ Email sent successfully:', {
                messageId: info.messageId,
                to: userData.email,
                verificationCode: verificationCode
            });

            return {
                success: true,
                messageId: info.messageId,
                verificationCode: verificationCode,
                verificationLink: verificationLink
            };

        } catch (error) {
            console.error('❌ Email sending failed:', error);

            // Return detailed error for debugging
            return {
                success: false,
                error: error.message,
                details: {
                    code: error.code,
                    command: error.command,
                    response: error.response
                }
            };
        }
    }

    // Test email configuration
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service is ready to send emails');
            return { success: true, message: 'Email service connected successfully' };
        } catch (error) {
            console.error('❌ Email service connection failed:', error);
            return {
                success: false,
                error: error.message,
                suggestion: 'Check your Gmail app password and SMTP settings in .env file'
            };
        }
    }
}

module.exports = new EmailService();