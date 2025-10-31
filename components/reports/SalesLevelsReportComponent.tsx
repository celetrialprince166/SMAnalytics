'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SalesLevelsReportComponentProps {
  data: any;
  onExport?: (format: 'PDF' | 'EXCEL') => void;
  onPrint?: () => void;
}

export function SalesLevelsReportComponent({
  data,
  onExport,
  onPrint,
}: SalesLevelsReportComponentProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPeriodHeader = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>
              Sales Levels Report - {data.reportType} ({data.mode})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Period Type: {data.periodType}
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
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-4 font-semibold">Service/Product</th>
                {data.periods.map((period: any, index: number) => (
                  <th key={index} className="text-right py-3 px-4 font-semibold">
                    {formatPeriodHeader(period.startDate, period.endDate)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item: any, index: number) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-4">{item.name}</td>
                  {item.values.map((value: number, periodIndex: number) => (
                    <td key={periodIndex} className="text-right py-2 px-4">
                      {value === 0 ? '-' : formatCurrency(value)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
                <td className="py-3 px-4">Total</td>
                {data.totals.map((total: number, index: number) => (
                  <td key={index} className="text-right py-3 px-4">
                    {formatCurrency(total)}
                  </td>
                ))}
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
