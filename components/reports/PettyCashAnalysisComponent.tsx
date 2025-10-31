'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PettyCashAnalysis } from '@/types/reports';

interface PettyCashAnalysisComponentProps {
  data: PettyCashAnalysis;
  onExport?: (format: 'PDF' | 'EXCEL') => void;
  onPrint?: () => void;
}

export function PettyCashAnalysisComponent({
  data,
  onExport,
  onPrint,
}: PettyCashAnalysisComponentProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
    });
  };

  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>
              Petty Cash Analysis for {getMonthName(data.month)} {data.year}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            {onPrint && (
              <Button variant="outline" size="sm" onClick={onPrint}>
                Print
              </Button>
            )}
            {onExport && (
              <>
                <Button variant="outline" size="sm" onClick={() => onExport('PDF')}>
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => onExport('EXCEL')}>
                  Export Excel
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-400 bg-gray-100">
                <th className="text-left py-3 px-4 font-semibold">Cash Received</th>
                <th className="text-center py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">Details</th>
                <th className="text-right py-3 px-4 font-semibold">Total Payments</th>
              </tr>
            </thead>
            <tbody>
              {/* Currency Header */}
              <tr className="border-b border-gray-300 font-bold">
                <td className="py-2 px-4">GH₵</td>
                <td className="text-center py-2 px-4"></td>
                <td className="py-2 px-4"></td>
                <td className="text-right py-2 px-4">GH₵</td>
              </tr>

              {/* Opening Balance */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4"></td>
                <td className="text-center py-2 px-4">1</td>
                <td className="py-2 px-4 font-semibold">Balance b/d</td>
                <td className="text-right py-2 px-4"></td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4">{formatCurrency(data.openingBalance)}</td>
                <td className="text-center py-2 px-4"></td>
                <td className="py-2 px-4"></td>
                <td className="text-right py-2 px-4 font-semibold">{formatCurrency(data.openingBalance)}</td>
              </tr>

              {/* Receipts */}
              {data.receipts.map((receipt, index) => (
                <tr key={`receipt-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-4">{formatCurrency(receipt.amount)}</td>
                  <td className="text-center py-2 px-4">{formatDate(receipt.date)}</td>
                  <td className="py-2 px-4">{receipt.description}</td>
                  <td className="text-right py-2 px-4"></td>
                </tr>
              ))}

              {/* Payments */}
              {data.payments.map((payment, index) => (
                <tr key={`payment-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-4"></td>
                  <td className="text-center py-2 px-4">{formatDate(payment.date)}</td>
                  <td className="py-2 px-4">{payment.description}</td>
                  <td className="text-right py-2 px-4">{formatCurrency(payment.amount)}</td>
                </tr>
              ))}

              {/* Subtotals */}
              <tr className="border-t-2 border-gray-400 font-bold bg-gray-100">
                <td className="py-2 px-4">{formatCurrency(data.openingBalance + data.totalReceipts)}</td>
                <td className="text-center py-2 px-4"></td>
                <td className="py-2 px-4"></td>
                <td className="text-right py-2 px-4">{formatCurrency(data.totalPayments)}</td>
              </tr>

              {/* Closing Balance */}
              <tr className="border-b-2 border-gray-400 font-bold">
                <td className="py-2 px-4"></td>
                <td className="text-center py-2 px-4"></td>
                <td className="py-2 px-4">Balance c/d</td>
                <td className="text-right py-2 px-4">{formatCurrency(data.closingBalance)}</td>
              </tr>

              {/* Final Totals */}
              <tr className="font-bold">
                <td className="py-2 px-4">{formatCurrency(data.openingBalance + data.totalReceipts)}</td>
                <td className="text-center py-2 px-4"></td>
                <td className="py-2 px-4"></td>
                <td className="text-right py-2 px-4">{formatCurrency(data.totalPayments + data.closingBalance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Generated on: {new Date(data.generatedAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
