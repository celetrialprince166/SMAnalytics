import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, Printer, Save } from "lucide-react";
import { toast } from "sonner";

const Invoice = () => {
  const handlePrint = () => {
    window.print();
    toast.success("Printing invoice...");
  };

  const handleSave = () => {
    toast.success("Invoice saved successfully");
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-4 flex justify-end gap-2 print:hidden">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Report
          </Button>
        </div>

        <Card className="print:shadow-none">
          <CardHeader className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">BAUTA LOGISTICS</h1>
                  <p className="text-sm text-muted-foreground">B212/2 Lashib</p>
                  <p className="text-sm text-muted-foreground">020 0000 001</p>
                </div>
              </div>
              <div className="text-right">
                <CardTitle className="text-3xl">INVOICE</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">IS-241002-008</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Customer Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Company:</span> ABC Corporation</p>
                  <p><span className="text-muted-foreground">Contact:</span> Grace Jones</p>
                  <p><span className="text-muted-foreground">Address:</span> 123 Business Street</p>
                  <p><span className="text-muted-foreground">Email:</span> mh2@gmail.com</p>
                  <p><span className="text-muted-foreground">Phone:</span> 024 000 0000</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Invoice Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Invoice No:</span> IS-241002-008</p>
                  <p><span className="text-muted-foreground">Order Date:</span> 9-Oct-24</p>
                  <p><span className="text-muted-foreground">Order No:</span> ORD-2024-001</p>
                  <p><span className="text-muted-foreground">Due Date:</span> 23-Oct-24</p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">No.</th>
                    <th className="text-left py-2 px-2">Item Description</th>
                    <th className="text-right py-2 px-2">Qty</th>
                    <th className="text-right py-2 px-2">Unit Price</th>
                    <th className="text-right py-2 px-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-2">1</td>
                    <td className="py-3 px-2">Lucky Star Pilchards in Chilli Sauce 425g</td>
                    <td className="text-right py-3 px-2">10</td>
                    <td className="text-right py-3 px-2">250.00</td>
                    <td className="text-right py-3 px-2">2,500.00</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">2</td>
                    <td className="py-3 px-2">Lucky Star Pilchards Tomato Sauce 425g</td>
                    <td className="text-right py-3 px-2">11</td>
                    <td className="text-right py-3 px-2">250.00</td>
                    <td className="text-right py-3 px-2">2,750.00</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">3</td>
                    <td className="py-3 px-2">Lucky Star Pilchards in Tomato Sauce 155g</td>
                    <td className="text-right py-3 px-2">12</td>
                    <td className="text-right py-3 px-2">100.00</td>
                    <td className="text-right py-3 px-2">1,200.00</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2">
                    <td colSpan={4} className="text-right py-3 px-2 font-semibold">Subtotal:</td>
                    <td className="text-right py-3 px-2 font-semibold">6,450.00</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="text-right py-2 px-2">VAT (15%):</td>
                    <td className="text-right py-2 px-2">967.50</td>
                  </tr>
                  <tr className="border-t">
                    <td colSpan={4} className="text-right py-3 px-2 font-bold text-lg">Total:</td>
                    <td className="text-right py-3 px-2 font-bold text-lg">7,417.50</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Bank Details</h3>
                <p className="text-sm text-muted-foreground">Bank: ABSA Bank Ghana</p>
                <p className="text-sm text-muted-foreground">Account No: 0012345678901</p>
                <p className="text-sm text-muted-foreground">Sort Code: 280101</p>
              </div>

              <div className="grid grid-cols-2 gap-8 mt-12">
                <div>
                  <p className="text-sm font-semibold mb-2">Customer Signature</p>
                  <div className="border-t border-muted-foreground pt-8"></div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Supplier Signature</p>
                  <div className="border-t border-muted-foreground pt-8"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Invoice;
