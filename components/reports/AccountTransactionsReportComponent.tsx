'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AccountReport } from '@/types/reports';

interface AccountTransactionsReportComponentProps {
  data: AccountReport;
  onExport?: (format: 'PDF' | 'EXCEL') => void;
  onPrint?: () => void;
}

export function AccountTransactionsReportComponent({
  data,
  onExport,
  onPrint,
}: AccountTransactionsReportComponentProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>
              {data.accountName} Transactions Report: [{formatDate(data.period.startDate)} - {formatDate(data.period.endDate)}]
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
              <tr className="border-b-2 border-gray-400">
                <th colSpan={4} className="text-center py-2 px-4 font-bold bg-gray-200">
                  Dr.
                </th>
                <th colSpan={4} className="text-center py-2 px-4 font-bold bg-gray-200">
                  Cr.
                </th>
              </tr>
              <tr className="border-b border-gray-300 bg-gray-100">
                <th className="text-left py-2 px-4 font-semibold">Date</th>
                <th className="text-left py-2 px-4 font-semibold">Description</th>
                <th className="text-center py-2 px-4 font-semibold">AR</th>
                <th className="text-right py-2 px-4 font-semibold">Amount</th>
                <th className="text-left py-2 px-4 font-semibold">Date</th>
                <th className="text-left py-2 px-4 font-semibold">Description</th>
                <th className="text-center py-2 px-4 font-semibold">AR</th>
                <th className="text-right py-2 px-4 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4">{formatDate(data.period.startDate)}</td>
                <td className="py-2 px-4 font-semibold">Balance b/d</td>
                <td className="text-center py-2 px-4"></td>
                <td className="text-right py-2 px-4 font-semibold">
                  {formatCurrency(Math.abs(data.openingBalance))}
                </td>
                <td className="py-2 px-4"></td>
                <td className="py-2 px-4"></td>
                <td className="text-center py-2 px-4"></td>
                <td className="text-right py-2 px-4"></td>
              </tr>

              {/* Transactions */}
              {data.transactions.map((transaction, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  {transaction.debit > 0 ? (
                    <>
                      <td className="py-2 px-4">{formatDate(transaction.date)}</td>
                      <td className="py-2 px-4">{transaction.description}</td>
                      <td className="text-center py-2 px-4">{transaction.transactionNumber}</td>
                      <td className="text-right py-2 px-4">{formatCurrency(transaction.debit)}</td>
                      <td className="py-2 px-4"></td>
                      <td className="py-2 px-4"></td>
                      <td className="text-center py-2 px-4"></td>
                      <td className="text-right py-2 px-4"></td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-4"></td>
                      <td className="py-2 px-4"></td>
                      <td className="text-center py-2 px-4"></td>
                      <td className="text-right py-2 px-4"></td>
                      <td className="py-2 px-4">{formatDate(transaction.date)}</td>
                      <td className="py-2 px-4">{transaction.description}</td>
                      <td className="text-center py-2 px-4">{transaction.transactionNumber}</td>
                      <td className="text-right py-2 px-4">{formatCurrency(transaction.credit)}</td>
                    </>
                  )}
                </tr>
              ))}

              {/* Totals */}
              <tr className="border-t-2 border-gray-400 font-bold bg-gray-100">
                <td className="py-2 px-4"></td>
                <td className="py-2 px-4"></td>
                <td className="text-center py-2 px-4"></td>
                <td className="text-right py-2 px-4">{formatCurrency(data.totalDebits)}</td>
                <td className="py-2 px-4"></td>
                <td className="py-2 px-4"></td>
                <td className="text-center py-2 px-4"></td>
                <td className="text-right py-2 px-4">{formatCurrency(data.totalCredits)}</td>
              </tr>

              {/* Closing Balance */}
              <tr className="border-b-2 border-gray-400 font-bold">
                <td className="py-2 px-4"></td>
                <td className="py-2 px-4"></td>
                <td className="text-center py-2 px-4"></td>
                <td className="text-right py-2 px-4"></td>
                <td className="py-2 px-4">{formatDate(data.period.endDate)}</td>
                <td className="py-2 px-4">Balance c/d</td>
                <td className="text-center py-2 px-4"></td>
                <td className="text-right py-2 px-4">{formatCurrency(Math.abs(data.closingBalance))}</td>
              </tr>

              {/* Next Period Opening */}
              <tr className="font-bold">
                <td className="py-2 px-4">
                  {formatDate(new Date(data.period.endDate.getTime() + 86400000))}
                </td>
                <td className="py-2 px-4">Balance b/d</td>
                <td className="text-center py-2 px-4"></td>
                <td className="text-right py-2 px-4">{formatCurrency(Math.abs(data.closingBalance))}</td>
                <td className="py-2 px-4"></td>
                <td className="py-2 px-4"></td>
                <td className="text-center py-2 px-4"></td>
                <td className="text-right py-2 px-4"></td>
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
