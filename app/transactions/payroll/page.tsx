'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { SectionBreadcrumb } from '@/components/SectionBreadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { PayrollSalariesForm } from '@/components/payroll/PayrollSalariesForm';
import { PayrollCommissionsForm } from '@/components/payroll/PayrollCommissionsForm';

export default function TransactionsPayrollPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <SectionBreadcrumb
          items={[
            { label: 'Transactions', path: '/transactions' },
            { label: 'Payroll', path: '/transactions/payroll' },
          ]}
        />
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Payroll Transactions</h1>
          <p className="text-muted-foreground">
            Process salaries and commissions for employees
          </p>
        </div>

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="salaries">Salaries</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <Card>
              <CardContent className="p-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    Payroll Management
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Click on any of the above tabs to process employee salaries,
                    calculate commissions, and manage payroll transactions.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                      <h3 className="font-semibold mb-2">Salaries</h3>
                      <p className="text-sm text-muted-foreground">
                        Process employee salaries, calculate deductions, and
                        generate payslips for monthly payroll.
                      </p>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                      <h3 className="font-semibold mb-2">Commissions</h3>
                      <p className="text-sm text-muted-foreground">
                        Calculate and process sales commissions based on
                        performance and targets.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salaries">
            <PayrollSalariesForm />
          </TabsContent>

          <TabsContent value="commissions">
            <PayrollCommissionsForm />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
