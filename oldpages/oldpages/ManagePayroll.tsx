import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionBreadcrumb } from "@/components/SectionBreadcrumb";
import managePayrollHome from "@/assets/manage-payroll-home.jpg";

const ManagePayroll = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <SectionBreadcrumb
          items={[
            { label: "Manage", path: "/manage" },
            { label: "Payroll", path: "/manage/payroll" }
          ]}
        />
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Manage Payroll</h1>
          <p className="text-muted-foreground">Manage employee data, taxes & pension</p>
        </div>

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
                    Click on any of the above controls, to manage employee data, parameters of taxes & levies and parimeters of employee benefits & allowance.
                  </p>
                  <img 
                    src={managePayrollHome} 
                    alt="Manage Payroll" 
                    className="rounded-lg shadow-lg w-full h-auto object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employee-data">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Employee Information</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">⏮</Button>
                    <Button variant="outline" size="icon">◄</Button>
                    <Input className="w-16 text-center" />
                    <span className="text-sm text-muted-foreground">of 10</span>
                    <Button variant="outline" size="icon">►</Button>
                    <Button variant="outline" size="icon">⏭</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entryDate">Entry date</Label>
                    <Input id="entryDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Select>
                      <SelectTrigger id="employeeId">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMP001">EMP001</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeStatus">Employee status</Label>
                    <Select>
                      <SelectTrigger id="employeeStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">Personal</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="surname">Surname</Label>
                            <Input id="surname" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First name</Label>
                            <Input id="firstName" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="otherNames">Other names</Label>
                            <Input id="otherNames" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of birth</Label>
                            <Input id="dateOfBirth" type="date" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="placeOfBirth">Place of birth</Label>
                            <Input id="placeOfBirth" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nationality">Nationality</Label>
                            <Select>
                              <SelectTrigger id="nationality">
                                <SelectValue placeholder="Select nationality" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ghanaian">Ghanaian</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Gender</Label>
                            <RadioGroup defaultValue="male" className="flex gap-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="male" id="male" />
                                <Label htmlFor="male">Male</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="female" id="female" />
                                <Label htmlFor="female">Female</Label>
                              </div>
                            </RadioGroup>
                          </div>
                          <div className="space-y-2">
                            <Label>Marital status</Label>
                            <RadioGroup defaultValue="single" className="flex gap-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="single" id="single" />
                                <Label htmlFor="single">Single</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="married" id="married" />
                                <Label htmlFor="married">Married</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="divorced" id="divorced" />
                                <Label htmlFor="divorced">Divorced</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="widowed" id="widowed" />
                                <Label htmlFor="widowed">Widowed</Label>
                              </div>
                            </RadioGroup>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="numberOfChildren">Number of children</Label>
                            <Input id="numberOfChildren" type="number" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="residentialAddress">Residential address</Label>
                            <Input id="residentialAddress" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="emailAddress">Email address</Label>
                            <Input id="emailAddress" type="email" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone number</Label>
                            <Input id="phoneNumber" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Button>New</Button>
                  <Button variant="outline">Save</Button>
                  <Button variant="outline">Update</Button>
                  <Button variant="destructive">Delete</Button>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="secondary" className="flex-1">Employee Sales</Button>
                  <Button variant="secondary" className="flex-1">Employee Loan</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="taxes">
            <Card>
              <CardHeader>
                <CardTitle>Tax Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
                  <div className="space-y-6">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">Income Tax Table</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                          <div></div>
                          <Label className="text-center font-semibold">Amount</Label>
                          <Label className="text-center font-semibold">Rate</Label>
                        </div>
                        <div className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                          <Label>First</Label>
                          <Input type="number" placeholder="0.00" className="bg-muted" readOnly />
                          <Input type="number" placeholder="0.00" />
                        </div>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                            <Label>Next</Label>
                            <Input type="number" placeholder="0.00" />
                            <Input type="number" placeholder="0.00" />
                          </div>
                        ))}
                        <div className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                          <Label>Remainder</Label>
                          <Input type="number" placeholder="0.00" className="bg-muted" readOnly />
                          <Input type="number" placeholder="0.00" />
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">Tax Rate - Non-Resident</h3>
                      <div className="space-y-2 max-w-md">
                        <Label htmlFor="nonResidentRate">Rate</Label>
                        <Input id="nonResidentRate" type="number" placeholder="0.00" />
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">Income Tax Relief</h3>
                      <div className="space-y-2 max-w-md">
                        <Label htmlFor="personalRelief">Personal relief</Label>
                        <Input id="personalRelief" type="number" placeholder="0.00" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full min-w-[120px]">Clear</Button>
                    <Button className="w-full min-w-[120px]">Search</Button>
                    <Button className="w-full min-w-[120px]">Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pension">
            <Card>
              <CardHeader>
                <CardTitle>Pension Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
                  <div className="space-y-6">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">SSNIT TIER 1</h3>
                      <div className="space-y-4 max-w-md">
                        <div className="space-y-2">
                          <Label htmlFor="tier1Employer">TIER 1 - Employer</Label>
                          <Input id="tier1Employer" type="number" placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tier1Employee">TIER 1 - Employee</Label>
                          <Input id="tier1Employee" type="number" placeholder="0.00" />
                        </div>
                        <hr />
                        <div className="space-y-2">
                          <Label htmlFor="tier1Pension">TIER 1 - Pension</Label>
                          <Input id="tier1Pension" type="number" placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tier1NHIS">TIER 1 - NHIS</Label>
                          <Input id="tier1NHIS" type="number" placeholder="0.00" className="bg-muted" readOnly />
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">SSNIT TIER 2</h3>
                      <div className="space-y-2 max-w-md">
                        <Label htmlFor="tier2">TIER 2</Label>
                        <Input id="tier2" type="number" placeholder="0.00" />
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">SSNIT TIER 3 (upto ...)</h3>
                      <div className="space-y-4 max-w-md">
                        <div className="space-y-2">
                          <Label htmlFor="tier3Employer">TIER 3 - Employer</Label>
                          <Input id="tier3Employer" type="number" placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tier3Employee">TIER 3 - Employee</Label>
                          <Input id="tier3Employee" type="number" placeholder="0.00" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full min-w-[120px]">Clear</Button>
                    <Button className="w-full min-w-[120px]">Search</Button>
                    <Button className="w-full min-w-[120px]">Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ManagePayroll;
