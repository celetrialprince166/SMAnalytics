'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SalesMovementReportComponentProps {
  data: any;
  onExport?: (format: 'PDF' | 'EXCEL') => void;
  onPrint?: () => void;
}

export function SalesMovementReportComponent({
  data,
  onExport,
  onPrint,
}: SalesMovementReportComponentProps) {
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
            <CardTitle>Sales Movement Report</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Period: {formatDate(data.period.startDate)} to {formatDate(data.period.endDate)}
            </p>
            <p className="text-sm text-muted-foreground">
              Mode: {data.dateMode}
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
        {/* Summary Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Quantity</p>
              <p className="text-lg font-semibold">{data.totalQuantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(data.totalValue)}</p>
            </div>
          </div>
        </div>

        {/* Movements Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-100">
                <th className="text-left py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">Sales Code</th>
                <th className="text-left py-3 px-4 font-semibold">Description</th>
                <th className="text-left py-3 px-4 font-semibold">Client</th>
                <th className="text-right py-3 px-4 font-semibold">Quantity</th>
                <th className="text-right py-3 px-4 font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.movements.map((movement: any, index: number) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-4">{formatDate(movement.date)}</td>
                  <td className="py-2 px-4">{movement.salesCode}</td>
                  <td className="py-2 px-4">{movement.description}</td>
                  <td className="py-2 px-4">{movement.client}</td>
                  <td className="text-right py-2 px-4">{movement.quantity}</td>
                  <td className="text-right py-2 px-4">{formatCurrency(movement.value)}</td>
                </tr>
              ))}
              {data.movements.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No sales movements found for the selected period
                  </td>
                </tr>
              )}
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
