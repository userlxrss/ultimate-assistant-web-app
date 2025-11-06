/**
 * Deployment Version Tracking
 * This file forces Vercel to rebuild when version changes
 */

export const DEPLOYMENT_VERSION = '2025-11-05-16:00:UTC';
export const EMAIL_VERIFICATION_READY = true;
export const PRODUCTION_DEPLOYMENT = 'dailydeck.vercel.app';

// This will change each time we want to force a deployment
console.log('🚀 Deployment Version:', DEPLOYMENT_VERSION);
console.log('📧 Email Verification:', EMAIL_VERIFICATION_READY);
console.log('🌐 Production URL:', PRODUCTION_DEPLOYMENT);