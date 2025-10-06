import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  credits: number;
  credits_zhi1: number;
  credits_zhi2: number;
  credits_zhi3: number;
  credits_zhi4: number;
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

  const updateAllCredits = (credits: { zhi1: number; zhi2: number; zhi3: number; zhi4: number }) => {
    if (user) {
      const updatedUser = { 
        ...user, 
        credits_zhi1: credits.zhi1,
        credits_zhi2: credits.zhi2,
        credits_zhi3: credits.zhi3,
        credits_zhi4: credits.zhi4
      };
      setUser(updatedUser);
      queryClient.setQueryData(['/api/me'], updatedUser);
    }
  };

  const refetchUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/me'] });
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateCredits,
    updateAllCredits,
    refetchUser
  };
}