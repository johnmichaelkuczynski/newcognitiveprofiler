import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  credits: number;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/me'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/me');
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    } else if (error) {
      setUser(null);
    }
  }, [data, error]);

  const login = (userData: AuthUser) => {
    setUser(userData);
    queryClient.setQueryData(['/api/me'], userData);
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      queryClient.removeQueries({ queryKey: ['/api/me'] });
    }
  };

  const updateCredits = (newCredits: number) => {
    if (user) {
      const updatedUser = { ...user, credits: newCredits };
      setUser(updatedUser);
      queryClient.setQueryData(['/api/me'], updatedUser);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateCredits
  };
}