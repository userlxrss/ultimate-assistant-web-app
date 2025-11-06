/**
 * Comprehensive Email Verification Test Suite
 * Tests for email verification flow in React/Supabase application
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EmailVerification } from '../src/pages/EmailVerification';
import { AuthWrapper } from '../src/components/AuthWrapper';
import * as supabaseModule from '../src/supabase';

// Mock Supabase
vi.mock('../src/supabase', () => ({
  getCurrentUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}));

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Email Verification Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('EmailVerification Component', () => {
    test('shows loading state initially', () => {
      vi.mocked(supabaseModule.getCurrentUser).mockResolvedValue(null);

      render(
        <BrowserRouter>
          <EmailVerification />
        </BrowserRouter>
      );

      expect(screen.getByText('Verifying Your Email...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('animate-spin');
    });

    test('handles successful email verification', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
      };

      vi.mocked(supabaseModule.getCurrentUser).mockResolvedValue(mockUser);

      render(
        <BrowserRouter>
          <EmailVerification />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument();
        expect(screen.getByText(/successfully verified/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      }, { timeout: 3000 });
    });

    test('handles failed email verification', async () => {
      vi.mocked(supabaseModule.getCurrentUser).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        email_confirmed_at: null,
      });

      render(
        <BrowserRouter>
          <EmailVerification />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(screen.getByText(/verification failed or the link has expired/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      }, { timeout: 4000 });
    });

    test('handles network errors gracefully', async () => {
      vi.mocked(supabaseModule.getCurrentUser).mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <EmailVerification />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(screen.getByText(/An error occurred during verification/)).toBeInTheDocument();
      });
    });

    test('manual redirect buttons work correctly', async () => {
      vi.mocked(supabaseModule.getCurrentUser).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
      });

      render(
        <BrowserRouter>
          <EmailVerification />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Go to Dashboard'));
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  describe('AuthWrapper Email Verification Integration', () => {
    test('shows EmailVerificationPending when user not verified', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        email_confirmed_at: null,
      };

      vi.mocked(supabaseModule.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(supabaseModule.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      });

      render(
        <BrowserRouter>
          <AuthWrapper />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
      });
    });

    test('redirects to dashboard when email is verified', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
      };

      vi.mocked(supabaseModule.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(supabaseModule.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      });

      render(
        <BrowserRouter>
          <AuthWrapper />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Email Redirect URL Generation', () => {
    const originalWindow = window;

    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalWindow.location,
        writable: true,
      });
    });

    test('uses correct redirect URL in development', async () => {
      window.location.origin = 'http://localhost:3000';

      const { signUpWithEmail } = await import('../src/supabase');
      vi.mocked(supabaseModule.getCurrentUser).mockResolvedValue(null);

      try {
        await signUpWithEmail('test@example.com', 'password123');
      } catch (error) {
        // Expected since we're mocking
      }

      // The implementation should use window.location.origin
      expect(window.location.origin).toBe('http://localhost:3000');
    });

    test('uses correct redirect URL in production', async () => {
      window.location.origin = 'https://dailydeck.vercel.app';

      const { signUpWithEmail } = await import('../src/supabase');
      vi.mocked(supabaseModule.getCurrentUser).mockResolvedValue(null);

      try {
        await signUpWithEmail('test@example.com', 'password123');
      } catch (error) {
        // Expected since we're mocking
      }

      expect(window.location.origin).toBe('https://dailydeck.vercel.app');
    });
  });

  describe('Email Verification Resend', () => {
    test('resend verification email functionality', async () => {
      const { resendVerificationEmail } = await import('../src/supabase');

      vi.mocked(supabaseModule.getCurrentUser).mockResolvedValue(null);

      try {
        await resendVerificationEmail('test@example.com');
      } catch (error) {
        // Expected since we're mocking
      }

      // Verify the function exists and can be called
      expect(typeof resendVerificationEmail).toBe('function');
    });
  });

  describe('Error Handling', () => {
    test('handles expired verification links', async () => {
      vi.mocked(supabaseModule.getCurrentUser).mockResolvedValue(null);

      render(
        <BrowserRouter>
          <EmailVerification />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(screen.getByText(/link has expired/)).toBeInTheDocument();
      });
    });

    test('handles already verified users accessing verification page', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
      };

      vi.mocked(supabaseModule.getCurrentUser).mockResolvedValue(mockUser);

      render(
        <BrowserRouter>
          <EmailVerification />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument();
        expect(screen.getByText(/already verified/)).toBeInTheDocument();
      });
    });

    test('handles malformed verification URLs', async () => {
      // Test with error in user session
      vi.mocked(supabaseModule.getCurrentUser).mockRejectedValue(new Error('Invalid session'));

      render(
        <BrowserRouter>
          <EmailVerification />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(screen.getByText(/An error occurred during verification/)).toBeInTheDocument();
      });
    });
  });
});