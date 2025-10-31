import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { SectionBreadcrumb } from "@/components/SectionBreadcrumb";
import transactionsFixedAssetsHome from "@/assets/transactions-fixed-assets-home.jpg";

const TransactionsFixedAssets = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <SectionBreadcrumb
          items={[
            { label: "Transactions", path: "/transactions" },
            { label: "Fixed Assets", path: "/transactions/fixed-assets" }
          ]}
        />
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Fixed Assets Disposals</h1>
          <p className="text-muted-foreground">Record and manage disposal of fixed assets</p>
        </div>

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="disposals">Fixed Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <Card>
              <CardContent className="p-8">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-8">
                  <h2 className="text-2xl font-bold mb-4">Disposal of Fixed Assets</h2>
                  <p className="text-muted-foreground mb-6">
                    Click on any of the above control, to manage fixed assets disposals and related transactions.
                  </p>
                  <img 
                    src={transactionsFixedAssetsHome} 
                    alt="Fixed Assets Disposals" 
                    className="rounded-lg shadow-lg w-full h-auto object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disposals">
            <Card>
              <CardHeader>
                <CardTitle>Asset Disposal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Asset Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="refNumber">Reference number</Label>
                      <Select>
                        <SelectTrigger id="refNumber">
                          <SelectValue placeholder="Select reference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ref1">REF001</SelectItem>
                          <SelectItem value="ref2">REF002</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assetCategory">Asset category</Label>
                      <Input id="assetCategory" readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assetClass">Asset class</Label>
                      <Input id="assetClass" readOnly className="bg-muted" />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Asset Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="acquisitionDate">Acquisition date</Label>
                        <div className="relative">
                          <Input id="acquisitionDate" type="date" readOnly className="bg-muted" />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="residualValue">Residual value</Label>
                        <Input id="residualValue" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="depreciationRate">Depreciation rate</Label>
                        <Input id="depreciationRate" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accDepreciation">Acc depreciation</Label>
                        <Input id="accDepreciation" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Valuation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="valueCost">Value at cost</Label>
                        <Input id="valueCost" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="depreciationType">Depreciation type</Label>
                        <Input id="depreciationType" readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="usefulLife">Useful life</Label>
                        <Input id="usefulLife" type="number" readOnly className="bg-muted" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="netBookValue">Net book value</Label>
                        <Input id="netBookValue" type="number" readOnly className="bg-muted" placeholder="0.00" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Disposal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="disposalDate">Disposal date</Label>
                        <div className="relative">
                          <Input id="disposalDate" type="date" />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="disposalValue">Disposal value</Label>
                        <Input id="disposalValue" type="number" placeholder="0.00" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Bank Account</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Bank account</Label>
                      <Select>
                        <SelectTrigger id="bankAccount">
                          <SelectValue placeholder="Select bank account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank1">Bank Account 1</SelectItem>
                          <SelectItem value="bank2">Bank Account 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Remarks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input id="remarks" placeholder="Enter any remarks" />
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => toast.info("Form cleared")}>Clear</Button>
                  <Button variant="outline" onClick={() => toast.success("Disposal entered")}>Enter</Button>
                  <Button onClick={() => toast.success("Disposal updated")}>Update</Button>
                  <Button variant="destructive" onClick={() => toast.error("Disposal deleted")}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TransactionsFixedAssets;