'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileDown, Printer } from 'lucide-react';
import type { TrialBalance } from '@/types/reports';

interface TrialBalanceReportProps {
  data: TrialBalance;
  onExport?: (format: 'PDF' | 'EXCEL') => void;
  onPrint?: () => void;
}

export function TrialBalanceReport({ data, onExport, onPrint }: TrialBalanceReportProps) {
  const formatCurrency = (amount: number) => {
    if (amount === 0) return '-';
    return new Intl.NumberFormat('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getPeriodLabel = () => {
    const date = new Date(data.asOfDate);
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${month}, ${year}`;
  };

  return (
    <Card className="mt-6 print:shadow-none">
      <CardHeader className="space-y-4 pb-4">
        {/* Company Logo/Name */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="bg-gray-600 text-white px-2 py-1 text-sm font-bold">s</div>
            <div className="bg-yellow-600 text-white px-2 py-1 text-sm font-bold">&</div>
            <div className="bg-gray-600 text-white px-2 py-1 text-sm font-bold">m</div>
          </div>
          <span className="text-yellow-600 font-semibold italic">analytics</span>
        </div>

        {/* Report Title */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-700">
            {data.accountType === 'SECONDARY' ? 'Quarterly' : 'Monthly'} Trial Balance as at ...
          </h2>
          <div className="inline-block bg-yellow-400 px-4 py-1">
            <span className="font-semibold">{formatDate(data.asOfDate)}</span>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => onExport?.('PDF')}>
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport?.('EXCEL')}>
            <FileDown className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {data.isBalanced ? (
            <Badge variant="default" className="bg-green-500 ml-auto">
              Balanced ✓
            </Badge>
          ) : (
            <Badge variant="destructive" className="ml-auto">
              Not Balanced
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800 hover:bg-gray-800">
                <TableHead className="text-white font-semibold">Accounts</TableHead>
                <TableHead className="text-white font-semibold w-24">Ref.</TableHead>
                <TableHead className="text-white font-semibold text-right w-32">
                  Debit
                </TableHead>
                <TableHead className="text-white font-semibold text-right w-32">
                  Credit
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No accounts found for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                data.accounts.map((account, index) => (
                  <TableRow
                    key={account.accountId}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <TableCell className="font-medium">{account.accountName}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {account.accountCode}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(account.debitBalance)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(account.creditBalance)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-gray-100 hover:bg-gray-100">
                <TableCell colSpan={2} className="font-bold text-base">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold font-mono text-base">
                  {formatCurrency(data.totalDebits)}
                </TableCell>
                <TableCell className="text-right font-bold font-mono text-base">
                  {formatCurrency(data.totalCredits)}
                </TableCell>
              </TableRow>
              {!data.isBalanced && (
                <TableRow className="bg-red-50 hover:bg-red-50">
                  <TableCell colSpan={2} className="font-bold text-red-600">
                    Difference (Out of Balance)
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    className="text-right font-bold font-mono text-red-600"
                  >
                    {formatCurrency(Math.abs(data.totalDebits - data.totalCredits))}
                  </TableCell>
                </TableRow>
              )}
            </TableFooter>
          </Table>
        </div>

        <div className="mt-4 text-xs text-gray-500 italic">
          Generated on {formatDate(data.generatedAt)}
        </div>
      </CardContent>
    </Card>
  );
}
