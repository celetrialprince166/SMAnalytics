'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AccountForm, AccountList } from '@/components/accounts';
import { TaxationForm } from '@/components/taxation/TaxationForm';
import { ServicesManagement } from '@/components/services/ServicesManagement';
import { ClientsManagement } from '@/components/clients/ClientsManagement';
import { ProtectedRoute } from '@/components/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { SectionBreadcrumb } from '@/components/SectionBreadcrumb';
import { Building, Home, Users, FileText, CreditCard } from 'lucide-react';

export default function ManageAccountsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingAccountId, setEditingAccountId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('home');
  const [activeAccountTab, setActiveAccountTab] = useState('list');

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setEditingAccountId(undefined);
    setActiveAccountTab('list');
  };

  const handleEdit = (accountId: string) => {
    setEditingAccountId(accountId);
    setActiveAccountTab('form');
  };

  const handleDelete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setEditingAccountId(undefined);
    setActiveAccountTab('list');
  };

  return (
    <ProtectedRoute requiredPermission="canManageAccounts">
      <DashboardLayout>
        <div className="p-6">
          <SectionBreadcrumb
            items={[
              { label: 'Manage', path: '/manage' },
              { label: 'Accounts', path: '/manage/accounts' },
            ]}
          />
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Manage Accounts</h1>
                <p className="text-muted-foreground">Create and manage your chart of accounts</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="home">
                <Home className="h-4 w-4 mr-2" />
                Home
              </TabsTrigger>
              <TabsTrigger value="accounts">
                <Building className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger value="services">
                <FileText className="h-4 w-4 mr-2" />
                Services
              </TabsTrigger>
              <TabsTrigger value="taxation">
                <CreditCard className="h-4 w-4 mr-2" />
                Taxation
              </TabsTrigger>
              <TabsTrigger value="clients">
                <Users className="h-4 w-4 mr-2" />
                Clients
              </TabsTrigger>
            </TabsList>

            {/* Home Tab */}
            <TabsContent value="home" className="mt-6">
              <Card>
                <CardContent className="p-8">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg p-8">
                    <h2 className="text-2xl font-bold mb-4">Manage Accounts</h2>
                    <p className="text-muted-foreground mb-6">
                      Click on any of the above controls to manage accounts, services, taxation, and clients.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Building className="h-6 w-6 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold">Chart of Accounts</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create and manage your primary, secondary, and holder accounts for proper financial organization.
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <FileText className="h-6 w-6 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold">Services Management</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Define service lines and individual services offered by your organization.
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                            <CreditCard className="h-6 w-6 text-orange-600" />
                          </div>
                          <h3 className="text-lg font-semibold">Taxation Settings</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure VAT rates, withholding tax rates, and other tax parameters.
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Users className="h-6 w-6 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-semibold">Client Management</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Manage client information, contacts, and business relationships.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accounts" className="mt-6">
              <Tabs value={activeAccountTab} onValueChange={setActiveAccountTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="list">Account List</TabsTrigger>
                  <TabsTrigger value="form">
                    {editingAccountId ? 'Edit Account' : 'New Account'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="mt-6">
                  <AccountList
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    refreshTrigger={refreshTrigger}
                  />
                </TabsContent>

                <TabsContent value="form" className="mt-6">
                  <AccountForm
                    accountId={editingAccountId}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="services" className="mt-6">
              <ServicesManagement />
            </TabsContent>

            <TabsContent value="taxation" className="mt-6">
              <TaxationForm />
            </TabsContent>

            <TabsContent value="clients" className="mt-6">
              <ClientsManagement />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
