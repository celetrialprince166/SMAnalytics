/**
 * User and Authentication Domain Models
 * 
 * This file contains all TypeScript interfaces related to user management,
 * authentication, and authorization
 */

export type UserLevel = 'USER_1' | 'USER_2' | 'ADMIN' | 'SUPER_USER';

export interface User {
  id: string;
  userId: string;
  username: string;
  passwordHash: string;
  level: UserLevel;
  name: string;
  email?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  userId: string;
  username: string;
  level: UserLevel;
  name: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Request/Response types for authentication
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  session?: UserSession;
  user?: Omit<User, 'passwordHash'>;
  message?: string;
}

export interface SignupRequest {
  userId: string;
  accessCode: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface SignupResponse {
  success: boolean;
  user?: Omit<User, 'passwordHash'>;
  message?: string;
}

export interface ChangePasswordRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
}

// Access code for user registration
export interface AccessCode {
  id: string;
  code: string;
  userId: string;
  level: UserLevel;
  name: string;
  isUsed: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User permissions
export interface UserPermissions {
  canManageAccounts: boolean;
  canManageProducts: boolean;
  canCreateTransactions: boolean;
  canEditTransactions: boolean;
  canDeleteTransactions: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
  canAccessSystemSettings: boolean;
}

// Permission mapping by user level
export const USER_PERMISSIONS: Record<UserLevel, UserPermissions> = {
  USER_1: {
    canManageAccounts: false,
    canManageProducts: false,
    canCreateTransactions: true,
    canEditTransactions: false,
    canDeleteTransactions: false,
    canViewReports: true,
    canExportData: false,
    canManageUsers: false,
    canAccessSystemSettings: false,
  },
  USER_2: {
    canManageAccounts: false,
    canManageProducts: false,
    canCreateTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: false,
    canViewReports: true,
    canExportData: true,
    canManageUsers: false,
    canAccessSystemSettings: false,
  },
  ADMIN: {
    canManageAccounts: true,
    canManageProducts: true,
    canCreateTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: true,
    canViewReports: true,
    canExportData: true,
    canManageUsers: false,
    canAccessSystemSettings: true,
  },
  SUPER_USER: {
    canManageAccounts: true,
    canManageProducts: true,
    canCreateTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: true,
    canViewReports: true,
    canExportData: true,
    canManageUsers: true,
    canAccessSystemSettings: true,
  },
};

// User profile for display
export interface UserProfile {
  userId: string;
  username: string;
  level: UserLevel;
  name: string;
  email?: string;
  lastLogin?: Date;
  permissions: UserPermissions;
}
