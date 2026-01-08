import { apiClient } from './apiClient';
import { LoginDto, User, ApiResponse } from '../types';
import { API_ROUTES } from '../config/apiRoutes';

export const authService = {
  async login(credentials: LoginDto): Promise<{ accessToken: string; user: User }> {
    const response = await apiClient.post<ApiResponse<{ accessToken: string; user: User }>>(
      API_ROUTES.authLogin,
      credentials,
    );
    return response.data.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(API_ROUTES.authMe);
    return response.data.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  setToken(token: string): void {
    localStorage.setItem('token', token);
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'ADMIN';
  },
};

