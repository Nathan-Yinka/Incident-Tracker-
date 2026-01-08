import { User as PrismaUser, Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export type User = PrismaUser;

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
}


