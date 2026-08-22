import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, AUTHORIZED_OWNER_EMAIL } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthorized: boolean;
  authorizedEmail: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  devBypass: boolean;
  setDevBypass: (bypass: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      // If popup was closed or blocked, alert gracefully
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert(err?.message || 'Authentication error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      localStorage.removeItem('taxshield_auth_dev_bypass');
      setDevBypass(false);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  const toggleDevBypass = (bypass: boolean) => {
    setDevBypass(bypass);
    localStorage.setItem('taxshield_auth_dev_bypass', bypass ? 'true' : 'false');
  };

  const isAuthorized = Boolean(
    devBypass || 
    (user && user.email && user.email.trim().toLowerCase() === AUTHORIZED_OWNER_EMAIL.toLowerCase())
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthorized,
        authorizedEmail: AUTHORIZED_OWNER_EMAIL,
        signIn: handleSignIn,
        signOut: handleSignOut,
        devBypass,
        setDevBypass: toggleDevBypass
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
