# Email Verification Testing Checklist

## Overview
This checklist provides a comprehensive guide for manually testing the email verification functionality in the React/Supabase application deployed at [https://dailydeck.vercel.app](https://dailydeck.vercel.app).

## Prerequisites
- Access to the production environment
- Test email accounts (at least 2 different email providers)
- Browser developer tools
- Network monitoring tools

## Environment Setup Testing

### 1. Development Environment (localhost:3000)
- [ ] Start development server with `npm run dev`
- [ ] Verify Supabase configuration is using localhost URLs
- [ ] Check that email redirects to `http://localhost:3000/auth/verify`

### 2. Production Environment (https://dailydeck.vercel.app)
- [ ] Access production URL directly
- [ ] Verify SSL certificate is valid
- [ ] Check that email redirects to `https://dailydeck.vercel.app/auth/verify`

## Email Signup Flow Testing

### 1. Initial Sign Up
- [ ] Navigate to the signup page
- [ ] Enter valid email address (test@example.com)
- [ ] Enter valid password (8+ characters, includes number and special char)
- [ ] Click "Sign Up" button
- [ ] Verify user sees "Check your email" message
- [ ] Verify user is redirected to email verification pending page

### 2. Email Verification Link Testing
- [ ] Open email inbox for test account
- [ ] Verify email is received within 30 seconds
- [ ] Check email content includes:
  - [ ] Correct verification link
  - [ ] Proper sender information
  - [ ] Professional email design
  - [ ] Clear call-to-action button
- [ ] Click verification link in email
- [ ] Verify link redirects to correct domain (https://dailydeck.vercel.app/auth/verify)
- [ ] Verify verification page loads correctly
- [ ] Check that user is automatically redirected to dashboard after 2 seconds

### 3. Manual Navigation Testing
- [ ] After successful verification, test manual redirect button
- [ ] Click "Go to Dashboard" button
- [ ] Verify it redirects to dashboard
- [ ] Test back button navigation
- [ ] Verify dashboard loads authenticated content

## Error Handling Testing

### 1. Expired Verification Links
- [ ] Wait 24 hours after signup
- [ ] Try to use expired verification link
- [ ] Verify "Verification Failed" message appears
- [ ] Check "link has expired" error text
- [ ] Verify "Request new verification email" option
- [ ] Test that user can request new verification email

### 2. Already Verified Users
- [ ] Verify email successfully
- [ ] Try to use the same verification link again
- [ ] Verify "Email Verified!" message appears
- [ ] Check that it still redirects to dashboard

### 3. Invalid Verification Links
- [ ] Manually modify verification link parameters
- [ ] Access invalid URL like `https://dailydeck.vercel.app/auth/verify?invalid=true`
- [ ] Verify error handling
- [ ] Check appropriate error message display

### 4. Network Error Scenarios
- [ ] Disable internet connection during verification
- [ ] Try to access verification page
- [ ] Verify offline error handling
- [ ] Check loading states during network issues

## Cross-Browser Testing

### 1. Desktop Browsers
- [ ] Chrome (latest version)
- [ ] Firefox (latest version)
- [ ] Safari (latest version)
- [ ] Edge (latest version)

### 2. Mobile Browsers
- [ ] Safari on iOS
- [ ] Chrome on Android
- [ ] Samsung Internet Browser

### 3. Browser Specific Tests
- [ ] Test email link opening in incognito/private mode
- [ ] Test with browser extensions disabled
- [ ] Test with strict privacy settings
- [ ] Test popup blockers don't interfere

## Email Provider Testing

### 1. Gmail
- [ ] Test with Gmail account
- [ ] Check Gmail's link security warnings
- [ ] Verify link tracking doesn't interfere
- [ ] Test with Gmail mobile app

### 2. Outlook/Hotmail
- [ ] Test with Outlook account
- [ ] Check Microsoft's security features
- [ ] Test link rendering in Outlook

### 3. Yahoo Mail
- [ ] Test with Yahoo account
- [ ] Verify link functionality
- [ ] Check email rendering

### 4. Custom Domain Emails
- [ ] Test with business domain email
- [ ] Test with personal domain email
- [ ] Check SPF/DKIM settings don't block emails

## Security Testing

### 1. URL Security
- [ ] Verify verification links use HTTPS
- [ ] Check for proper URL encoding
- [ ] Verify no sensitive data in URL parameters
- [ ] Test link tampering resistance

### 2. Session Security
- [ ] Verify session is created only after email verification
- [ ] Test session persistence after verification
- [ ] Check automatic logout on expired sessions

### 3. Rate Limiting
- [ ] Test multiple signup attempts with same email
- [ ] Verify rate limiting on email sending
- [ ] Test brute force protection

## Performance Testing

### 1. Email Delivery Speed
- [ ] Measure time from signup to email receipt
- [ ] Test with different email providers
- [ ] Verify consistency in delivery times

### 2. Page Load Performance
- [ ] Test verification page load speed
- [ ] Check redirect performance
- [ ] Verify dashboard loading after verification

### 3. Mobile Performance
- [ ] Test on slow mobile connections
- [ ] Verify responsive design
- [ ] Check touch interactions

## Accessibility Testing

### 1. Screen Reader Compatibility
- [ ] Test with screen readers (NVDA, VoiceOver)
- [ ] Verify proper ARIA labels
- [ ] Check semantic HTML structure

### 2. Keyboard Navigation
- [ ] Test all interactive elements with keyboard
- [ ] Verify focus management
- [ ] Check skip links

### 3. Visual Accessibility
- [ ] Test with high contrast mode
- [ ] Verify text resizing works
- [ ] Check color contrast compliance

## Edge Cases Testing

### 1. User Scenarios
- [ ] User closes browser during verification
- [ ] User uses multiple tabs
- [ ] User switches between devices mid-process
- [ ] User refreshes verification page

### 2. Technical Edge Cases
- [ ] Browser with JavaScript disabled
- [ ] Very slow internet connection
- [ ] Corrupted browser cache
- [ ] Outdated browser versions

## Monitoring and Analytics Testing

### 1. Success Metrics
- [ ] Verify successful verification tracking
- [ ] Check conversion funnel analytics
- [ ] Test error event logging

### 2. Performance Monitoring
- [ ] Verify page load metrics collection
- [ ] Test error rate monitoring
- [ ] Check user behavior analytics

## Production Deployment Verification

### 1. Post-Deployment Checklist
- [ ] Verify all environment variables are set correctly
- [ ] Check Supabase configuration in production
- [ ] Test email service configuration
- [ ] Verify CORS settings

### 2. Rollback Testing
- [ ] Document rollback procedure
- [ ] Test database backup restoration
- [ ] Verify user data integrity

## Documentation Test Results

For each test completed, document:
- Test date and time
- Browser version
- Email provider
- Success/failure status
- Any issues encountered
- Screenshots (if applicable)
- Performance metrics

## Bug Report Template

If issues are found, include:
1. Environment (browser, OS, device)
2. Steps to reproduce
3. Expected vs actual behavior
4. Error messages
5. Screenshots/videos
6. Network requests details
7. Console errors

## Pass/Fail Criteria

The email verification system passes if:
- ✅ All email providers receive verification emails
- ✅ All verification links redirect to production domain
- ✅ All browsers successfully complete verification flow
- ✅ Error handling works for all failure scenarios
- ✅ Performance meets requirements (<3 seconds for verification)
- ✅ Accessibility standards are met
- ✅ Security checks pass

## Next Steps

After completing this checklist:
1. Document any issues found
2. Create bug reports for failures
3. Implement fixes for identified problems
4. Retest failed scenarios
5. Update documentation with findings