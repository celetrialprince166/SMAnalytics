'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { SalesEntry, Product, HolderAccount } from '@/types';

interface InvoiceTemplateProps {
  salesEntry: SalesEntry;
  product: Product;
  customer: HolderAccount;
  invoiceNumber: string;
}

export function InvoiceTemplate({
  salesEntry,
  product,
  customer,
  invoiceNumber,
}: InvoiceTemplateProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple download of the invoice as HTML
    const element = document.getElementById('invoice-content');
    if (!element) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice-header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      {/* Invoice Content */}
      <Card id="invoice-content">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-6">
            <h1 className="text-3xl font-bold">INVOICE</h1>
            <p className="text-lg text-muted-foreground mt-2">SNM Analytics</p>
            <p className="text-sm text-muted-foreground">Accounting Management System</p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Bill To:</h3>
              <div className="text-sm space-y-1">
                <p className="font-medium">{customer.name}</p>
                <p className="text-muted-foreground">Account: {customer.code}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-semibold">Invoice Number:</span>
                  <span className="ml-2">{invoiceNumber}</span>
                </div>
                <div>
                  <span className="font-semibold">Sales Code:</span>
                  <span className="ml-2">{salesEntry.salesCode}</span>
                </div>
                <div>
                  <span className="font-semibold">Date:</span>
                  <span className="ml-2">{formatDate(salesEntry.date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Quantity</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {salesEntry.description}
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3">1</td>
                  <td className="text-right py-3">{formatAmount(salesEntry.salesValue)}</td>
                  <td className="text-right py-3">{formatAmount(salesEntry.salesValue)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between py-2 border-t">
                <span className="font-semibold">Subtotal:</span>
                <span>{formatAmount(salesEntry.salesValue)}</span>
              </div>
              {salesEntry.applyVat && salesEntry.vatAmount && (
                <div className="flex justify-between py-2">
                  <span>VAT ({salesEntry.vatRate}%):</span>
                  <span>{formatAmount(salesEntry.vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-black font-bold text-lg">
                <span>Total:</span>
                <span>{formatAmount(salesEntry.totalWithVat || salesEntry.salesValue)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 text-center text-sm text-muted-foreground">
            <p>Thank you for your business!</p>
            <p className="mt-2">
              This is a computer-generated invoice and does not require a signature.
            </p>
          </div>

          {/* Transaction References */}
          <div className="border-t pt-4 text-xs text-muted-foreground">
            <p>Cost Transaction: {salesEntry.costTransactionNumber}</p>
            <p>Sales Transaction: {salesEntry.salesTransactionNumber}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
