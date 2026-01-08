import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { ApiResponse, ApiErrorResponse } from '../types';

// Use relative URL if VITE_API_URL is set to backend service name (Docker)
// Otherwise use the provided URL or default to localhost
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If VITE_API_URL is set to backend service name (Docker), use relative URL
  // nginx will proxy /api requests to the backend
  if (envUrl === 'http://backend:3000') {
    return '/api';
  }
  
  // Otherwise use the provided URL or default
  return envUrl ? `${envUrl}/api` : 'http://localhost:3000/api';
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: getApiUrl(),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<unknown>>) => {
        if (response.data && typeof response.data === 'object' && 'success' in response.data) {
          return response;
        }
        return response;
      },
      (error: AxiosError<ApiErrorResponse>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  get instance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().instance;
