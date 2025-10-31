'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ComparativeAccountReport } from '@/types/reports';

interface ComparativeAccountReportComponentProps {
  data: ComparativeAccountReport;
  onExport?: (format: 'PDF' | 'EXCEL') => void;
  onPrint?: () => void;
}

export function ComparativeAccountReportComponent({
  data,
  onExport,
  onPrint,
}: ComparativeAccountReportComponentProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPeriodHeader = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>
              {data.periodType.charAt(0) + data.periodType.slice(1).toLowerCase().replace('_', ' ')} Account Report: {data.accountName}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Account Code: {data.accountCode}
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
                <th className="text-left py-3 px-4 font-semibold">Account</th>
                {data.periods.map((period, index) => (
                  <th key={index} className="text-right py-3 px-4 font-semibold">
                    {formatPeriodHeader(period.startDate, period.endDate)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.subAccounts.map((subAccount) => (
                <tr key={subAccount.accountId} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-4">{subAccount.accountName}</td>
                  {subAccount.amounts.map((amount, index) => (
                    <td key={index} className="text-right py-2 px-4">
                      {amount === 0 ? '-' : formatCurrency(amount)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
                <td className="py-3 px-4">Total</td>
                {data.totals.map((total, index) => (
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
