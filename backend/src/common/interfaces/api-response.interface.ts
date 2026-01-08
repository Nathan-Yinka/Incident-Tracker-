export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  message: string;
  error?: {
    messages?: string[] | string;
    statusCode: number;
  };
}

