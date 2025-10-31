'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InvoiceTemplate } from '@/components/invoice';
import { ProtectedRoute } from '@/components/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText } from 'lucide-react';
import { salesService } from '@/lib/services/SalesService';
import { productService } from '@/lib/services/ProductService';
import { holderAccountRepository } from '@/lib/repositories';
import { SalesEntry, Product, HolderAccount } from '@/types';

function InvoiceContent() {
  const searchParams = useSearchParams();
  const salesId = searchParams.get('salesId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [salesEntry, setSalesEntry] = useState<SalesEntry | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [customer, setCustomer] = useState<HolderAccount | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  useEffect(() => {
    if (salesId) {
      loadInvoiceData(salesId);
    } else {
      setError('No sales ID provided');
      setLoading(false);
    }
  }, [salesId]);

  const loadInvoiceData = async (id: string) => {
    try {
      setLoading(true);
      setError('');

      // Load sales entry
      const entry = await salesService.getSalesEntryById(id);
      if (!entry) {
        setError('Sales entry not found');
        return;
      }
      setSalesEntry(entry);

      // Load product
      const prod = await productService.getProductById(entry.productId);
      if (!prod) {
        setError('Product not found');
        return;
      }
      setProduct(prod);

      // Load customer
      const cust = await holderAccountRepository.findById(entry.customerAccountId);
      if (!cust) {
        setError('Customer account not found');
        return;
      }
      setCustomer(cust);

      // Generate invoice number if not exists
      if (entry.invoiceNumber) {
        setInvoiceNumber(entry.invoiceNumber);
      } else {
        const invNumber = generateInvoiceNumber(entry.date, entry.salesCode);
        setInvoiceNumber(invNumber);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = (date: Date, salesCode: string): string => {
    const year = new Date(date).getFullYear();
    const month = String(new Date(date).getMonth() + 1).padStart(2, '0');
    // Extract number from sales code
    const codeMatch = salesCode.match(/\d+$/);
    const number = codeMatch ? codeMatch[0] : '0001';
    return `INV-${year}${month}-${number}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading invoice...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!salesEntry || !product || !customer) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Missing invoice data</AlertDescription>
      </Alert>
    );
  }

  return (
    <InvoiceTemplate
      salesEntry={salesEntry}
      product={product}
      customer={customer}
      invoiceNumber={invoiceNumber}
    />
  );
}

export default function InvoicePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Invoice</h1>
              <p className="text-muted-foreground">
                View and print sales invoice
              </p>
            </div>
          </div>

          <Suspense fallback={
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">Loading...</div>
              </CardContent>
            </Card>
          }>
            <InvoiceContent />
          </Suspense>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
