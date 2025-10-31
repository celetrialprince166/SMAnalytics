'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/auth';
import { FixedAssetsManagement } from '@/components/fixed-assets/FixedAssetsManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { SectionBreadcrumb } from '@/components/SectionBreadcrumb';
import { Building2, Home, Package, TrendingDown, DollarSign } from 'lucide-react';

export default function ManageFixedAssetsPage() {
  const [activeTab, setActiveTab] = useState('home');
  return (
    <ProtectedRoute requiredPermission="canManageAccounts">
      <DashboardLayout>
        <div className="p-6">
          <SectionBreadcrumb
            items={[
              { label: 'Manage', path: '/manage' },
              { label: 'Fixed Assets', path: '/manage/fixed-assets' },
            ]}
          />
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Manage Fixed Assets</h1>
                <p className="text-muted-foreground">Track and manage your fixed assets and depreciation</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="home">
                <Home className="h-4 w-4 mr-2" />
                Home
              </TabsTrigger>
              <TabsTrigger value="assets">
                <Package className="h-4 w-4 mr-2" />
                Fixed Assets
              </TabsTrigger>
            </TabsList>

            {/* Home Tab */}
            <TabsContent value="home" className="mt-6">
              <Card>
                <CardContent className="p-8">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-8">
                    <h2 className="text-2xl font-bold mb-4">Manage Fixed Assets</h2>
                    <p className="text-muted-foreground mb-6">
                      Click on any of the above controls to manage your fixed assets register and depreciation.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Package className="h-6 w-6 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold">Asset Register</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Track all your fixed assets with detailed information including acquisition cost, location, and status.
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <TrendingDown className="h-6 w-6 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold">Depreciation</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Calculate and track depreciation using various methods like straight-line and reducing balance.
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                            <DollarSign className="h-6 w-6 text-orange-600" />
                          </div>
                          <h3 className="text-lg font-semibold">Asset Valuation</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Monitor asset values, accumulated depreciation, and net book values for financial reporting.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="mt-6">
              <FixedAssetsManagement />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
