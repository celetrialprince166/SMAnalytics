import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SectionBreadcrumb } from "@/components/SectionBreadcrumb";
import manageFixedAssetsHome from "@/assets/manage-fixed-assets-home.jpg";

const ManageFixedAssets = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <SectionBreadcrumb
          items={[
            { label: "Manage", path: "/manage" },
            { label: "Fixed Assets", path: "/manage/fixed-assets" }
          ]}
        />
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Manage Fixed Assets Register</h1>
          <p className="text-muted-foreground">Manage fixed assets and related features</p>
        </div>

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="fixed-assets">Fixed Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <Card>
              <CardContent className="p-8">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-8">
                  <h2 className="text-2xl font-bold mb-4">Manage Fixed Assets</h2>
                  <p className="text-muted-foreground mb-6">
                    Click on any of the above control, to manage fixed assets and related features.
                  </p>
                  <img 
                    src={manageFixedAssetsHome} 
                    alt="Manage Fixed Assets" 
                    className="rounded-lg shadow-lg w-full h-auto object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fixed-assets" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Asset Details</CardTitle>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="acquisitionDate">Acquisition date</Label>
                    <Input id="acquisitionDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referenceNumber">Reference number</Label>
                    <Select>
                      <SelectTrigger id="referenceNumber">
                        <SelectValue placeholder="Select reference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REF001">REF001</SelectItem>
                        <SelectItem value="REF002">REF002</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assetCategory">Asset category</Label>
                      <Select>
                        <SelectTrigger id="assetCategory">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="building">Building</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="vehicle">Vehicle</SelectItem>
                          <SelectItem value="furniture">Furniture</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assetClass">Asset class</Label>
                      <Select>
                        <SelectTrigger id="assetClass">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="class1">Class 1</SelectItem>
                          <SelectItem value="class2">Class 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assetDescription">Description</Label>
                      <Select>
                        <SelectTrigger id="assetDescription">
                          <SelectValue placeholder="Select description" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc1">Description 1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valueAtCost">Value at cost</Label>
                      <Input id="valueAtCost" type="number" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usefulLife">Useful life (in years)</Label>
                      <Input id="usefulLife" type="number" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depreciationRate">Depreciation rate</Label>
                      <Input id="depreciationRate" type="number" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depreciationType">Depreciation type</Label>
                      <Select>
                        <SelectTrigger id="depreciationType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="straight-line">Straight Line</SelectItem>
                          <SelectItem value="declining">Declining Balance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="residualValue">Residual value</Label>
                      <Input id="residualValue" type="number" placeholder="0.00" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="remarksAsset">Remarks</Label>
                      <Textarea id="remarksAsset" rows={2} />
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Source</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryAcc">Primary acc</Label>
                      <Select>
                        <SelectTrigger id="primaryAcc">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="acc1">Account 1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryAcc">Secondary acc</Label>
                      <Select>
                        <SelectTrigger id="secondaryAcc">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="acc1">Account 1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 flex items-end gap-2">
                      <div className="flex-1">
                        <Label htmlFor="holderAcc">Holder acc</Label>
                        <Select>
                          <SelectTrigger id="holderAcc">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acc1">Account 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Label htmlFor="bal">Bal</Label>
                        <Input id="bal" readOnly />
                      </div>
                    </div>
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

export default ManageFixedAssets;
