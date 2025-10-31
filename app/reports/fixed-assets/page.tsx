'use client'

import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Package } from "lucide-react";
import { SectionBreadcrumb } from "@/components/SectionBreadcrumb";

export default function ReportsFixedAssets() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <SectionBreadcrumb
          items={[
            { label: "Reports", path: "/reports" },
            { label: "Fixed Assets Register", path: "/reports/fixed-assets" }
          ]}
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fixed Assets Register</h1>
          <p className="text-muted-foreground mt-2">
            Generate fixed assets and depreciation reports
          </p>
        </div>

        <Tabs defaultValue="home" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="fixed-assets">Fixed Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-8">
                  <h2 className="text-2xl font-bold mb-4">Manage Fixed Assets</h2>
                  <p className="text-muted-foreground mb-6">
                    Click on any of the above controls, to manage fixed assets and related features.
                  </p>
                  <div className="flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Package className="h-16 w-16 mx-auto text-primary" />
                      <h3 className="text-xl font-semibold">Asset Reports</h3>
                      <p className="text-sm text-muted-foreground">
                        Track and report on asset classes, depreciation schedules, and asset registers
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fixed-assets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Fixed Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Selection mode</Label>
                  <RadioGroup defaultValue="asset-classes">
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="asset-classes" id="asset-classes" />
                        <Label htmlFor="asset-classes">Asset classes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="asset-description" id="asset-description" />
                        <Label htmlFor="asset-description">Asset description</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="border rounded-lg p-4 min-h-[200px]">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="asset-classes-check" defaultChecked />
                      <Label htmlFor="asset-classes-check">Asset Classes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="computer-hardware" />
                      <Label htmlFor="computer-hardware">Computer Hardware</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="furniture" />
                      <Label htmlFor="furniture">Furniture & Fittings</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline">Select All</Button>
                  <Button variant="outline">Clear All</Button>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Reporting date</Label>
                    <Input type="date" />
                  </div>

                  <div className="space-y-2">
                    <Label>Reference date</Label>
                    <Input type="date" />
                  </div>
                </div>

                <Button className="w-full">Run</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
