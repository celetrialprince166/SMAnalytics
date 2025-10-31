/**
 * usePermissions Hook
 * 
 * Custom hook for checking user permissions
 */

import { useAuth } from '@/lib/contexts/AuthContext';
import { UserPermissions } from '@/types';

export function usePermissions() {
  const { permissions, hasPermission } = useAuth();

  return {
    permissions,
    hasPermission,
    canManageAccounts: hasPermission('canManageAccounts'),
    canManageProducts: hasPermission('canManageProducts'),
    canCreateTransactions: hasPermission('canCreateTransactions'),
    canEditTransactions: hasPermission('canEditTransactions'),
    canDeleteTransactions: hasPermission('canDeleteTransactions'),
    canViewReports: hasPermission('canViewReports'),
    canExportData: hasPermission('canExportData'),
    canManageUsers: hasPermission('canManageUsers'),
    canAccessSystemSettings: hasPermission('canAccessSystemSettings'),
  };
}
