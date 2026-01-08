import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { User, ApiResponse, PaginatedResponse } from '../types';
import { useAuth } from './useAuth';

export const useUsers = () => {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      // Fetch all users (with a reasonable limit)
      const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
        '/admin/users?page=1&limit=100',
      );
      return response.data.data.data;
    },
    enabled: isAdmin, // Only fetch if user is admin
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

