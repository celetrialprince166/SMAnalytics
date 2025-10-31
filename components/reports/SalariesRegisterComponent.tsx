'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Printer } from 'lucide-react';
import type { SalariesRegisterReport } from '@/types/reports';

interface Props {
  data: SalariesRegisterReport;
  onExport: (format: 'PDF' | 'EXCEL') => void;
  onPrint: () => void;
}

export function SalariesRegisterComponent({ data, onExport, onPrint }: Props) {
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
            <CardTitle>{data.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Period: {formatDate(data.period.from)} to {formatDate(data.period.to)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onExport('PDF')}>
              <FileDown className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExport('EXCEL')}>
              <FileDown className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Employee ID</th>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Bank</th>
                <th className="text-left p-2">Branch</th>
                <th className="text-left p-2">Account No</th>
                <th className="text-right p-2">Basic Salary</th>
                <th className="text-right p-2">Net Salary</th>
                <th className="text-right p-2">Paid</th>
                <th className="text-right p-2">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="p-2">{entry.employeeId}</td>
                  <td className="p-2">{entry.employeeName}</td>
                  <td className="p-2">{entry.holdingBank}</td>
                  <td className="p-2">{entry.bankBranch}</td>
                  <td className="p-2 font-mono text-xs">{entry.bankAccountNo}</td>
                  <td className="text-right p-2">{formatCurrency(entry.basicSalary)}</td>
                  <td className="text-right p-2">{formatCurrency(entry.netSalary)}</td>
                  <td className="text-right p-2 text-green-600">{formatCurrency(entry.salaryPaid)}</td>
                  <td className="text-right p-2 text-orange-600">{formatCurrency(entry.outstanding)}</td>
                </tr>
              ))}
              <tr className="border-t-2 font-bold bg-muted/30">
                <td colSpan={5} className="p-2">TOTALS</td>
                <td className="text-right p-2">{formatCurrency(data.totals.basicSalary)}</td>
                <td className="text-right p-2">{formatCurrency(data.totals.netSalary)}</td>
                <td className="text-right p-2 text-green-600">{formatCurrency(data.totals.salaryPaid)}</td>
                <td className="text-right p-2 text-orange-600">{formatCurrency(data.totals.outstanding)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
