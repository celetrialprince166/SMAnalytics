'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/auth';
import { EmployeeManagement } from '@/components/employees/EmployeeManagement';
import { Users } from 'lucide-react';

export default function ManageEmployeesPage() {
  return (
    <ProtectedRoute requiredPermission="canManageAccounts">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Manage Employees</h1>
                <p className="text-muted-foreground">Manage employee information and records</p>
              </div>
            </div>
          </div>

          <EmployeeManagement />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
