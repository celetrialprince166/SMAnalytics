'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { SectionBreadcrumb } from '@/components/SectionBreadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { FixedAssetDisposalForm } from '@/components/fixed-assets/FixedAssetDisposalForm';

export default function TransactionsFixedAssetsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <SectionBreadcrumb
          items={[
            { label: 'Transactions', path: '/transactions' },
            { label: 'Fixed Assets', path: '/transactions/fixed-assets' },
          ]}
        />
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Fixed Assets Disposals</h1>
          <p className="text-muted-foreground">
            Record and manage disposal of fixed assets
          </p>
        </div>

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="disposals">Fixed Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <Card>
              <CardContent className="p-8">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    Disposal of Fixed Assets
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Click on any of the above control, to manage fixed assets
                    disposals and related transactions.
                  </p>
                  <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h3 className="font-semibold mb-4">Key Features:</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Select assets from the fixed assets register</li>
                      <li>• View asset details and current valuation</li>
                      <li>• Record disposal date and disposal value</li>
                      <li>• Calculate gain or loss on disposal</li>
                      <li>• Automatically update accounting records</li>
                      <li>• Track disposal history</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disposals">
            <FixedAssetDisposalForm />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
