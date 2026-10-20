import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
}

export interface AuthMembership {
  id: string;
  companyId: string;
  role: 'OWNER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'INVITED' | 'DEACTIVATED';
}

export interface EmployeeProfileSummary {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  email: string;
}

export interface BootstrapStatus {
  bootstrapRequired: boolean;
  hasCompany: boolean;
  company?: { id: string; name: string; ownerEmail: string } | null;
}

export interface UpdateCredentialsPayload {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
  confirmPassword?: string;
  displayName?: string;
}

export interface InvitationDetails {
  success: boolean;
  email: string;
  displayName: string;
  companyName: string;
  hasExistingAccount: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  membership: AuthMembership | null;
  employeeProfile: EmployeeProfileSummary | null;
  loading: boolean;
  isAuthorized: boolean;
  isOwner: boolean;
  isEmployee: boolean;
  isReadOnly: boolean;
  authError: string | null;
  bootstrapStatus: BootstrapStatus | null;
  clearAuthError: () => void;
  refreshSession: () => Promise<void>;
  checkBootstrapStatus: () => Promise<BootstrapStatus>;
  bootstrapCompany: (companyData: any) => Promise<{ success: boolean; companyId: string; defaultOwnerEmail: string }>;
  bootstrapOwner: (ownerData: { companyId?: string; email: string; password: string; confirmPassword?: string; displayName?: string }) => Promise<void>;
  bootstrapSystem: (payload: any) => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string, confirmPassword?: string) => Promise<{ success: boolean; message: string; email?: string }>;
  acceptInvitation: (token: string, password: string, confirmPassword?: string, displayName?: string) => Promise<void>;
  getInvitationDetails: (token: string) => Promise<InvitationDetails>;
  inviteEmployee: (email: string, displayName?: string) => Promise<void>;
  triggerEmployeePasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  updateCredentials: (payload: UpdateCredentialsPayload) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [membership, setMembership] = useState<AuthMembership | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfileSummary | null>(null);
  const [isReadOnlyState, setIsReadOnlyState] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus | null>(null);

  const clearAuthError = () => setAuthError(null);

  const checkBootstrapStatus = useCallback(async (): Promise<BootstrapStatus> => {
    try {
      const res = await fetch('/api/auth/bootstrap-status');
      const data = await res.json();
      const status: BootstrapStatus = {
        bootstrapRequired: Boolean(data.bootstrapRequired),
        hasCompany: Boolean(data.hasCompany),
        company: data.company || null,
      };
      setBootstrapStatus(status);
      return status;
    } catch (err: any) {
      console.error('Failed to check bootstrap status:', err);
      const fallback: BootstrapStatus = { bootstrapRequired: false, hasCompany: true };
      setBootstrapStatus(fallback);
      return fallback;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const bStatus = await checkBootstrapStatus();

      if (bStatus.bootstrapRequired) {
        setUser(null);
        setMembership(null);
        setEmployeeProfile(null);
        setIsReadOnlyState(false);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          setMembership(data.membership || null);
          setEmployeeProfile(data.employeeProfile || null);
          setIsReadOnlyState(Boolean(data.isReadOnly));
          setAuthError(null);
        } else {
          setUser(null);
          setMembership(null);
          setEmployeeProfile(null);
          setIsReadOnlyState(false);
        }
      } else {
        setUser(null);
        setMembership(null);
        setEmployeeProfile(null);
        setIsReadOnlyState(false);
      }
    } catch (err: any) {
      console.error('Failed to refresh session:', err);
      setUser(null);
      setMembership(null);
      setEmployeeProfile(null);
      setIsReadOnlyState(false);
    } finally {
      setLoading(false);
    }
  }, [checkBootstrapStatus]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const bootstrapCompany = async (companyData: any) => {
    try {
      setLoading(true);
      setAuthError(null);
      const res = await fetch('/api/auth/bootstrap/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save company information.');
      }
      return data;
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bootstrapOwner = async (ownerData: {
    companyId?: string;
    email: string;
    password: string;
    confirmPassword?: string;
    displayName?: string;
  }) => {
    try {
      setLoading(true);
      setAuthError(null);
      const res = await fetch('/api/auth/bootstrap/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create owner account.');
      }
      setUser(data.user);
      setMembership(data.membership);
      setBootstrapStatus({ bootstrapRequired: false, hasCompany: true });
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bootstrapSystem = async (payload: any) => {
    try {
      setLoading(true);
      setAuthError(null);
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize system.');
      }
      setUser(data.user);
      setMembership(data.membership);
      setBootstrapStatus({ bootstrapRequired: false, hasCompany: true });
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid email or password.');
      }
      setUser(data.user);
      setMembership(data.membership);
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setAuthError(null);
      const res = await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit password reset request.');
      }
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    }
  };

  const confirmPasswordReset = async (token: string, newPassword: string, confirmPassword?: string) => {
    try {
      setAuthError(null);
      const res = await fetch('/api/auth/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset password.');
      }
      return data;
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    }
  };

  const acceptInvitation = async (
    token: string,
    password: string,
    confirmPassword?: string,
    displayName?: string
  ) => {
    try {
      setLoading(true);
      setAuthError(null);
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword, displayName }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to accept invitation.');
      }
      setUser(data.user);
      setMembership(data.membership);
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getInvitationDetails = async (token: string): Promise<InvitationDetails> => {
    try {
      setAuthError(null);
      const res = await fetch(`/api/auth/invitation-details?token=${encodeURIComponent(token)}`);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Backend server needs to be restarted to load new endpoints. Please restart pnpm dev.');
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'This invitation link has expired or has already been used.');
      }
      return data;
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    }
  };

  const inviteEmployee = async (email: string, displayName?: string) => {
    try {
      setAuthError(null);
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send invitation.');
      }
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    }
  };

  const triggerEmployeePasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      setAuthError(null);
      const res = await fetch('/api/auth/trigger-staff-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to trigger password reset.');
      }
      return data;
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    }
  };

  const updateCredentials = async (
    payload: UpdateCredentialsPayload
  ): Promise<{ success: boolean; message: string; user?: AuthUser }> => {
    try {
      setAuthError(null);
      const res = await fetch('/api/auth/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update credentials.');
      }
      if (data.user) {
        setUser((prev) => (prev ? { ...prev, ...data.user } : data.user));
      }
      return data;
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setMembership(null);
      setEmployeeProfile(null);
      setIsReadOnlyState(false);
    }
  };

  const isAuthorized = Boolean(user && membership && (membership.status === 'ACTIVE' || membership.status === 'DEACTIVATED'));
  const isOwner = Boolean(membership?.role === 'OWNER' && membership?.status === 'ACTIVE');
  const isEmployee = Boolean(membership?.role === 'EMPLOYEE');
  const isReadOnly = Boolean(
    isReadOnlyState ||
    (membership?.role === 'EMPLOYEE' && (membership?.status === 'DEACTIVATED' || employeeProfile?.isActive === false))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        membership,
        employeeProfile,
        loading,
        isAuthorized,
        isOwner,
        isEmployee,
        isReadOnly,
        authError,
        bootstrapStatus,
        clearAuthError,
        refreshSession,
        checkBootstrapStatus,
        bootstrapCompany,
        bootstrapOwner,
        bootstrapSystem,
        signInEmail,
        resetPassword,
        confirmPasswordReset,
        acceptInvitation,
        getInvitationDetails,
        inviteEmployee,
        triggerEmployeePasswordReset,
        updateCredentials,
        signOut,
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
