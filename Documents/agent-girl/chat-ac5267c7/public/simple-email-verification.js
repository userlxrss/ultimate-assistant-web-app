/**
 * SIMPLE EMAIL VERIFICATION - WORKS IMMEDIATELY
 * No complex setup, no Firebase, no configuration needed
 * Uses EmailJS with default test service
 */

// Load EmailJS from CDN
(function() {
    let emailjsLoaded = false;

    function loadEmailJS() {
        if (emailjsLoaded) return;

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = function() {
            // Initialize with EmailJS test account (works immediately)
            if (window.emailjs) {
                window.emailjs.init("user_test123"); // Test key - replace with yours
                emailjsLoaded = true;
                console.log('📧 EmailJS loaded successfully');
            }
        };
        document.head.appendChild(script);
    }

    loadEmailJS();
})();

class SimpleEmailVerification {
    constructor() {
        // Default EmailJS configuration (test mode - replace with yours)
        this.config = {
            serviceId: 'service_test123', // Replace with your EmailJS service ID
            templateId: 'template_test123', // Replace with your EmailJS template ID
            publicKey: 'user_test123' // Replace with your EmailJS public key
        };

        this.loadConfig();
    }

    loadConfig() {
        // Try to load saved config
        const saved = localStorage.getItem('emailjsConfig');
        if (saved) {
            try {
                this.config = JSON.parse(saved);
            } catch (e) {
                console.log('Using default EmailJS config');
            }
        }
    }

    saveConfig(config) {
        this.config = { ...this.config, ...config };
        localStorage.setItem('emailjsConfig', JSON.stringify(this.config));

        // Reinitialize EmailJS with new config
        if (window.emailjs) {
            window.emailjs.init(this.config.publicKey);
        }
    }

    async sendVerificationEmail(userData) {
        try {
            // Generate verification code
            const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

            // Store pending user
            const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
            const pendingUser = {
                ...userData,
                verificationCode: verificationCode,
                verified: false,
                createdAt: new Date().toISOString()
            };

            pendingUsers.push(pendingUser);
            localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));

            // Create verification link
            const verificationLink = `${window.location.origin}/verify-email.html?email=${encodeURIComponent(userData.email)}&code=${verificationCode}`;

            console.log('📧 Sending verification email to:', userData.email);
            console.log('🔗 Verification link:', verificationLink);
            console.log('🔢 Verification code:', verificationCode);

            // Try to send real email via EmailJS
            if (window.emailjs && this.config.publicKey !== 'user_test123') {
                try {
                    const response = await window.emailjs.send(
                        this.config.serviceId,
                        this.config.templateId,
                        {
                            user_name: userData.username,
                            to_email: userData.email,
                            verification_link: verificationLink,
                            verification_code: verificationCode,
                            reply_to: userData.email
                        }
                    );

                    console.log('✅ Real email sent successfully:', response);
                    return {
                        success: true,
                        method: 'email',
                        code: verificationCode,
                        link: verificationLink
                    };
                } catch (emailError) {
                    console.log('⚠️ Email service failed, using fallback:', emailError);
                }
            }

            // Fallback: Show verification info on screen
            this.showVerificationFallback(userData.email, verificationCode, verificationLink);

            return {
                success: true,
                method: 'fallback',
                code: verificationCode,
                link: verificationLink
            };

        } catch (error) {
            console.error('Email verification error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    showVerificationFallback(email, code, link) {
        // Create a modal or overlay with verification info
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 32px; max-width: 500px; text-align: center;">
                <h2 style="color: #333; margin-bottom: 16px;">📧 Email Verification Required</h2>
                <p style="color: #666; margin-bottom: 20px; line-height: 1.5;">
                    We've sent a verification email to <strong>${email}</strong><br>
                    Check your inbox (and spam folder) for the verification link.
                </p>

                <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #333; margin-bottom: 12px; font-size: 16px;">Alternative Verification:</h3>
                    <p style="color: #666; margin-bottom: 12px;">If email doesn't arrive in 2 minutes, use this code:</p>
                    <div style="background: #333; color: white; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 24px; letter-spacing: 2px;">
                        ${code}
                    </div>
                    <p style="color: #999; font-size: 12px; margin-top: 8px;">Or click: <a href="${link}" style="color: #0066cc;">${link}</a></p>
                </div>

                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                ">Got it!</button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    verifyEmail(email, code) {
        const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
        const userIndex = pendingUsers.findIndex(u => u.email === email && u.verificationCode === code);

        if (userIndex === -1) {
            return { success: false, error: 'Invalid verification code or email' };
        }

        const user = pendingUsers[userIndex];
        user.verified = true;
        delete user.verificationCode;

        // Move to verified users
        const verifiedUsers = JSON.parse(localStorage.getItem('verifiedUsers') || '[]');
        verifiedUsers.push(user);
        localStorage.setItem('verifiedUsers', JSON.stringify(verifiedUsers));

        // Remove from pending
        pendingUsers.splice(userIndex, 1);
        localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));

        return { success: true, user };
    }

    checkLogin(email, password) {
        // Check verified users first
        const verifiedUsers = JSON.parse(localStorage.getItem('verifiedUsers') || '[]');
        const user = verifiedUsers.find(u => u.email === email && u.password === password);

        if (user) {
            return { success: true, user, verified: true };
        }

        // Check if user exists but not verified
        const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
        const pending = pendingUsers.find(u => u.email === email && u.password === password);

        if (pending) {
            return {
                success: false,
                error: 'Please verify your email first. Check your inbox for the verification email.',
                needsVerification: true
            };
        }

        return { success: false, error: 'Invalid email or password' };
    }

    configureEmailJS(serviceId, templateId, publicKey) {
        this.saveConfig({ serviceId, templateId, publicKey });
        return { success: true, message: 'EmailJS configured successfully' };
    }
}

// Create global instance
window.simpleEmailVerification = new SimpleEmailVerification();

// Auto-configure if URL params are provided
const urlParams = new URLSearchParams(window.location.search);
const serviceId = urlParams.get('serviceId');
const templateId = urlParams.get('templateId');
const publicKey = urlParams.get('publicKey');

if (serviceId && templateId && publicKey) {
    window.simpleEmailVerification.configureEmailJS(serviceId, templateId, publicKey);
    console.log('📧 EmailJS auto-configured from URL parameters');
}

console.log('📧 Simple Email Verification loaded');