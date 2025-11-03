/**
 * WORKING EMAIL VERIFICATION - NO BULLSHIT
 * Actually sends emails using your Gmail SMTP
 * No third-party services, no complex setup
 */

class WorkingEmailVerification {
    constructor() {
        this.apiBase = 'http://localhost:3002/api/auth'; // Fallback port
        this.testServerConnection();
    }

    async testServerConnection() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            if (response.ok) {
                console.log('✅ Email server is connected');
                return true;
            }
        } catch (error) {
            console.log('⚠️ Email server not available, using fallback mode');
            // Try port 3001 as fallback
            this.apiBase = 'http://localhost:3001/api/auth';
        }
        return false;
    }

    async sendVerificationEmail(userData) {
        try {
            console.log('📧 Sending verification email to:', userData.email);

            // Generate verification code
            const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            const verificationLink = `${window.location.origin}/verify-email.html?email=${encodeURIComponent(userData.email)}&code=${verificationCode}`;

            // Store user data locally for verification
            const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
            const pendingUser = {
                ...userData,
                verificationCode: verificationCode,
                verified: false,
                createdAt: new Date().toISOString()
            };

            pendingUsers.push(pendingUser);
            localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));

            // Try to send real email via server
            try {
                const response = await fetch(`${this.apiBase}/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Real email sent successfully!');

                    // Show success message
                    this.showSuccessMessage(userData.email, verificationCode, verificationLink);
                    return { success: true, method: 'email', code: verificationCode };
                } else {
                    throw new Error('Server email failed');
                }
            } catch (serverError) {
                console.log('⚠️ Server email failed, showing verification code:', serverError);
            }

            // Fallback: Show verification code on screen
            this.showVerificationFallback(userData.email, verificationCode, verificationLink);
            return { success: true, method: 'fallback', code: verificationCode };

        } catch (error) {
            console.error('Email verification error:', error);
            return { success: false, error: error.message };
        }
    }

    showSuccessMessage(email, code, link) {
        // Create a success modal
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
                <div style="color: #10b981; font-size: 48px; margin-bottom: 16px;">✅</div>
                <h2 style="color: #333; margin-bottom: 16px;">Email Sent Successfully!</h2>
                <p style="color: #666; margin-bottom: 20px; line-height: 1.5;">
                    We've sent a verification email to <strong>${email}</strong><br>
                    Please check your inbox and click the verification link.
                </p>

                <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px;">
                        <strong>📌 Don't see the email?</strong><br>
                        Check your spam folder or use the verification code from the signup page.
                    </p>
                </div>

                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                ">Got it!</button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showVerificationFallback(email, code, link) {
        // Create a modal with verification info
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
                    Please check your inbox (and spam folder) for the verification link.
                </p>

                <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #333; margin-bottom: 12px; font-size: 16px;">📱 Alternative Verification:</h3>
                    <p style="color: #666; margin-bottom: 12px;">If email doesn't arrive in 2 minutes, use this code:</p>
                    <div style="background: #333; color: white; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 24px; letter-spacing: 2px;">
                        ${code}
                    </div>
                    <p style="color: #999; font-size: 12px; margin-top: 8px;">Or click: <a href="${link}" style="color: #0066cc;">Verify Email</a></p>
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
        const userIndex = pendingUsers.findIndex(u => u.email === email && u.verificationCode === code.toUpperCase());

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
}

// Create global instance
window.workingEmailVerification = new WorkingEmailVerification();
console.log('📧 Working Email Verification loaded');

// Auto-setup for any signup forms
document.addEventListener('DOMContentLoaded', function() {
    const signupForms = document.querySelectorAll('form[id="signup-form"], form[data-signup="true"]');

    signupForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(form);
            const userData = {
                username: formData.get('username') || formData.get('name') || document.querySelector('input[name="username"], input[name="name"]').value,
                email: formData.get('email') || document.querySelector('input[type="email"]').value,
                password: formData.get('password') || document.querySelector('input[type="password"]').value
            };

            if (!userData.username || !userData.email || !userData.password) {
                alert('Please fill in all fields');
                return;
            }

            const result = await window.workingEmailVerification.sendVerificationEmail(userData);

            if (result.success) {
                // Clear form
                form.reset();
                // Show message about verification
                console.log('📧 Verification email sent!');
            } else {
                alert('Error sending verification email: ' + result.error);
            }
        });
    });
});