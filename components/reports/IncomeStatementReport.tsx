'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReportHeader } from './ReportHeader';
import type { IncomeStatement } from '@/types/reports';

interface IncomeStatementReportProps {
  data: IncomeStatement;
  onExport?: (format: 'PDF' | 'EXCEL') => void;
  onPrint?: () => void;
}

export function IncomeStatementReport({ 
  data, 
  onExport, 
  onPrint 
}: IncomeStatementReportProps) {
  const formatCurrency = (amount: number) => {
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

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <Card className="mt-6 print:shadow-none">
      <CardHeader>
        <ReportHeader
          title="Income Statement"
          subtitle={`For the period from ${formatDate(data.period.startDate)} to ${formatDate(data.period.endDate)}`}
          onExport={onExport}
          onPrint={handlePrint}
        />
      </CardHeader>

      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800 hover:bg-gray-800">
                <TableHead className="text-white font-semibold">
                  Description
                </TableHead>
                <TableHead className="text-white font-semibold text-right">
                  Amount (GHS)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Revenue Section */}
              <TableRow className="bg-gray-100">
                <TableCell className="font-semibold">Revenue</TableCell>
                <TableCell className="text-right"></TableCell>
              </TableRow>
              {data.revenueDetails.map((item, index) => (
                <TableRow key={`revenue-${index}`}>
                  <TableCell className="pl-8">{item.accountName}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {data.revenueDetails.length === 0 && (
                <TableRow>
                  <TableCell className="pl-8 text-gray-500 italic">No revenue accounts</TableCell>
                  <TableCell className="text-right font-mono">-</TableCell>
                </TableRow>
              )}

              {/* Direct Costs Section */}
              <TableRow className="bg-gray-100">
                <TableCell className="font-semibold">Direct Costs</TableCell>
                <TableCell className="text-right"></TableCell>
              </TableRow>
              {data.directCostsDetails.map((item, index) => (
                <TableRow key={`direct-cost-${index}`}>
                  <TableCell className="pl-8">{item.accountName}</TableCell>
                  <TableCell className="text-right font-mono">
                    ({formatCurrency(item.amount)})
                  </TableCell>
                </TableRow>
              ))}
              {data.directCostsDetails.length === 0 && (
                <TableRow>
                  <TableCell className="pl-8 text-gray-500 italic">No direct cost accounts</TableCell>
                  <TableCell className="text-right font-mono">-</TableCell>
                </TableRow>
              )}

              {/* Gross Profit */}
              <TableRow className="bg-blue-50 border-t-2 border-blue-200">
                <TableCell className="font-bold text-blue-700">Gross Profit</TableCell>
                <TableCell className="text-right font-mono font-bold text-blue-700">
                  {formatCurrency(data.grossProfit)}
                </TableCell>
              </TableRow>

              {/* Other Income */}
              <TableRow>
                <TableCell className="font-semibold">Other Income</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(data.otherIncome)}
                </TableCell>
              </TableRow>

              {/* Operating Expenses - Detailed Breakdown */}
              <TableRow className="bg-gray-100">
                <TableCell className="font-semibold">Operating Expenses</TableCell>
                <TableCell className="text-right"></TableCell>
              </TableRow>

              {/* Staff Cost */}
              <TableRow>
                <TableCell className="pl-8">Staff Cost</TableCell>
                <TableCell className="text-right font-mono">
                  ({formatCurrency(data.staffCost)})
                </TableCell>
              </TableRow>

              {/* Rental Cost */}
              <TableRow>
                <TableCell className="pl-8">Rental Cost</TableCell>
                <TableCell className="text-right font-mono">
                  ({formatCurrency(data.rentalCost)})
                </TableCell>
              </TableRow>

              {/* Selling, General & Admin Expenses */}
              <TableRow>
                <TableCell className="pl-8">Selling, General & Admin Expenses</TableCell>
                <TableCell className="text-right font-mono">
                  ({formatCurrency(data.sellingGeneralAdmin)})
                </TableCell>
              </TableRow>

              {/* Marketing & Advertisement Costs */}
              <TableRow>
                <TableCell className="pl-8">Marketing & Advertisement Costs</TableCell>
                <TableCell className="text-right font-mono">
                  ({formatCurrency(data.marketingAdvertising)})
                </TableCell>
              </TableRow>

              {/* Taxes & Levies */}
              <TableRow>
                <TableCell className="pl-8">Taxes & Levies</TableCell>
                <TableCell className="text-right font-mono">
                  ({formatCurrency(data.taxesLevies)})
                </TableCell>
              </TableRow>

              {/* Gifts & Promotions */}
              <TableRow>
                <TableCell className="pl-8">Gifts & Promotions</TableCell>
                <TableCell className="text-right font-mono">
                  ({formatCurrency(data.giftsPromotions)})
                </TableCell>
              </TableRow>

              {/* Other Operating Expenses */}
              <TableRow>
                <TableCell className="pl-8">Other Operating Expenses</TableCell>
                <TableCell className="text-right font-mono">
                  ({formatCurrency(data.otherOperatingExpenses)})
                </TableCell>
              </TableRow>

              {/* Total Operating Expenses */}
              <TableRow className="bg-gray-50">
                <TableCell className="font-semibold">Total Operating Expenses</TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  ({formatCurrency(data.totalOperatingExpenses)})
                </TableCell>
              </TableRow>

              {/* EBITDA */}
              <TableRow className="bg-blue-50 border-t-2 border-blue-200">
                <TableCell className="font-bold text-blue-700">EBITDA</TableCell>
                <TableCell className="text-right font-mono font-bold text-blue-700">
                  {formatCurrency(data.ebitda)}
                </TableCell>
              </TableRow>

              {/* Depreciation & Amortization */}
              <TableRow>
                <TableCell className="font-semibold">Depreciation & Amortization</TableCell>
                <TableCell className="text-right font-mono">
                  ({formatCurrency(data.depreciationAmortization)})
                </TableCell>
              </TableRow>

              {/* EBIT */}
              <TableRow className="bg-blue-50">
                <TableCell className="font-bold text-blue-700">EBIT</TableCell>
                <TableCell className="text-right font-mono font-bold text-blue-700">
                  {formatCurrency(data.ebit)}
                </TableCell>
              </TableRow>

              {/* Interest Income */}
              <TableRow>
                <TableCell className="font-semibold">Interest Income</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(data.interestIncome)}
                </TableCell>
              </TableRow>

              {/* Interest Expense */}
              <TableRow>
                <TableCell className="font-semibold">Interest Expense</TableCell>
                <TableCell className="text-right font-mono">
                  ({formatCurrency(data.interestExpense)})
                </TableCell>
              </TableRow>

              {/* Net Interest Charges */}
              <TableRow className="bg-gray-50">
                <TableCell className="font-semibold">Net Interest Charges</TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {data.netInterestCharges >= 0 ? '' : '('}
                  {formatCurrency(Math.abs(data.netInterestCharges))}
                  {data.netInterestCharges >= 0 ? '' : ')'}
                </TableCell>
              </TableRow>

              {/* Profit Before Tax */}
              <TableRow className="bg-blue-50 border-t-2 border-blue-200">
                <TableCell className="font-bold text-blue-700">Profit Before Tax</TableCell>
                <TableCell className="text-right font-mono font-bold text-blue-700">
                  {formatCurrency(data.profitBeforeTax)}
                </TableCell>
              </TableRow>

              {/* Tax Expenses */}
              <TableRow>
                <TableCell className="font-semibold">Tax Expenses</TableCell>
                <TableCell className="text-right font-mono">
                  ({formatCurrency(data.taxExpenses)})
                </TableCell>
              </TableRow>

              {/* Profit After Tax */}
              <TableRow className="bg-green-50 border-t-2 border-green-200">
                <TableCell className="font-bold text-lg text-green-700">
                  Profit After Tax
                </TableCell>
                <TableCell className={`text-right font-mono font-bold text-lg ${
                  data.profitAfterTax >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {data.profitAfterTax >= 0 ? '' : '('}
                  {formatCurrency(Math.abs(data.profitAfterTax))}
                  {data.profitAfterTax >= 0 ? '' : ')'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-xs text-gray-500 italic">
          Generated on {formatDate(data.generatedAt)}
        </div>
      </CardContent>
    </Card>
  );
}
