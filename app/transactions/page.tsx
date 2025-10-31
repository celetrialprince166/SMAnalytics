'use client'

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { FileText, Building2, Wallet } from "lucide-react";

export default function Transactions() {
  const router = useRouter();

  const modules = [
    {
      title: "Accounts Transactions",
      description: "Manage account transfers, debits, credits, and sales transactions",
      icon: FileText,
      path: "/transactions/accounts",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Fixed Assets Disposals",
      description: "Record and manage disposal of fixed assets and depreciation",
      icon: Building2,
      path: "/transactions/fixed-assets",
      color: "from-amber-500 to-amber-600"
    },
    {
      title: "Payroll & Salaries",
      description: "Process employee salaries, commissions, and payroll transactions",
      icon: Wallet,
      path: "/transactions/payroll",
      color: "from-green-500 to-green-600"
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Process and manage all financial transactions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.path}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(module.path)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
