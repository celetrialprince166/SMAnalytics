import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Manage = () => {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Accounts",
      description: "Manage accounts, taxation, services, and clients",
      icon: Building,
      path: "/manage/accounts",
    },
    {
      title: "Fixed Assets",
      description: "Manage fixed assets register and depreciation",
      icon: Package,
      path: "/manage/fixed-assets",
    },
    {
      title: "Payroll",
      description: "Manage employee data, taxes, and pension",
      icon: Users,
      path: "/manage/payroll",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Manage</h1>
          <p className="text-muted-foreground">Choose a module to manage</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card
              key={module.path}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(module.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <module.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{module.title}</CardTitle>
                </div>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Manage;
