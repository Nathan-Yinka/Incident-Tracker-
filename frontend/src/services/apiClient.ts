import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { ApiResponse, ApiErrorResponse } from '../types';
import { API_CONFIG } from '../config/api';
import { APP_ROUTES } from '../config/routes';

// Use relative URL if VITE_API_URL is set to backend service name (Docker)
// Otherwise use the provided URL or default to localhost
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If VITE_API_URL is set to backend service name (Docker), use relative URL
  // nginx will proxy /api requests to the backend
  if (envUrl === API_CONFIG.dockerBackendUrl) {
    return API_CONFIG.basePath;
  }
  
  // Otherwise use the provided URL or default
  return envUrl
    ? `${envUrl}${API_CONFIG.basePath}`
    : `${API_CONFIG.localFallbackUrl}${API_CONFIG.basePath}`;
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
          window.location.href = APP_ROUTES.login;
        }
        if (error.response?.status === 403) {
          window.location.href = APP_ROUTES.accessDenied;
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
