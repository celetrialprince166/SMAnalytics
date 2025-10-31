'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Printer } from 'lucide-react';
import type { PayslipReport } from '@/types/reports';

interface Props {
  data: PayslipReport;
  onExport: (format: 'PDF' | 'EXCEL') => void;
  onPrint: () => void;
}

export function PayslipComponent({ data, onExport, onPrint }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Payslip</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {data.employeeName} ({data.employeeId})
            </p>
            <p className="text-sm text-muted-foreground">
              {data.currentLevel} - {data.payPeriod}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onExport('PDF')}>
              <FileDown className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3 text-green-700">Earnings</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Basic Salary</span>
                <span>{formatCurrency(data.earnings.basicSalary)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Rent Allowance</span>
                <span>{formatCurrency(data.earnings.rentAllowance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Utility Allowance</span>
                <span>{formatCurrency(data.earnings.utilityAllowance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Transportation Allowance</span>
                <span>{formatCurrency(data.earnings.transportationAllowance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>End of Year Bonus</span>
                <span>{formatCurrency(data.earnings.endOfYearBonus)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Commissions</span>
                <span>{formatCurrency(data.earnings.commissions)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm border-t pt-2 mt-2">
                <span>Gross Salary</span>
                <span>{formatCurrency(data.earnings.grossSalary)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-red-700">Deductions</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Income Tax</span>
                <span>{formatCurrency(data.deductions.incomeTax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SSNIT Tier 1</span>
                <span>{formatCurrency(data.deductions.ssnitTier1)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SSNIT Tier 2</span>
                <span>{formatCurrency(data.deductions.ssnitTier2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Staff Loan</span>
                <span>{formatCurrency(data.deductions.staffLoan)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm border-t pt-2 mt-2">
                <span>Net Salary</span>
                <span>{formatCurrency(data.deductions.netSalary)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-primary/10 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Total Payment</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(data.totalPayment)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Last Payment Date: {formatDate(data.lastPaymentDate)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
