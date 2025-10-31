'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AgeingAnalysis } from '@/types/reports';

interface AgeingAnalysisComponentProps {
  data: AgeingAnalysis;
  onExport?: (format: 'PDF' | 'EXCEL') => void;
  onPrint?: () => void;
}

export function AgeingAnalysisComponent({
  data,
  onExport,
  onPrint,
}: AgeingAnalysisComponentProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Ageing Analysis</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              As of: {formatDate(data.asOfDate)}
            </p>
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
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-400 bg-gray-800 text-white">
                <th className="text-left py-2 px-2 font-semibold">Sales code</th>
                <th className="text-left py-2 px-2 font-semibold">Invoice no.</th>
                <th className="text-left py-2 px-2 font-semibold">Client</th>
                <th className="text-center py-2 px-2 font-semibold">Date</th>
                <th className="text-right py-2 px-2 font-semibold">Invoice amount</th>
                <th className="text-right py-2 px-2 font-semibold">Total paid</th>
                <th className="text-right py-2 px-2 font-semibold">Amount outs.</th>
                <th className="text-right py-2 px-2 font-semibold bg-gray-600">0 - 30 days</th>
                <th className="text-right py-2 px-2 font-semibold bg-gray-600">31 - 45 days</th>
                <th className="text-right py-2 px-2 font-semibold bg-gray-600">46 - 60 days</th>
                <th className="text-right py-2 px-2 font-semibold bg-gray-600">61 - 75 days</th>
                <th className="text-right py-2 px-2 font-semibold bg-gray-600">76 - 90 days</th>
                <th className="text-right py-2 px-2 font-semibold bg-gray-600">&gt;&gt; 90 days</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-2">{item.salesCode || '-'}</td>
                  <td className="py-2 px-2">{item.invoiceNumber}</td>
                  <td className="py-2 px-2">{item.clientName}</td>
                  <td className="text-center py-2 px-2">{formatDate(item.date)}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(item.invoiceAmount)}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(item.totalPaid)}</td>
                  <td className="text-right py-2 px-2 font-semibold">{formatCurrency(item.amountOutstanding)}</td>
                  <td className="text-right py-2 px-2 bg-gray-50">
                    {item.current > 0 ? formatCurrency(item.current) : ''}
                  </td>
                  <td className="text-right py-2 px-2 bg-gray-50">
                    {item.days31to45 > 0 ? formatCurrency(item.days31to45) : ''}
                  </td>
                  <td className="text-right py-2 px-2 bg-gray-50">
                    {item.days46to60 > 0 ? formatCurrency(item.days46to60) : ''}
                  </td>
                  <td className="text-right py-2 px-2 bg-gray-50">
                    {item.days61to75 > 0 ? formatCurrency(item.days61to75) : ''}
                  </td>
                  <td className="text-right py-2 px-2 bg-gray-50">
                    {item.days76to90 > 0 ? formatCurrency(item.days76to90) : ''}
                  </td>
                  <td className="text-right py-2 px-2 bg-gray-50">
                    {item.over90days > 0 ? formatCurrency(item.over90days) : ''}
                  </td>
                </tr>
              ))}

              {/* Summary Row */}
              <tr className="border-t-2 border-gray-400 font-bold bg-gray-100">
                <td colSpan={4} className="py-3 px-2">TOTAL</td>
                <td className="text-right py-3 px-2">{formatCurrency(data.summary.totalInvoiceAmount)}</td>
                <td className="text-right py-3 px-2">{formatCurrency(data.summary.totalPaid)}</td>
                <td className="text-right py-3 px-2">{formatCurrency(data.summary.totalOutstanding)}</td>
                <td className="text-right py-3 px-2 bg-gray-200">{formatCurrency(data.summary.current)}</td>
                <td className="text-right py-3 px-2 bg-gray-200">{formatCurrency(data.summary.days31to45)}</td>
                <td className="text-right py-3 px-2 bg-gray-200">{formatCurrency(data.summary.days46to60)}</td>
                <td className="text-right py-3 px-2 bg-gray-200">{formatCurrency(data.summary.days61to75)}</td>
                <td className="text-right py-3 px-2 bg-gray-200">{formatCurrency(data.summary.days76to90)}</td>
                <td className="text-right py-3 px-2 bg-gray-200">{formatCurrency(data.summary.over90days)}</td>
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
