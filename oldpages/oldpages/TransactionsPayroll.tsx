import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { SectionBreadcrumb } from "@/components/SectionBreadcrumb";
import transactionsPayrollHome from "@/assets/transactions-payroll-home.jpg";

const TransactionsPayroll = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <SectionBreadcrumb
          items={[
            { label: "Transactions", path: "/transactions" },
            { label: "Payroll", path: "/transactions/payroll" }
          ]}
        />
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Payroll & Salaries</h1>
          <p className="text-muted-foreground">Process employee salaries and commissions</p>
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
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-8">
                  <h2 className="text-2xl font-bold mb-4">Manage Payroll Transactions</h2>
                  <p className="text-muted-foreground mb-6">
                    Click on any of the above controls to manage payroll transactions and related features.
                  </p>
                  <img 
                    src={transactionsPayrollHome} 
                    alt="Payroll Transactions" 
                    className="rounded-lg shadow-lg w-full h-auto object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salaries">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Salary Processing</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Salary Period</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salaryDate">Salary date</Label>
                        <div className="relative">
                          <Input id="salaryDate" type="date" />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateProcessed">Date processed</Label>
                        <div className="relative">
                          <Input id="dateProcessed" type="date" readOnly className="bg-muted" />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Employee Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="empId">ID</Label>
                        <Select>
                          <SelectTrigger id="empId">
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="emp1">EMP001</SelectItem>
                            <SelectItem value="emp2">EMP002</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="entryDate">Entry date</Label>
                        <Input id="entryDate" type="date" readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Input id="status" readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currentLevel">Current level</Label>
                        <Input id="currentLevel" readOnly className="bg-muted" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-6">
                    <Card className="border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Personal Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" readOnly className="bg-muted" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input id="department" readOnly className="bg-muted" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nationality">Nationality</Label>
                            <Input id="nationality" readOnly className="bg-muted" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dependants">Dependants</Label>
                            <Input id="dependants" readOnly className="bg-muted" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="basicSalary">Basic salary</Label>
                            <Input id="basicSalary" readOnly className="bg-muted" placeholder="0.00" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Bank Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="salaryHolding">Salary holding</Label>
                          <Input id="salaryHolding" readOnly className="bg-muted" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="branch">Branch</Label>
                            <Input id="branch" readOnly className="bg-muted" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="accountNo">Account no.</Label>
                            <Input id="accountNo" readOnly className="bg-muted" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Allowances</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="rent">Rent</Label>
                            <Input id="rent" type="number" placeholder="0.00" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="utility">Utility</Label>
                            <Input id="utility" type="number" placeholder="0.00" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="transportation">Transportation</Label>
                            <Input id="transportation" type="number" placeholder="0.00" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="eoyBonus">EoY bonus</Label>
                            <Input id="eoyBonus" type="number" placeholder="0.00" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Commissions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="commission">Commission</Label>
                            <Input id="commission" type="number" placeholder="0.00" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="salesTarget">Sales target</Label>
                            <Input id="salesTarget" type="number" placeholder="0.00" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Staff loan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="staffLoan">Loan deduction</Label>
                          <Input id="staffLoan" type="number" placeholder="0.00" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Button onClick={() => toast.success("New salary entry created")}>New</Button>
                  <Button variant="outline" onClick={() => toast.success("Salary calculated")}>Calculate</Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white">
                    View Output
                  </Button>
                  <Button variant="secondary" className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white">
                    Run Salaries
                  </Button>
                  <Button variant="secondary" className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white">
                    Payments
                  </Button>
                  <Button variant="secondary" className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white">
                    View Payslip
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Commission Processing</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Employee Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Select>
                        <SelectTrigger id="employeeId">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emp1">EMP001</SelectItem>
                          <SelectItem value="emp2">EMP002</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="empName">Name</Label>
                      <Input id="empName" readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="asAt">As at ...</Label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input id="asAt" type="date" />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="applyWithholding" />
                          <Label htmlFor="applyWithholding" className="whitespace-nowrap">Apply Withholding Tax</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Processing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="processDate">Process date</Label>
                        <div className="relative">
                          <Input id="processDate" type="date" />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commissionCode">Commission code</Label>
                        <Select>
                          <SelectTrigger id="commissionCode">
                            <SelectValue placeholder="Select code" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="code1">Code 1</SelectItem>
                            <SelectItem value="code2">Code 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">As Sales Resource ...</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="salesTarget2">Sales target</Label>
                        <Input id="salesTarget2" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commissionRate">Commission rate</Label>
                        <Input id="commissionRate" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="relevantSales">Relevant sales</Label>
                        <Input id="relevantSales" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="effectiveSales">Effective sales</Label>
                        <Input id="effectiveSales" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commissionSales">Commission</Label>
                        <Input id="commissionSales" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">As Support Resource ...</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="contractLimit">Contract limit</Label>
                        <Input id="contractLimit" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contractRate">Contract rate</Label>
                        <Input id="contractRate" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="relevantSalesSupport">Relevant sales</Label>
                        <Input id="relevantSalesSupport" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="effectiveSalesSupport">Effective sales</Label>
                        <Input id="effectiveSalesSupport" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commissionSupport">Commission</Label>
                        <Input id="commissionSupport" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalRelevant">Total relevant sales</Label>
                        <Input id="totalRelevant" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalEffective">Total effective sales</Label>
                        <Input id="totalEffective" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalExpected">Total commission expected</Label>
                        <Input id="totalExpected" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalProcessed">Total commission processed</Label>
                        <Input id="totalProcessed" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalPaid">Total commission paid</Label>
                        <Input id="totalPaid" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Overall</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-48">
                      <Input type="number" readOnly className="bg-muted text-center text-2xl" placeholder="0.00" />
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Available</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-48">
                      <Input type="number" readOnly className="bg-muted text-center text-2xl" placeholder="0.00" />
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => toast.success("Commission processed")}>Process</Button>
                  <Button variant="outline" onClick={() => toast.success("Commission updated")}>Update</Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white">
                    View Schedule
                  </Button>
                  <Button variant="secondary" className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white">
                    Settlements
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TransactionsPayroll;