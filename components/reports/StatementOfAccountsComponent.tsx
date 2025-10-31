'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { StatementOfAccounts } from '@/types/reports';

interface StatementOfAccountsComponentProps {
  data: StatementOfAccounts;
  onExport?: (format: 'PDF' | 'EXCEL') => void;
  onPrint?: () => void;
}

export function StatementOfAccountsComponent({
  data,
  onExport,
  onPrint,
}: StatementOfAccountsComponentProps) {
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

  const totalDebit = data.transactions.reduce((sum, t) => sum + t.debit, 0);
  const totalCredit = data.transactions.reduce((sum, t) => sum + t.credit, 0);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>
              Statement of Account [{formatDate(data.period.startDate)} to {formatDate(data.period.endDate)}]
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Account: {data.accountName}
            </p>
            <p className="text-lg font-semibold mt-2 text-blue-600">
              {data.accountName.toUpperCase()}
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
          <div className="grid grid-cols-3 gap-4 text-right">
            <div>
              <p className="text-sm text-muted-foreground">Opening Balance</p>
              <p className="text-lg font-semibold">{formatCurrency(data.openingBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Debit</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(totalDebit)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Credit</p>
              <p className="text-lg font-semibold text-red-600">{formatCurrency(totalCredit)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-300">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Acc. Balance</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(data.closingBalance)}</p>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-400 bg-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">Description</th>
                <th className="text-right py-3 px-4 font-semibold">Debit</th>
                <th className="text-right py-3 px-4 font-semibold">Credit</th>
                <th className="text-right py-3 px-4 font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance */}
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="py-2 px-4">{formatDate(data.period.startDate)}</td>
                <td className="py-2 px-4 font-semibold">Opening Balance</td>
                <td className="text-right py-2 px-4"></td>
                <td className="text-right py-2 px-4"></td>
                <td className="text-right py-2 px-4 font-semibold">{formatCurrency(data.openingBalance)}</td>
              </tr>

              {/* Transactions */}
              {data.transactions.map((transaction, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-4">{formatDate(transaction.date)}</td>
                  <td className="py-2 px-4">{transaction.description}</td>
                  <td className="text-right py-2 px-4">
                    {transaction.debit > 0 ? formatCurrency(transaction.debit) : ''}
                  </td>
                  <td className="text-right py-2 px-4">
                    {transaction.credit > 0 ? formatCurrency(transaction.credit) : ''}
                  </td>
                  <td className="text-right py-2 px-4">{formatCurrency(transaction.balance)}</td>
                </tr>
              ))}
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
