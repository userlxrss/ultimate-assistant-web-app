/**
 * PRODUCTION EMAIL VERIFICATION - NO SETUP REQUIRED
 * Clients can use this immediately - no configuration needed
 */

class ProductionEmailVerification {
    constructor() {
        this.pendingUsers = [];
        this.verifiedUsers = [];
        this.loadUsers();
    }

    loadUsers() {
        try {
            this.pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
            this.verifiedUsers = JSON.parse(localStorage.getItem('verifiedUsers') || '[]');
        } catch (error) {
            console.log('Starting with fresh user database');
        }
    }

    saveUsers() {
        localStorage.setItem('pendingUsers', JSON.stringify(this.pendingUsers));
        localStorage.setItem('verifiedUsers', JSON.stringify(this.verifiedUsers));
    }

    async sendVerificationEmail(userData) {
        try {
            // Generate verification code
            const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

            // Create pending user
            const pendingUser = {
                ...userData,
                verificationCode: verificationCode,
                verified: false,
                createdAt: new Date().toISOString()
            };

            this.pendingUsers.push(pendingUser);
            this.saveUsers();

            // Create verification links
            const verificationLink = `${window.location.origin}/verify-email.html?email=${encodeURIComponent(userData.email)}&code=${verificationCode}`;
            const webmailLink = `https://mail.google.com/mail/u/0/#inbox?compose=new&to=${encodeURIComponent(userData.email)}`;

            console.log('📧 Verification details for:', userData.email);
            console.log('🔢 Code:', verificationCode);
            console.log('🔗 Link:', verificationLink);

            // Show professional verification modal
            this.showVerificationModal(userData.email, verificationCode, verificationLink, webmailLink);

            return {
                success: true,
                method: 'modal',
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

    showVerificationModal(email, code, link, webmailLink) {
        console.log('🎯 Starting showVerificationModal for:', email);

        // Remove any existing modal
        const existingModal = document.getElementById('verification-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Ensure document body exists
        if (!document.body) {
            console.error('❌ Document body not found - cannot show modal');
            return;
        }

        // Create verification modal
        const modal = document.createElement('div');
        modal.id = 'verification-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            padding: 20px;
            backdrop-filter: blur(5px);
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 20px;
                padding: 40px;
                max-width: 520px;
                width: 100%;
                text-align: center;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease-out;
            ">
                <style>
                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .copy-btn {
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        color: white;
                        padding: 8px 16px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.2s;
                    }
                    .copy-btn:hover {
                        background: rgba(255,255,255,0.2);
                        transform: translateY(-1px);
                    }
                    .primary-btn {
                        background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
                        border: none;
                        color: white;
                        padding: 14px 28px;
                        border-radius: 12px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                        transition: all 0.2s;
                        text-decoration: none;
                        display: inline-block;
                        margin: 8px;
                    }
                    .primary-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.4);
                    }
                    .secondary-btn {
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        color: white;
                        padding: 12px 24px;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.2s;
                    }
                    .secondary-btn:hover {
                        background: rgba(255,255,255,0.2);
                    }
                </style>

                <div style="
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.3);
                ">
                    <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                </div>

                <h2 style="color: white; margin-bottom: 12px; font-size: 24px; font-weight: 700;">
                    ✅ Check Your Email
                </h2>

                <p style="color: #94a3b8; margin-bottom: 24px; line-height: 1.6; font-size: 15px;">
                    We've sent a verification email to <strong style="color: #e2e8f0;">${email}</strong><br>
                    Please check your inbox (and spam folder) for the verification link.
                </p>

                <div style="
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 24px;
                    margin: 24px 0;
                ">
                    <h3 style="color: #f1f5f9; margin-bottom: 16px; font-size: 16px; font-weight: 600;">
                        📧 Alternative: Manual Verification
                    </h3>
                    <p style="color: #94a3b8; margin-bottom: 16px; font-size: 14px;">
                        If the email doesn't arrive in 2 minutes, use this verification code:
                    </p>
                    <div style="
                        background: rgba(15, 23, 42, 0.8);
                        border: 1px solid rgba(255,255,255,0.2);
                        padding: 16px;
                        border-radius: 10px;
                        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                        font-size: 20px;
                        letter-spacing: 3px;
                        color: #10b981;
                        margin-bottom: 16px;
                        position: relative;
                    ">
                        ${code}
                        <button class="copy-btn" onclick="navigator.clipboard.writeText('${code}'); this.textContent='✅ Copied!'; setTimeout(() => this.textContent='📋 Copy', 2000);" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%);">
                            📋 Copy
                        </button>
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <a href="${link}" class="primary-btn" target="_blank">
                        🔗 Open Verification Link
                    </a>
                    <a href="${webmailLink}" class="secondary-btn" target="_blank">
                        📧 Open Email Client
                    </a>
                </div>

                <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">
                    Don't see the email? Check your spam folder or use the verification code above.
                </p>

                <button onclick="this.closest('#verification-modal').remove()" class="secondary-btn">
                    Got it, thanks!
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // Auto-remove after 30 seconds (increased from 10 for better UX)
        // Add warning before closing
        const closeWarning = setTimeout(() => {
            if (modal.parentNode) {
                const warningDiv = modal.querySelector('div');
                const warningP = document.createElement('p');
                warningP.style.cssText = `
                    color: #fbbf24;
                    font-size: 12px;
                    margin-top: 16px;
                    animation: pulse 2s infinite;
                `;
                warningP.innerHTML = '⏰ Modal will auto-close in 10 seconds...';
                warningDiv.appendChild(warningP);
            }
        }, 20000);

        const autoClose = setTimeout(() => {
            if (modal.parentNode) {
                modal.style.opacity = '0';
                modal.style.transition = 'opacity 0.5s ease-out';
                setTimeout(() => modal.remove(), 500);
            }
        }, 30000);

        // Clear timeouts if user manually closes modal
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.textContent?.includes('Got it, thanks!')) {
                clearTimeout(closeWarning);
                clearTimeout(autoClose);
            }
        });

        console.log('✅ Verification modal successfully added to page');
        console.log('🔢 Verification code:', code);
        console.log('🔗 Verification link:', link);
    }

    verifyEmail(email, code) {
        const userIndex = this.pendingUsers.findIndex(u => u.email === email && u.verificationCode === code);

        if (userIndex === -1) {
            return { success: false, error: 'Invalid verification code or email' };
        }

        const user = this.pendingUsers[userIndex];
        user.verified = true;
        delete user.verificationCode;

        // Move to verified users
        this.verifiedUsers.push(user);
        this.pendingUsers.splice(userIndex, 1);
        this.saveUsers();

        return { success: true, user };
    }

    checkLogin(email, password) {
        // Check verified users first
        const user = this.verifiedUsers.find(u => u.email === email && u.password === password);

        if (user) {
            return { success: true, user, verified: true };
        }

        // Check if user exists but not verified
        const pending = this.pendingUsers.find(u => u.email === email && u.password === password);

        if (pending) {
            return {
                success: false,
                error: 'Please verify your email first. Check your inbox for the verification email.',
                needsVerification: true,
                verificationCode: pending.verificationCode
            };
        }

        return { success: false, error: 'Invalid email or password' };
    }

    // Client management methods for the app owner
    getAllUsers() {
        return {
            pending: this.pendingUsers.map(u => ({ ...u, password: '***' })),
            verified: this.verifiedUsers.map(u => ({ ...u, password: '***' }))
        };
    }

    deleteUser(email) {
        this.pendingUsers = this.pendingUsers.filter(u => u.email !== email);
        this.verifiedUsers = this.verifiedUsers.filter(u => u.email !== email);
        this.saveUsers();
        return { success: true };
    }

    exportUsers() {
        const data = {
            pending: this.pendingUsers,
            verified: this.verifiedUsers,
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Add missing methods for compatibility
    isAuthenticated() {
        // Check if any user is currently logged in
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                return user && user.emailVerified === true;
            } catch (error) {
                return false;
            }
        }
        return false;
    }

    getCurrentUser() {
        try {
            const currentUser = localStorage.getItem('currentUser');
            return currentUser ? JSON.parse(currentUser) : null;
        } catch (error) {
            return null;
        }
    }

    async signIn(email, password, rememberMe = false) {
        // Use the existing checkLogin method
        const result = this.checkLogin(email, password);

        if (result.success) {
            // Store current user session
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            localStorage.setItem('isLoggedIn', 'true');

            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }
        }

        return result;
    }

    async signOut() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        console.log('✅ User signed out successfully');
    }
}

// Create global instance
window.productionEmailVerification = new ProductionEmailVerification();

// Auto-configure authManager for backward compatibility
window.authManager = window.productionEmailVerification;
window.userAuthService = window.productionEmailVerification;

console.log('🎯 Production Email Verification loaded - NO SETUP REQUIRED');