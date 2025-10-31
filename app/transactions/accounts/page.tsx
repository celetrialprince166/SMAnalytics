'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { SplitTransactionForm } from '@/components/transactions/SplitTransactionForm';
import { SplitTransactionList } from '@/components/transactions/SplitTransactionList';
import { SalesFormDesktop, SalesListDesktop } from '@/components/sales';
import { SalesRepresentativesForm } from '@/components/sales/SalesRepresentativesForm';
import { ProtectedRoute } from '@/components/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionBreadcrumb } from '@/components/SectionBreadcrumb';
import { Receipt, ShoppingCart, Home, Plus, List, Wallet, Users } from 'lucide-react';
import { PettyCashSplitForm } from '@/components/transactions/PettyCashSplitForm';

export default function TransactionsAccountsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [salesRefreshTrigger, setSalesRefreshTrigger] = useState(0);
  const [editingTransactionId, setEditingTransactionId] = useState<string | undefined>();
  const [editingSplitTransactionId, setEditingSplitTransactionId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('home');
  const [activeAccountsTab, setActiveAccountsTab] = useState('new');
  const [transactionType, setTransactionType] = useState<'single' | 'split' | 'petty'>('single');
  const [selectedSalesEntryId, setSelectedSalesEntryId] = useState<string | null>(null);
  const [activeSalesTab, setActiveSalesTab] = useState('form');


  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setEditingTransactionId(undefined);
    setEditingSplitTransactionId(undefined);
    setActiveAccountsTab('list');
  };

  const handleSalesSuccess = () => {
    setSalesRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectForRepresentatives = (salesId: string) => {
    setSelectedSalesEntryId(salesId);
    setActiveSalesTab('representatives');
  };

  const handleCancel = () => {
    setEditingTransactionId(undefined);
    setEditingSplitTransactionId(undefined);
  };

  const handleEdit = (transactionId: string) => {
    setEditingTransactionId(transactionId);
    setEditingSplitTransactionId(undefined);
    setTransactionType('single');
    setActiveAccountsTab('new');
  };

  const handleEditSplit = (splitTransactionId: string) => {
    setEditingSplitTransactionId(splitTransactionId);
    setEditingTransactionId(undefined);
    setTransactionType('split');
    setActiveAccountsTab('new');
  };

  const handleGenerateInvoice = (salesId: string) => {
    window.location.href = `/invoice?salesId=${salesId}`;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <SectionBreadcrumb
            items={[
              { label: 'Transactions', path: '/transactions' },
              { label: 'Accounts', path: '/transactions/accounts' },
            ]}
          />
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Accounts Transactions</h1>
                <p className="text-muted-foreground">
                  Manage account transfers, debits, credits, and sales transactions
                </p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="home">
                <Home className="h-4 w-4 mr-2" />
                Home
              </TabsTrigger>
              <TabsTrigger value="accounts">
                <Receipt className="h-4 w-4 mr-2" />
                Accounts
              </TabsTrigger>
              <TabsTrigger value="sales">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Sales
              </TabsTrigger>
            </TabsList>

            {/* Home Tab */}
            <TabsContent value="home" className="mt-6">
              <Card>
                <CardContent className="p-8">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg p-8">
                    <h2 className="text-2xl font-bold mb-4">Manage Accounts Transactions</h2>
                    <p className="text-muted-foreground mb-6">
                      Click on any of the above tabs to manage accounts transactions and related features.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                        <Receipt className="h-12 w-12 text-blue-500 mb-4" />
                        <h3 className="font-semibold mb-2">Account Transactions</h3>
                        <p className="text-sm text-muted-foreground">
                          Create single or split transactions between accounts with unified interface
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                        <ShoppingCart className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="font-semibold mb-2">Sales Transactions</h3>
                        <p className="text-sm text-muted-foreground">
                          Record sales, generate invoices, and track revenue
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="mt-6 space-y-6">
              <Tabs value={activeAccountsTab} onValueChange={setActiveAccountsTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Transaction
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4 mr-2" />
                    Transaction List
                  </TabsTrigger>
                </TabsList>

                {/* New Transaction Subtabs */}
                <TabsContent value="new" className="mt-6 space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">
                            {editingTransactionId ? 'Edit Transaction' : 
                             editingSplitTransactionId ? 'Edit Split Transaction' : 
                             'Create New Transaction'}
                          </h3>
                          
                          {/* Transaction Type Selector */}
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant={transactionType === 'single' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setTransactionType('single');
                                setEditingTransactionId(undefined);
                                setEditingSplitTransactionId(undefined);
                              }}
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              Single
                            </Button>
                            <Button
                              type="button"
                              variant={transactionType === 'split' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setTransactionType('split');
                                setEditingTransactionId(undefined);
                                setEditingSplitTransactionId(undefined);
                              }}
                            >
                              <List className="h-4 w-4 mr-2" />
                              Split
                            </Button>
                            <Button
                              type="button"
                              variant={transactionType === 'petty' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setTransactionType('petty');
                                setEditingTransactionId(undefined);
                                setEditingSplitTransactionId(undefined);
                              }}
                            >
                              <Wallet className="h-4 w-4 mr-2" />
                              Petty Cash
                            </Button>
                          </div>
                        </div>

                        {/* Transaction Forms */}
                        {transactionType === 'single' && (
                          <TransactionForm
                            transactionId={editingTransactionId}
                            onSuccess={handleSuccess}
                            onCancel={handleCancel}
                          />
                        )}
                        {transactionType === 'split' && (
                          <SplitTransactionForm
                            splitTransactionId={editingSplitTransactionId}
                            onSuccess={handleSuccess}
                            onCancel={handleCancel}
                          />
                        )}
                        {transactionType === 'petty' && (
                          <PettyCashSplitForm
                            onSuccess={handleSuccess}
                            onCancel={handleCancel}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Transaction List Subtabs */}
                <TabsContent value="list" className="mt-6 space-y-6">
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Regular Transactions</h3>
                        <TransactionList refreshTrigger={refreshTrigger} onEdit={handleEdit} />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Split Transactions</h3>
                        <SplitTransactionList refreshTrigger={refreshTrigger} onEdit={handleEditSplit} />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Sales Tab */}
            <TabsContent value="sales" className="mt-0">
              <Tabs value={activeSalesTab} onValueChange={setActiveSalesTab}>
                <TabsList className="bg-white border-b rounded-none">
                  <TabsTrigger value="form">New Sales Entry</TabsTrigger>
                  <TabsTrigger value="list">Sales Register</TabsTrigger>
                  <TabsTrigger value="representatives">
                    <Users className="h-4 w-4 mr-2" />
                    Representatives
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="form" className="mt-0">
                  <SalesFormDesktop 
                    onSuccess={handleSalesSuccess}
                    onSelectForRepresentatives={handleSelectForRepresentatives}
                  />
                </TabsContent>

                <TabsContent value="list" className="mt-0">
                  <SalesListDesktop
                    refreshTrigger={salesRefreshTrigger}
                    onGenerateInvoice={handleGenerateInvoice}
                    onSelectForRepresentatives={handleSelectForRepresentatives}
                  />
                </TabsContent>

                <TabsContent value="representatives" className="mt-0">
                  {selectedSalesEntryId ? (
                    <SalesRepresentativesForm salesEntryId={selectedSalesEntryId} />
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-2">
                          Select a sales entry from the Sales Register to assign representatives
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Representatives help track sales attribution and calculate commissions
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
