'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProductForm, ProductList } from '@/components/products';
import { ProtectedRoute } from '@/components/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package } from 'lucide-react';

export default function ProductsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingProductId, setEditingProductId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('list');

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab('list');
    setEditingProductId(undefined);
  };

  const handleEdit = (productId: string) => {
    setEditingProductId(productId);
    setActiveTab('form');
  };

  const handleCancel = () => {
    setEditingProductId(undefined);
    setActiveTab('list');
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Product Management</h1>
              <p className="text-muted-foreground">
                Manage your product catalog and inventory
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="list">Product List</TabsTrigger>
              <TabsTrigger value="form">
                {editingProductId ? 'Edit Product' : 'New Product'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <ProductList refreshTrigger={refreshTrigger} onEdit={handleEdit} />
            </TabsContent>

            <TabsContent value="form" className="space-y-4">
              <ProductForm
                productId={editingProductId}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
