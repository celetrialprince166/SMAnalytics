'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { SectionBreadcrumb } from '@/components/SectionBreadcrumb';
import { FileText } from 'lucide-react';
import { FinancialAccountsTab } from '@/components/reports/FinancialAccountsTab';
import { AccountsTransactionsTab } from '@/components/reports/AccountsTransactionsTab';
import { AccountBalancesTab } from '@/components/reports/AccountBalancesTab';
import { SalesReportsTab } from '@/components/reports/SalesReportsTab';

export default function ReportsAccountsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <SectionBreadcrumb
          items={[
            { label: 'Reports', path: '/reports' },
            { label: 'Accounts Reports', path: '/reports/accounts' },
          ]}
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts Reports</h1>
          <p className="text-muted-foreground mt-2">
            Generate comprehensive financial and accounting reports
          </p>
        </div>

        <Tabs defaultValue="home" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="financial">Financial Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Accounts Transactions</TabsTrigger>
            <TabsTrigger value="balances">Account Balances</TabsTrigger>
            <TabsTrigger value="sales">Sales Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg p-8">
                  <h2 className="text-2xl font-bold mb-4">Accounts Reports</h2>
                  <p className="text-muted-foreground mb-6">
                    Click on any of the above controls to run various forms of reports on financial accounts.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                      <h3 className="text-xl font-semibold mb-3">Financial Reports</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Generate balance sheets, income statements, cash flow statements, and trial balances
                      </p>
                      <ul className="text-sm space-y-2">
                        <li>• Balance Sheet</li>
                        <li>• Income Statement</li>
                        <li>• Cash Flow Statement</li>
                        <li>• Trial Balance</li>
                      </ul>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <FileText className="h-16 w-16 mx-auto text-primary" />
                        <h3 className="text-xl font-semibold">Comprehensive Reports</h3>
                        <p className="text-sm text-muted-foreground">
                          Generate detailed financial statements, transaction analysis, and balance reports
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <FinancialAccountsTab />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <AccountsTransactionsTab />
          </TabsContent>

          <TabsContent value="balances" className="space-y-4">
            <AccountBalancesTab />
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <SalesReportsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
