export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum Status {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface Incident {
  id: string;
  title: string;
  description?: string;
  severity: Severity;
  status: Status;
  isDraft: boolean;
  userId: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  assignedTo?: User;
}

export interface AuditLog {
  id: string;
  incidentId: string;
  userId: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
  user?: User;
  incident?: {
    id: string;
    title: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  incidentId?: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  incident?: {
    id: string;
    title: string;
  };
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateIncidentDto {
  title: string;
  description?: string;
  severity: Severity;
  status?: Status;
  isDraft?: boolean;
  assignedToId?: string;
}

export interface UpdateIncidentDto {
  title?: string;
  description?: string;
  severity?: Severity;
  status?: Status;
  isDraft?: boolean;
  assignedToId?: string;
}

export interface ApiResponse<T> {
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

