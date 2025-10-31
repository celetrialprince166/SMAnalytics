import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SectionBreadcrumb } from "@/components/SectionBreadcrumb";
import reportsAccountsHome from "@/assets/reports-accounts-home.jpg";

import { FileText } from "lucide-react";

const ReportsAccounts = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SectionBreadcrumb
          items={[
            { label: "Reports", path: "/reports" },
            { label: "Accounts Reports", path: "/reports/accounts" }
          ]}
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts Reports</h1>
          <p className="text-muted-foreground mt-2">
            Generate comprehensive financial and accounting reports
          </p>
        </div>

        <Tabs defaultValue="home" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="financial">Financial Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Accounts Transactions</TabsTrigger>
            <TabsTrigger value="balances">Account Balances</TabsTrigger>
            <TabsTrigger value="sales">Sales Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg p-8">
                  <h2 className="text-2xl font-bold mb-4">Accounts Reports</h2>
                  <p className="text-muted-foreground mb-6">
                    Click on any of the above controls to run various forms of reports on financial accounts.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <img 
                      src={reportsAccountsHome} 
                      alt="Financial Planning" 
                      className="rounded-lg shadow-lg w-full h-auto object-cover"
                    />
                    <div className="flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <FileText className="h-16 w-16 mx-auto text-primary" />
                        <h3 className="text-xl font-semibold">Comprehensive Reports</h3>
                        <p className="text-sm text-muted-foreground">
                          Generate detailed financial statements, transaction analysis, and balance reports
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Accounting Reports & Statements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Select Mode</Label>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="monthly" />
                      <Label htmlFor="monthly">Monthly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="quarterly" />
                      <Label htmlFor="quarterly">Quarterly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="semi-annually" />
                      <Label htmlFor="semi-annually">Semi-annually</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="annually" />
                      <Label htmlFor="annually">Annually</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Input type="date" defaultValue="2025-10-01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Periods</Label>
                    <Select defaultValue="2">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-base font-semibold mb-4">Account Report</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Select Primary Account</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="non-current">Non-current Assets</SelectItem>
                          <SelectItem value="current">Current Assets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="self-end">Run</Button>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label>Select Secondary Account</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assets">Assets</SelectItem>
                        <SelectItem value="liabilities">Liabilities</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-base font-semibold mb-4">Financial Statements</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select the relevant mode and period above to run
                  </p>
                  <Button>Run</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Petty Cash Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" defaultValue="2025-01-01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Input value="January" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input value="2025" readOnly />
                  </div>
                </div>
                <Button>Run</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Transactions Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-semibold mb-3 block">Select Period</Label>
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
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select Account</Label>
                  <div className="space-y-2">
                    <Label>Primary Account</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non-current">Non-current Assets</SelectItem>
                        <SelectItem value="current">Current Assets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Account</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assets">Assets</SelectItem>
                        <SelectItem value="liabilities">Liabilities</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Holder Account</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="holder1">Holder 1</SelectItem>
                        <SelectItem value="holder2">Holder 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button>Run</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Statement of Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-semibold mb-3 block">Select Period</Label>
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
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select Account</Label>
                  <div className="space-y-2">
                    <Label>Primary account</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non-current">Non-current Assets</SelectItem>
                        <SelectItem value="current">Current Assets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary account</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assets">Assets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Holder Account</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="holder1">Holder 1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button>Run</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ageing Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current date</Label>
                  <Input type="date" defaultValue="2025-10-02" />
                </div>
                <Button>Run</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trial Balance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>On ...</Label>
                  <RadioGroup defaultValue="secondary">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="secondary" id="secondary" />
                      <Label htmlFor="secondary">Secondary accounts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="holder" id="holder" />
                      <Label htmlFor="holder">Holder accounts</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>As at ...</Label>
                  <Input type="date" defaultValue="2025-10-31" />
                </div>

                <Button>Run</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1">G-Levels</Button>
              <Button variant="outline" className="flex-1">P-Levels</Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sales Levels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select Mode</Label>
                  <div className="space-y-2">
                    <RadioGroup defaultValue="service-mode">
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="service-mode" id="service-mode" />
                          <Label htmlFor="service-mode">Service mode</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="service-lines" id="service-lines" />
                          <Label htmlFor="service-lines">Service lines</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="services" id="services" />
                          <Label htmlFor="services">Services</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex gap-6 mt-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="monthly-sales" />
                      <Label htmlFor="monthly-sales">Monthly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="quarterly-sales" />
                      <Label htmlFor="quarterly-sales">Quarterly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="semi-annually-sales" />
                      <Label htmlFor="semi-annually-sales">Semi-annually</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="annually-sales" defaultChecked />
                      <Label htmlFor="annually-sales">Annually</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">Select Period</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>From</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Periods</Label>
                      <Select defaultValue="2">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button>Run</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Movements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select service line</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="analytics-consulting" />
                      <Label htmlFor="analytics-consulting">Analytics Consulting</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="analytics-solutions" />
                      <Label htmlFor="analytics-solutions">Analytics Solutions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="analytics-training" />
                      <Label htmlFor="analytics-training">Analytics Training</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="all" />
                      <Label htmlFor="all">All</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select product</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product1">Product 1</SelectItem>
                      <SelectItem value="product2">Product 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Date mode</Label>
                  <RadioGroup defaultValue="periodic">
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="periodic" id="periodic" />
                        <Label htmlFor="periodic">Periodic</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="on" id="on" />
                        <Label htmlFor="on">On</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="as-at" id="as-at" />
                        <Label htmlFor="as-at">As at</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" />
                </div>

                <Button>Run</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReportsAccounts;
