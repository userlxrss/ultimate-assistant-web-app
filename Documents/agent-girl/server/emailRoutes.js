/**
 * EMAIL VERIFICATION API ENDPOINTS
 * Simple routes for signup, email verification, and login
 */

import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Email service using existing Gmail credentials
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER || process.env.GMAIL_USER,
                pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
            }
        });
    }

    async sendVerificationEmail(userData) {
        try {
            const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/verify-email.html?email=${encodeURIComponent(userData.email)}&code=${verificationCode}`;

            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verify Your Email - Analytics Dashboard</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">📧 Verify Your Email</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to Analytics Dashboard</p>
        </div>
        <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${userData.username || 'there'},</h2>
            <p style="color: #4b5563; margin-bottom: 25px; font-size: 16px;">
                Thanks for signing up! Please verify your email address.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}"
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px;
                          font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    ✅ Verify Email Address
                </a>
            </div>
            <div style="background: #f3f4f6; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; border: 2px dashed #d1d5db;">
                <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
                    📱 Or use this verification code:
                </h3>
                <div style="background: #1f2937; color: white; padding: 20px; border-radius: 8px;
                           font-family: 'Courier New', monospace; font-size: 28px; letter-spacing: 4px;
                           font-weight: bold; display: inline-block; margin: 10px auto;">
                    ${verificationCode}
                </div>
            </div>
        </div>
        <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
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
                html: htmlContent
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully:', { messageId: info.messageId, to: userData.email });

            return {
                success: true,
                messageId: info.messageId,
                verificationCode: verificationCode,
                verificationLink: verificationLink
            };

        } catch (error) {
            console.error('❌ Email sending failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async testConnection() {
        try {
            await this.transporter.verify();
            return { success: true, message: 'Email service connected successfully' };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                suggestion: 'Check your Gmail app password and SMTP settings in .env file'
            };
        }
    }
}

const emailService = new EmailService();

// In-memory storage (use database in production)
const users = new Map();
const pendingUsers = new Map();

// POST /api/auth/signup - Send verification email
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username, email, and password are required'
            });
        }

        if (users.has(email) || pendingUsers.has(email)) {
            return res.status(400).json({
                success: false,
                error: 'An account with this email already exists'
            });
        }

        const emailResult = await emailService.sendVerificationEmail({
            username,
            email,
            password
        });

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Failed to send verification email',
                details: emailResult.error
            });
        }

        pendingUsers.set(email, {
            username,
            email,
            password,
            verificationCode: emailResult.verificationCode,
            createdAt: new Date()
        });

        setTimeout(() => {
            pendingUsers.delete(email);
        }, 24 * 60 * 60 * 1000);

        res.json({
            success: true,
            message: 'Verification email sent successfully',
            verificationCode: emailResult.verificationCode
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// POST /api/auth/verify - Verify email with code
router.post('/verify', (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                error: 'Email and verification code are required'
            });
        }

        const pendingUser = pendingUsers.get(email);

        if (!pendingUser || pendingUser.verificationCode !== code.toUpperCase()) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification code'
            });
        }

        users.set(email, {
            username: pendingUser.username,
            email: pendingUser.email,
            password: pendingUser.password,
            verified: true,
            createdAt: new Date()
        });

        pendingUsers.delete(email);

        res.json({
            success: true,
            message: 'Email verified successfully! You can now log in.',
            user: {
                username: users.get(email).username,
                email: users.get(email).email,
                verified: true
            }
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// POST /api/auth/login - Login verified user
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        const user = users.get(email);

        if (!user || user.password !== password) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                username: user.username,
                email: user.email,
                verified: true
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET /api/auth/test-email - Test email configuration
router.get('/test-email', async (req, res) => {
    try {
        const testResult = await emailService.testConnection();
        res.json(testResult);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;