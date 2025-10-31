'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeDataTab } from '@/components/payroll/EmployeeDataTab';
import { TaxesTab } from '@/components/payroll/TaxesTab';
import { PensionTab } from '@/components/payroll/PensionTab';

export function PayrollManagement() {
  return (
    <Tabs defaultValue="home" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="home">Home</TabsTrigger>
        <TabsTrigger value="employee-data">Employee Data</TabsTrigger>
        <TabsTrigger value="taxes">Taxes</TabsTrigger>
        <TabsTrigger value="pension">Pension</TabsTrigger>
      </TabsList>

      <TabsContent value="home">
        <Card>
          <CardContent className="p-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">Manage Payroll</h2>
              <p className="text-muted-foreground mb-6">
                Click on any of the above controls, to manage employee data, parameters of taxes & levies and parameters of employee benefits & allowance.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                <p className="text-lg text-muted-foreground">
                  Select a tab above to manage payroll data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="employee-data">
        <EmployeeDataTab />
      </TabsContent>

      <TabsContent value="taxes">
        <TaxesTab />
      </TabsContent>

      <TabsContent value="pension">
        <PensionTab />
      </TabsContent>
    </Tabs>
  );
}
