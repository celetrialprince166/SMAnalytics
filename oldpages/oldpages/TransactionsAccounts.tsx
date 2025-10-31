import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { toast } from "sonner";
import { SectionBreadcrumb } from "@/components/SectionBreadcrumb";
import transactionsAccountsHome from "@/assets/transactions-accounts-home.jpg";

const TransactionsAccounts = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <SectionBreadcrumb
          items={[
            { label: "Transactions", path: "/transactions" },
            { label: "Accounts", path: "/transactions/accounts" }
          ]}
        />
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Accounts Transactions</h1>
          <p className="text-muted-foreground">Manage account transfers and sales transactions</p>
        </div>

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <Card>
              <CardContent className="p-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg p-8">
                  <h2 className="text-2xl font-bold mb-4">Manage Accounts Transactions</h2>
                  <p className="text-muted-foreground mb-6">
                    Click on any of the above controls to manage accounts transactions and related features.
                  </p>
                  <img 
                    src={transactionsAccountsHome} 
                    alt="Accounts Transactions" 
                    className="rounded-lg shadow-lg w-full h-auto object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transaction Details</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Input className="w-16 text-center" placeholder="1" />
                    <span className="text-sm text-muted-foreground">of 128</span>
                    <Button variant="outline" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Transaction Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <div className="relative">
                          <Input type="date" />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Num</Label>
                        <Input />
                      </div>
                      <div className="space-y-2">
                        <Label>Reconciled?</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input placeholder="Enter transaction description" />
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Transfer Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input type="number" placeholder="0.00" />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Debit</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Primary acc.</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="current">Current Assets</SelectItem>
                            <SelectItem value="fixed">Fixed Assets</SelectItem>
                            <SelectItem value="inventory">Inventory</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary acc.</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sub1">Sub Account 1</SelectItem>
                            <SelectItem value="sub2">Sub Account 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Holder acc.</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select holder" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="holder1">Holder 1</SelectItem>
                            <SelectItem value="holder2">Holder 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Balance</Label>
                        <Input readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Credit</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Primary acc.</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="current">Current Liabilities</SelectItem>
                            <SelectItem value="long">Long-term Liabilities</SelectItem>
                            <SelectItem value="equity">Equity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary acc.</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sub1">Sub Account 1</SelectItem>
                            <SelectItem value="sub2">Sub Account 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Holder acc.</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select holder" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="holder1">Holder 1</SelectItem>
                            <SelectItem value="holder2">Holder 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Balance</Label>
                        <Input readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Num</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Primary acc.</TableHead>
                          <TableHead>Secondary acc.</TableHead>
                          <TableHead>Holder acc.</TableHead>
                          <TableHead className="border-l">Primary acc.</TableHead>
                          <TableHead>Secondary acc.</TableHead>
                          <TableHead>Holder acc.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell className="border-l"></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="date-search" />
                    <Label htmlFor="date-search">Date search</Label>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Checkbox id="duplicate" />
                    <Label htmlFor="duplicate">Duplicate displayed</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => toast.success("New transaction created")}>New</Button>
                  <Button variant="outline" onClick={() => toast.success("Transaction updated")}>Update</Button>
                  <Button variant="outline" onClick={() => toast.info("Transaction submitted")}>Submit</Button>
                  <Button variant="destructive" onClick={() => toast.error("Transaction deleted")}>Delete</Button>
                  <Button variant="secondary" className="ml-auto" onClick={() => toast.info("Duplicated previous transaction")}>Duplicate Previous</Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1">Use Splits</Button>
                  <Button variant="secondary" className="flex-1">Use Petty Cash</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sales Transaction</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Input className="w-16 text-center" placeholder="1" />
                    <span className="text-sm text-muted-foreground">of 5</span>
                    <Button variant="outline" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client1">Client 1</SelectItem>
                          <SelectItem value="client2">Client 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Remarks</Label>
                      <Input readOnly className="bg-muted" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Sales Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <div className="relative">
                          <Input type="date" />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Sales code</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select code" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="code1">Code 1</SelectItem>
                            <SelectItem value="code2">Code 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>TN</Label>
                        <Input placeholder="Transaction number" />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <Label>Description</Label>
                        <Input />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Receivable/Receipt Account</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Secondary acc.</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acc1">Account 1</SelectItem>
                            <SelectItem value="acc2">Account 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Holder acc.</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select holder" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="holder1">Holder 1</SelectItem>
                            <SelectItem value="holder2">Holder 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 flex flex-col justify-between">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="apply-vat" />
                        <Label htmlFor="apply-vat">Apply VAT</Label>
                      </div>
                      <div className="space-y-2">
                        <Label>Total invoice</Label>
                        <Input readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                    </CardContent>
                    <CardContent className="pt-0">
                      <Button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700">
                        INV Data
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Select Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Service line</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select service line" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="line1">Service Line 1</SelectItem>
                            <SelectItem value="line2">Service Line 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>ATN</Label>
                        <Input />
                      </div>
                      <div className="space-y-2">
                        <Label>Service</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="service1">Service 1</SelectItem>
                            <SelectItem value="service2">Service 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Avg. fee</Label>
                        <Input readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Transaction Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Service fee</Label>
                        <Input type="number" placeholder="0.00" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="apply-discount" />
                        <Label htmlFor="apply-discount">Apply discount</Label>
                      </div>
                      <div className="space-y-2">
                        <Label>Sales value</Label>
                        <Input readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Get Representatives</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Input placeholder="Representative ID" />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700">
                        GET
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Service Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>TN</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Service line</TableHead>
                          <TableHead>Average fee</TableHead>
                          <TableHead>Service fee</TableHead>
                          <TableHead>Disc. value</TableHead>
                          <TableHead>Sales value</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-6 w-6">×</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="client-search" />
                    <Label htmlFor="client-search">Client search</Label>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Checkbox id="date-search-sales" />
                    <Label htmlFor="date-search-sales">Date search</Label>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Checkbox id="duplicate-sales" />
                    <Label htmlFor="duplicate-sales">Duplicate displayed</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => toast.success("New sales transaction created")}>New</Button>
                  <Button variant="outline" onClick={() => toast.success("Sales transaction updated")}>Update</Button>
                  <Button variant="outline" onClick={() => toast.info("Sales transaction submitted")}>Submit</Button>
                  <Button variant="destructive" onClick={() => toast.error("Sales transaction deleted")}>Delete</Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white">
                    Invoice
                  </Button>
                  <Button variant="secondary" className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                    Add More Products
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

export default TransactionsAccounts;