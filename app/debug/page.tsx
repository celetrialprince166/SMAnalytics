'use client';

/**
 * Debug Page - View stored data
 * Only for development/testing
 */

import { useState, useEffect } from 'react';
import { storageService } from '@/lib/storage/LocalStorageService';
import { accountService } from '@/lib/services/AccountService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, RefreshCw, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function DebugPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const appData = storageService.loadData();
    setData(appData);
  };

  const clearData = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      storageService.clearData();
      loadData();
    }
  };

  const seedSecondaryAccounts = async () => {
    try {
      const primaryAccounts = await accountService.getPrimaryAccounts();
      
      // Assets secondary accounts
      const assets = primaryAccounts.find(p => p.name === 'Assets');
      if (assets) {
        await accountService.createSecondaryAccount(
          assets.id,
          'Current Assets',
          'Assets that can be converted to cash within one year'
        );
        await accountService.createSecondaryAccount(
          assets.id,
          'Fixed Assets',
          'Long-term tangible assets'
        );
      }
      
      // Liabilities secondary accounts
      const liabilities = primaryAccounts.find(p => p.name === 'Liabilities');
      if (liabilities) {
        await accountService.createSecondaryAccount(
          liabilities.id,
          'Current Liabilities',
          'Obligations due within one year'
        );
        await accountService.createSecondaryAccount(
          liabilities.id,
          'Long-term Liabilities',
          'Obligations due after one year'
        );
      }
      
      // Equity secondary accounts
      const equity = primaryAccounts.find(p => p.name === 'Equity');
      if (equity) {
        await accountService.createSecondaryAccount(
          equity.id,
          'Capital',
          'Owner\'s capital contributions'
        );
        await accountService.createSecondaryAccount(
          equity.id,
          'Retained Earnings',
          'Accumulated profits'
        );
      }
      
      // Revenue secondary accounts
      const revenue = primaryAccounts.find(p => p.name === 'Revenue');
      if (revenue) {
        await accountService.createSecondaryAccount(
          revenue.id,
          'Sales Revenue',
          'Income from sales'
        );
        await accountService.createSecondaryAccount(
          revenue.id,
          'Other Income',
          'Non-operating income'
        );
      }
      
      // Expenses secondary accounts
      const expenses = primaryAccounts.find(p => p.name === 'Expenses');
      if (expenses) {
        await accountService.createSecondaryAccount(
          expenses.id,
          'Operating Expenses',
          'Day-to-day business expenses'
        );
        await accountService.createSecondaryAccount(
          expenses.id,
          'Cost of Sales',
          'Direct costs of goods sold'
        );
      }
      
      toast.success('Secondary accounts seeded successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to seed secondary accounts');
    }
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Debug Data Viewer</h1>
              <p className="text-muted-foreground">View and manage stored data</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={seedSecondaryAccounts} variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Seed Secondary Accounts
            </Button>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={clearData} variant="destructive">
              Clear All Data
            </Button>
          </div>
        </div>

        {data && (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Users ({data.users?.length || 0})</CardTitle>
                <CardDescription>Registered users in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(data.users, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access Codes ({data.accessCodes?.length || 0})</CardTitle>
                <CardDescription>Available access codes for registration</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(data.accessCodes, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accounts</CardTitle>
                <CardDescription>Chart of accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Primary ({data.accounts?.primary?.length || 0})</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                      {JSON.stringify(data.accounts?.primary, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Secondary ({data.accounts?.secondary?.length || 0})</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                      {JSON.stringify(data.accounts?.secondary, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Holder ({data.accounts?.holder?.length || 0})</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                      {JSON.stringify(data.accounts?.holder, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>System metadata and counters</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(data.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
