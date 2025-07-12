import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  token_balance: number;
}

interface AuthContextType {
  user: User | null;
  sessionId: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!sessionId;

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('sessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
      refreshUser(savedSessionId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async (currentSessionId?: string) => {
    try {
      const sid = currentSessionId || sessionId;
      if (!sid) {
        setIsLoading(false);
        return;
      }

      const response = await apiRequest('/api/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sid}`
        }
      });

      if (response.user) {
        setUser(response.user);
      } else {
        // Invalid session
        setUser(null);
        setSessionId(null);
        localStorage.removeItem('sessionId');
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      setSessionId(null);
      localStorage.removeItem('sessionId');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.success) {
        setUser(response.user);
        setSessionId(response.sessionId);
        localStorage.setItem('sessionId', response.sessionId);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await apiRequest('/api/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.success) {
        setUser(response.user);
        setSessionId(response.sessionId);
        localStorage.setItem('sessionId', response.sessionId);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      if (sessionId) {
        await apiRequest('/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionId}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setSessionId(null);
      localStorage.removeItem('sessionId');
    }
  };

  const value = {
    user,
    sessionId,
    login,
    register,
    logout,
    refreshUser: () => refreshUser(),
    isAuthenticated,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}