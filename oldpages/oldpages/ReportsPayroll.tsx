import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import { SectionBreadcrumb } from "@/components/SectionBreadcrumb";
import reportsPayrollHome from "@/assets/reports-payroll-home.jpg";

const ReportsPayroll = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SectionBreadcrumb
          items={[
            { label: "Reports", path: "/reports" },
            { label: "Payroll Reports", path: "/reports/payroll" }
          ]}
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Reports</h1>
          <p className="text-muted-foreground mt-2">
            Generate comprehensive payroll and employee reports
          </p>
        </div>

        <Tabs defaultValue="home" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="salaries-register">Salaries Register</TabsTrigger>
            <TabsTrigger value="employee-salaries">Employee Salaries</TabsTrigger>
            <TabsTrigger value="employee-register">Employee Register</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-8">
                  <h2 className="text-2xl font-bold mb-4">Payroll Reports</h2>
                  <p className="text-muted-foreground mb-6">
                    Click on any of the above controls to run various forms of reports on payroll and employees.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <img 
                      src={reportsPayrollHome} 
                      alt="Payroll Reports" 
                      className="rounded-lg shadow-lg w-full h-auto object-cover"
                    />
                    <div className="flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <Users className="h-16 w-16 mx-auto text-primary" />
                        <h3 className="text-xl font-semibold">Employee & Salary Reports</h3>
                        <p className="text-sm text-muted-foreground">
                          Generate salary registers, employee data reports, and commission statements
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salaries-register" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Salary Register</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Input type="date" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="basic" />
                      <Label htmlFor="basic">Basic</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="commissions" />
                      <Label htmlFor="commissions">Commissions</Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="allowances" />
                      <Label htmlFor="allowances">Allowances</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="staff-loan" />
                      <Label htmlFor="staff-loan">Staff Loan</Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="income-tax" />
                      <Label htmlFor="income-tax">Income Tax</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="ssnit" />
                      <Label htmlFor="ssnit">SSNIT</Label>
                    </div>
                  </div>
                </div>

                <Button className="w-full">Run</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employee-salaries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employee Salaries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select mode</Label>
                  <RadioGroup defaultValue="payslip">
                    <div className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="payslip" id="payslip" />
                        <Label htmlFor="payslip">Payslip</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="records" id="records" />
                        <Label htmlFor="records">Records</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emp1">Employee 1</SelectItem>
                      <SelectItem value="emp2">Employee 2</SelectItem>
                      <SelectItem value="emp3">Employee 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Input type="date" />
                  </div>
                </div>

                <div className="space-y-3">
                  <RadioGroup defaultValue="earnings">
                    <div className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="earnings" id="earnings" />
                        <Label htmlFor="earnings">Earnings</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="deductions" id="deductions" />
                        <Label htmlFor="deductions">Deductions</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <Button className="w-full">Run</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employee-register" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employee Register</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup defaultValue="personal">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="personal" id="personal" />
                      <Label htmlFor="personal">Personal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="official" id="official" />
                      <Label htmlFor="official">Official</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="auxiliary" id="auxiliary" />
                      <Label htmlFor="auxiliary">Auxiliary</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sales-support" id="sales-support" />
                      <Label htmlFor="sales-support">Sales Support</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="staff-loan" id="staff-loan-register" />
                      <Label htmlFor="staff-loan-register">Staff Loan</Label>
                    </div>
                  </div>
                </RadioGroup>

                <Button className="w-full">Run</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commissions Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Input type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ALL</SelectItem>
                      <SelectItem value="emp1">Employee 1</SelectItem>
                      <SelectItem value="emp2">Employee 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <RadioGroup defaultValue="sales">
                    <div className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sales" id="sales-resource" />
                        <Label htmlFor="sales-resource">Sales resource</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="support" id="support-resource" />
                        <Label htmlFor="support-resource">Support resource</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="comprehensive" id="comprehensive" />
                        <Label htmlFor="comprehensive">Comprehensive</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <Button className="w-full">Run</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPayroll;
