'use client';

import { InvoiceData } from '@/types/products';

interface InvoiceWorksheetProps {
  invoiceData: InvoiceData;
}

export function InvoiceWorksheet({ invoiceData }: InvoiceWorksheetProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  return (
    <div className="bg-white p-8 shadow-lg" id="invoice-worksheet">
      {/* Company Header */}
      <div className="flex justify-between mb-8">
        <div>
          {invoiceData.company.logo && (
            <img src={invoiceData.company.logo} alt="Company Logo" className="h-16 mb-2" />
          )}
          <h1 className="text-2xl font-bold">{invoiceData.company.name}</h1>
          <p className="text-sm text-gray-600">{invoiceData.company.address}</p>
          <p className="text-sm text-gray-600">{invoiceData.company.email}</p>
          <p className="text-sm text-gray-600">{invoiceData.company.phone}</p>
        </div>
        
        <div className="text-right">
          <h2 className="text-3xl font-bold">INVOICE</h2>
          <p className="text-sm mt-2">Invoice #: {invoiceData.invoiceNumber}</p>
          <p className="text-sm">Date: {formatDate(invoiceData.date)}</p>
          {invoiceData.dueDate && (
            <p className="text-sm">Due Date: {formatDate(invoiceData.dueDate)}</p>
          )}
        </div>
      </div>

      {/* Bill To Section */}
      <div className="mb-8">
        <h3 className="font-bold mb-2">BILL TO:</h3>
        <p>{invoiceData.customer.name}</p>
        {invoiceData.customer.address && <p>{invoiceData.customer.address}</p>}
        {invoiceData.customer.email && <p>{invoiceData.customer.email}</p>}
        {invoiceData.customer.phone && <p>{invoiceData.customer.phone}</p>}
      </div>

      {/* Line Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2">Description</th>
            <th className="text-right py-2">Quantity</th>
            <th className="text-right py-2">Unit Price</th>
            <th className="text-right py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoiceData.lineItems.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2">{item.description}</td>
              <td className="text-right py-2">{item.quantity}</td>
              <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
              <td className="text-right py-2">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Subtotal:</span>
            <span>{formatCurrency(invoiceData.subtotal)}</span>
          </div>
          {invoiceData.vatAmount > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>VAT:</span>
              <span>{formatCurrency(invoiceData.vatAmount)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-300">
            <span>Total:</span>
            <span>{formatCurrency(invoiceData.total)}</span>
          </div>
        </div>
      </div>

      {/* Terms Section */}
      {invoiceData.terms && (
        <div className="mt-8">
          <h3 className="font-bold mb-2">Terms & Conditions:</h3>
          <p className="text-sm text-gray-600">{invoiceData.terms}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
}











