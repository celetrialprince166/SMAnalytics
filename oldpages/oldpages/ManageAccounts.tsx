import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SectionBreadcrumb } from "@/components/SectionBreadcrumb";
import manageAccountsHome from "@/assets/manage-accounts-home.jpg";

const ManageAccounts = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <SectionBreadcrumb
          items={[
            { label: "Manage", path: "/manage" },
            { label: "Accounts", path: "/manage/accounts" }
          ]}
        />
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Manage Accounts</h1>
          <p className="text-muted-foreground">Manage accounts, taxation, services & clients</p>
        </div>

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="taxation">Taxation</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <Card>
              <CardContent className="p-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg p-8">
                  <h2 className="text-2xl font-bold mb-4">Manage Accounts & More</h2>
                  <p className="text-muted-foreground mb-6">
                    Click on any of the above control, to manage accounts and related features.
                  </p>
                  <img 
                    src={manageAccountsHome} 
                    alt="Manage Accounts" 
                    className="rounded-lg shadow-lg w-full h-auto object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryAccount">Select Primary Account</Label>
                    <Select>
                      <SelectTrigger id="primaryAccount">
                        <SelectValue placeholder="Select primary account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non-current-assets">Non-current Assets</SelectItem>
                        <SelectItem value="current-assets">Current Assets</SelectItem>
                        <SelectItem value="equity">Equity</SelectItem>
                        <SelectItem value="non-current-liabilities">Non-current Liabilities</SelectItem>
                        <SelectItem value="current-liabilities">Current Liabilities</SelectItem>
                        <SelectItem value="direct-income">Direct Income</SelectItem>
                        <SelectItem value="other-income">Other Income</SelectItem>
                        <SelectItem value="direct-costs">Direct Costs</SelectItem>
                        <SelectItem value="operating-expenses">Operating Expenses</SelectItem>
                        <SelectItem value="tax-expenses">Tax Expenses</SelectItem>
                        <SelectItem value="interest-expenses">Interest Expenses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryAccount">Select Secondary Account</Label>
                    <Select>
                      <SelectTrigger id="secondaryAccount">
                        <SelectValue placeholder="Select secondary account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current Assets</SelectItem>
                        <SelectItem value="fixed">Fixed Assets</SelectItem>
                        <SelectItem value="intangible">Intangible Assets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountCode">Account Code</Label>
                    <Select>
                      <SelectTrigger id="accountCode">
                        <SelectValue placeholder="Select account code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1000">1000 - Cash</SelectItem>
                        <SelectItem value="1100">1100 - Bank</SelectItem>
                        <SelectItem value="1200">1200 - Accounts Receivable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input id="accountName" placeholder="Enter account name" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Enter account description" rows={3} />
                </div>

                <div className="flex gap-2">
                  <Button>New</Button>
                  <Button variant="outline">Save</Button>
                  <Button variant="outline">Update</Button>
                  <Button variant="destructive">Delete</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="taxation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>VAT & Other Levies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>NHIL</Label>
                      <Input type="number" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>GETFund levy</Label>
                      <Input type="number" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>COVID-19 levy</Label>
                      <Input type="number" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>VAT</Label>
                      <Input type="number" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full">Clear</Button>
                    <Button className="w-full">Search</Button>
                    <Button className="w-full">Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Withholding taxes on services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      From persons other than individuals
                    </Label>
                    <div className="space-y-2 ml-4">
                      <div className="flex items-center gap-4">
                        <Label className="w-32">Exceeding</Label>
                        <Input type="number" placeholder="0.00" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Label className="w-32">Rate</Label>
                        <Input type="number" placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      From individuals
                    </Label>
                    <div className="flex items-center gap-4 ml-4">
                      <Label className="w-32">Rate</Label>
                      <Input type="number" placeholder="0.00" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Choose Service Line</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="serviceLine">Service line</Label>
                    <Select>
                      <SelectTrigger id="serviceLine">
                        <SelectValue placeholder="Analytics Solutions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analytics">Analytics Solutions</SelectItem>
                        <SelectItem value="consulting">Consulting Services</SelectItem>
                        <SelectItem value="audit">Audit Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 ml-4 mt-6">
                    <Button variant="outline" size="icon">◄</Button>
                    <Input className="w-16 text-center" defaultValue="3" />
                    <Button variant="outline" size="icon">►</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceCode">Service code</Label>
                    <Select>
                      <SelectTrigger id="serviceCode">
                        <SelectValue placeholder="SL2-003" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SL2-003">SL2-003</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceName">Service name</Label>
                    <Input id="serviceName" defaultValue="Payroll Management Systems" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="serviceDescription">Service description</Label>
                    <Input id="serviceDescription" defaultValue="Payroll management systems" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="averageFee">Average fee (in GHS)</Label>
                    <Input id="averageFee" type="number" defaultValue="22,500.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Input id="remarks" defaultValue="it systems usually comes with employee data management modi" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button>New</Button>
                  <Button variant="outline">Save</Button>
                  <Button variant="outline">Update</Button>
                  <Button variant="destructive">Delete</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Leader</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamLeaderId">ID</Label>
                    <Select>
                      <SelectTrigger id="teamLeaderId">
                        <SelectValue placeholder="SE-250101-001" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SE-250101-001">SE-250101-001</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamLeaderName">Name</Label>
                    <Input id="teamLeaderName" defaultValue="Michael Ajani" readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Client Information</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">⏮</Button>
                    <Button variant="outline" size="icon">◄</Button>
                    <Input className="w-16 text-center" />
                    <span className="text-sm text-muted-foreground">of 6</span>
                    <Button variant="outline" size="icon">►</Button>
                    <Button variant="outline" size="icon">⏭</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registrationDate">Registration date</Label>
                    <Input id="registrationDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Select>
                      <SelectTrigger id="clientId">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="C001">C001</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Input id="status" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company name</Label>
                    <Select>
                      <SelectTrigger id="companyName">
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company1">Company 1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyRegNo">Company registration no.</Label>
                    <Input id="companyRegNo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact person</Label>
                    <Input id="contactPerson" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailAddress">Email address</Label>
                    <Input id="emailAddress" type="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumbers">Phone numbers</Label>
                    <Input id="phoneNumbers" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="remarksClient">Remarks</Label>
                    <Textarea id="remarksClient" rows={2} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button>New</Button>
                  <Button variant="outline">Save</Button>
                  <Button variant="outline">Update</Button>
                  <Button variant="destructive">Delete</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ManageAccounts;
