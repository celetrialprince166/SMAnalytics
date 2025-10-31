import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, CreditCard, Users, Wallet, RefreshCw } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const Dashboard = () => {
  const [showPrevious, setShowPrevious] = useState(false);

  // Sample data for charts
  const salesData = [
    { month: "Apr 25", value: 0 },
    { month: "May 25", value: 0 },
    { month: "Jun 25", value: 110000 },
    { month: "Jul 25", value: 0 },
    { month: "Aug 25", value: 0 },
    { month: "Sep 25", value: 0 },
  ];

  const costOfSalesData = [
    { month: "Apr 25", value: 0 },
    { month: "May 25", value: 0 },
    { month: "Jun 25", value: 0 },
    { month: "Jul 25", value: 0 },
    { month: "Aug 25", value: 850 },
    { month: "Sep 25", value: 0 },
  ];

  const operatingExpensesData = [
    { month: "Apr 25", value: 200 },
    { month: "May 25", value: 300 },
    { month: "Jun 25", value: 550 },
    { month: "Jul 25", value: 550 },
    { month: "Aug 25", value: 580 },
    { month: "Sep 25", value: 0 },
  ];

  const netProfitData = [
    { month: "Apr 25", value: -20000 },
    { month: "May 25", value: 0 },
    { month: "Jun 25", value: 0 },
    { month: "Jul 25", value: 110000 },
    { month: "Aug 25", value: 0 },
    { month: "Sep 25", value: 0 },
  ];

  const cashBankData = [
    { month: "Apr 25", value: -15000 },
    { month: "May 25", value: -15000 },
    { month: "Jun 25", value: 80000 },
    { month: "Jul 25", value: 85000 },
    { month: "Aug 25", value: 80000 },
    { month: "Sep 25", value: 85000 },
  ];

  const inventoriesData = [
    { month: "Apr 25", value: 0.2 },
    { month: "May 25", value: 0.3 },
    { month: "Jun 25", value: 0.1 },
    { month: "Jul 25", value: 0.2 },
    { month: "Aug 25", value: 0.3 },
    { month: "Sep 25", value: 0.1 },
  ];

  const accountsReceivableData = [
    { month: "Apr 25", value: 0 },
    { month: "May 25", value: 0 },
    { month: "Jun 25", value: 80000 },
    { month: "Jul 25", value: 95000 },
    { month: "Aug 25", value: 110000 },
    { month: "Sep 25", value: 120000 },
  ];

  const accountsPayableData = [
    { month: "Apr 25", value: 0 },
    { month: "May 25", value: 0 },
    { month: "Jun 25", value: 0 },
    { month: "Jul 25", value: 0 },
    { month: "Aug 25", value: 320 },
    { month: "Sep 25", value: 340 },
  ];

  const metrics = [
    {
      title: "Sales",
      value: "GHC 110,000",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      title: "Cost of Sales",
      value: "GHC 850",
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/10",
    },
    {
      title: "Operating Expenses",
      value: "GHC 2,180",
      change: "-3.1%",
      trend: "down",
      icon: CreditCard,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10",
    },
    {
      title: "Net Profit",
      value: "GHC 107,020",
      change: "+18.2%",
      trend: "up",
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/10 to-emerald-500/10",
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{payload[0].payload.month}</p>
          <p className="text-sm text-primary">
            GHC {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = (data: any[], title: string, color: string) => (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.value < 0 ? "#ef4444" : color} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Financial Overview & Key Metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="previous-month"
                checked={showPrevious}
                onCheckedChange={setShowPrevious}
              />
              <Label htmlFor="previous-month" className="text-sm">Previous month</Label>
            </div>
            <Button size="sm" variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown;
            
            return (
              <Card key={metric.title} className="overflow-hidden hover:shadow-xl transition-all border-0">
                <div className={`bg-gradient-to-br ${metric.bgGradient} p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.gradient}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      metric.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      <TrendIcon className="h-4 w-4" />
                      {metric.change}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
                    <p className="text-3xl font-bold">{metric.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash & Bank</CardTitle>
              <Wallet className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GHC 85,000</div>
              <p className="text-xs text-muted-foreground mt-1">Current balance</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventories</CardTitle>
              <Package className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GHC 1.20</div>
              <p className="text-xs text-muted-foreground mt-1">Stock value</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accounts Receivable</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GHC 120,000</div>
              <p className="text-xs text-muted-foreground mt-1">Outstanding</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accounts Payable</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GHC 340</div>
              <p className="text-xs text-muted-foreground mt-1">To be paid</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderChart(salesData, "Sales", "#3b82f6")}
          {renderChart(costOfSalesData, "Cost of Sales", "#f59e0b")}
          {renderChart(operatingExpensesData, "Operating Expenses", "#a855f7")}
          {renderChart(netProfitData, "Net Profit", "#10b981")}
          {renderChart(cashBankData, "Cash & Bank", "#06b6d4")}
          {renderChart(inventoriesData, "Inventories", "#8b5cf6")}
          {renderChart(accountsReceivableData, "Accounts Receivable", "#22c55e")}
          {renderChart(accountsPayableData, "Accounts Payable", "#f97316")}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
