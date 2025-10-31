'use client'

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Package, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Reports() {
    const router = useRouter();

    const reportCategories = [
        {
            title: "Accounts Reports",
            description: "Financial accounts, transactions, balances, and sales reports",
            icon: FileText,
            path: "/reports/accounts",
            gradient: "from-blue-500/10 to-cyan-500/10"
        },
        {
            title: "Fixed Assets Register",
            description: "Asset classes and depreciation reports",
            icon: Package,
            path: "/reports/fixed-assets",
            gradient: "from-purple-500/10 to-pink-500/10"
        },
        {
            title: "Payroll Reports",
            description: "Salary registers, employee data, and commission reports",
            icon: Users,
            path: "/reports/payroll",
            gradient: "from-green-500/10 to-emerald-500/10"
        }
    ];

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground mt-2">
                        Generate and view comprehensive reports for your business
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reportCategories.map((category) => {
                        const Icon = category.icon;
                        return (
                            <Card
                                key={category.path}
                                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                                onClick={() => router.push(category.path)}
                            >
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-3`}>
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle>{category.title}</CardTitle>
                                    <CardDescription>{category.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground">
                                        Click to view reports →
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
