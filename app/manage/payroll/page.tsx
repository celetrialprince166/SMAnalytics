'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/auth';
import { PayrollManagement } from '@/components/payroll/PayrollManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { SectionBreadcrumb } from '@/components/SectionBreadcrumb';
import { Users, Home, UserCheck, CreditCard, PiggyBank } from 'lucide-react';

export default function ManagePayrollPage() {
  const [activeTab, setActiveTab] = useState('home');
  return (
    <ProtectedRoute requiredPermission="canManageAccounts">
      <DashboardLayout>
        <div className="p-6">
          <SectionBreadcrumb
            items={[
              { label: 'Manage', path: '/manage' },
              { label: 'Payroll', path: '/manage/payroll' },
            ]}
          />
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Manage Payroll</h1>
                <p className="text-muted-foreground">Manage employee data, taxes & pension</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="home">
                <Home className="h-4 w-4 mr-2" />
                Home
              </TabsTrigger>
              <TabsTrigger value="payroll">
                <Users className="h-4 w-4 mr-2" />
                Payroll Management
              </TabsTrigger>
            </TabsList>

            {/* Home Tab */}
            <TabsContent value="home" className="mt-6">
              <Card>
                <CardContent className="p-8">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-8">
                    <h2 className="text-2xl font-bold mb-4">Manage Payroll</h2>
                    <p className="text-muted-foreground mb-6">
                      Click on any of the above controls to manage employee data, taxes & pension.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <UserCheck className="h-6 w-6 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold">Employee Data</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Manage employee information, job positions, salary structures, and employment details.
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                            <CreditCard className="h-6 w-6 text-red-600" />
                          </div>
                          <h3 className="text-lg font-semibold">Taxes & Levies</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure tax rates, levies, and deductions for accurate payroll calculations.
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <PiggyBank className="h-6 w-6 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold">Benefits & Allowances</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Set up employee benefits, allowances, and pension contributions for comprehensive payroll management.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payroll" className="mt-6">
              <PayrollManagement />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
