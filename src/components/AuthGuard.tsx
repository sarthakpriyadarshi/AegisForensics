'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthState {
  isAuthenticated: boolean;
  needsAdminSetup: boolean;
  isLoading: boolean;
}

export function useAuthCheck() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    needsAdminSetup: false,
    isLoading: true
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // First check if admin setup is needed
        const rootResponse = await fetch('http://localhost:8000/');
        if (rootResponse.ok) {
          const rootData = await rootResponse.json();
          
          if (rootData.admin_setup_required) {
            setAuthState({
              isAuthenticated: false,
              needsAdminSetup: true,
              isLoading: false
            });
            return;
          }
        }

        // Check if user is authenticated
        const token = localStorage.getItem('aegis_token');
        if (!token) {
          setAuthState({
            isAuthenticated: false,
            needsAdminSetup: false,
            isLoading: false
          });
          return;
        }

        // Verify token by calling authenticated endpoint
        const verifyResponse = await fetch('http://localhost:8000/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (verifyResponse.ok) {
          setAuthState({
            isAuthenticated: true,
            needsAdminSetup: false,
            isLoading: false
          });
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('aegis_token');
          setAuthState({
            isAuthenticated: false,
            needsAdminSetup: false,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthState({
          isAuthenticated: false,
          needsAdminSetup: false,
          isLoading: false
        });
      }
    };

    checkAuthStatus();
  }, []);

  const redirectToAuth = () => {
    if (authState.needsAdminSetup) {
      router.push('/auth/setup');
    } else {
      router.push('/auth/login');
    }
  };

  const redirectToDashboard = () => {
    router.push('/dashboard');
  };

  return {
    ...authState,
    redirectToAuth,
    redirectToDashboard
  };
}

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated, needsAdminSetup, isLoading, redirectToAuth } = useAuthCheck();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      redirectToAuth();
    }
  }, [isLoading, requireAuth, isAuthenticated, redirectToAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}

// Hook for checking if redirect is needed on landing page
export function useAuthRedirect() {
  const { isAuthenticated, needsAdminSetup, isLoading, redirectToAuth, redirectToDashboard } = useAuthCheck();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // User is authenticated, redirect to dashboard
        redirectToDashboard();
      } else if (needsAdminSetup) {
        // Need admin setup, redirect to setup page
        redirectToAuth();
      }
      // If not authenticated and no setup needed, stay on landing page
    }
  }, [isLoading, isAuthenticated, needsAdminSetup, redirectToAuth, redirectToDashboard]);

  return { isLoading, needsAdminSetup, isAuthenticated };
}
