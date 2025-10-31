'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SalesForm, SalesList } from '@/components/sales';
import { ProtectedRoute } from '@/components/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart } from 'lucide-react';

export default function SalesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('list');

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab('list');
  };

  const handleGenerateInvoice = (salesId: string) => {
    // Navigate to invoice page with sales ID
    window.location.href = `/invoice?salesId=${salesId}`;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Sales Management</h1>
              <p className="text-muted-foreground">
                Record sales transactions and generate invoices
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="list">Sales Register</TabsTrigger>
              <TabsTrigger value="form">New Sales Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <SalesList
                refreshTrigger={refreshTrigger}
                onGenerateInvoice={handleGenerateInvoice}
              />
            </TabsContent>

            <TabsContent value="form" className="space-y-4">
              <SalesForm onSuccess={handleSuccess} />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
