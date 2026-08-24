import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle, 
  signInWithEmail,
  signUpWithEmail,
  resetUserPassword,
  signOutUser 
} from '../firebase';

/**
 * Translates Firebase Auth error codes into clear, user-friendly guidance.
 */
export function formatAuthErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const code = err?.code || '';
  const rawMsg = err?.message || '';

  switch (code) {
    case 'auth/user-not-found':
      return 'No account found for this email address. Please click "Need an account? Sign Up" to register first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials or click "Forgot Password?".';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address (e.g. owner@micro-llc.tax).';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/unauthorized-domain':
      return `Firebase Notice: Domain '${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}' is not listed in Firebase Console Authorized Domains. Click "Enter Sandbox Mode" below for local preview.`;
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is disabled in your Firebase project settings. Click "Enter Sandbox Mode" below for local testing.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access temporarily locked. Reset password or use Sandbox Mode below.';
    default:
      return rawMsg || 'Authentication operation failed.';
  }
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthorized: boolean;
  authorizedEmail: string;
  authError: string | null;
  clearAuthError: () => void;
  signIn: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  devBypass: boolean;
  setDevBypass: (bypass: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  ownerEmail?: string;
}

/**
 * Authentication Provider component for managing user auth state and authorization.
 */
export function AuthProvider({ children, ownerEmail = '' }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [devBypass, setDevBypass] = useState<boolean>(() => {
    return localStorage.getItem('taxshield_auth_dev_bypass') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        const formatted = formatAuthErrorMessage(err);
        setAuthError(formatted);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (email: string, pass: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      await signInWithEmail(email, pass);
    } catch (err: any) {
      const formatted = formatAuthErrorMessage(err);
      setAuthError(formatted);
      throw new Error(formatted);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (email: string, pass: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      await signUpWithEmail(email, pass);
    } catch (err: any) {
      const formatted = formatAuthErrorMessage(err);
      setAuthError(formatted);
      throw new Error(formatted);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      setAuthError(null);
      await resetUserPassword(email);
    } catch (err: any) {
      const formatted = formatAuthErrorMessage(err);
      setAuthError(formatted);
      throw new Error(formatted);
    }
  };

  const clearAuthError = () => setAuthError(null);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      localStorage.removeItem('taxshield_auth_dev_bypass');
      setDevBypass(false);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign out.');
    }
  };

  const toggleDevBypass = (bypass: boolean) => {
    setDevBypass(bypass);
    localStorage.setItem('taxshield_auth_dev_bypass', bypass ? 'true' : 'false');
  };

  const cleanOwnerEmail = ownerEmail.trim().toLowerCase();
  const userEmail = user?.email?.trim().toLowerCase() || '';

  // Authorized if dev bypass active, or if owner email not configured yet (first setup), or if user email matches company owner email
  const isAuthorized = Boolean(
    devBypass ||
    (user && (!cleanOwnerEmail || userEmail === cleanOwnerEmail))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthorized,
        authorizedEmail: cleanOwnerEmail,
        authError,
        clearAuthError,
        signIn: handleGoogleSignIn,
        signInEmail: handleEmailSignIn,
        signUpEmail: handleEmailSignUp,
        resetPassword: handleResetPassword,
        signOut: handleSignOut,
        devBypass,
        setDevBypass: toggleDevBypass
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to consume the AuthContext state.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

