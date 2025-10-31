'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Printer } from 'lucide-react';
import type { EmployeeSalariesReport } from '@/types/reports';

interface Props {
  data: EmployeeSalariesReport;
  onExport: (format: 'PDF' | 'EXCEL') => void;
  onPrint: () => void;
}

export function EmployeeSalariesReportComponent({ data, onExport, onPrint }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
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
                <th className="text-left p-2">Level</th>
                <th className="text-right p-2">Basic Salary</th>
                <th className="text-right p-2">Rent Allow.</th>
                <th className="text-right p-2">Utility Allow.</th>
                <th className="text-right p-2">Transport Allow.</th>
                <th className="text-right p-2">Commission</th>
                <th className="text-right p-2">Gross Salary</th>
                <th className="text-right p-2">Net Salary</th>
              </tr>
            </thead>
            <tbody>
              {data.employees.map((emp, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="p-2">{emp.employeeId}</td>
                  <td className="p-2">{emp.employeeName}</td>
                  <td className="p-2">{emp.level}</td>
                  <td className="text-right p-2">{formatCurrency(emp.basicSalary)}</td>
                  <td className="text-right p-2">{formatCurrency(emp.rentAllowance)}</td>
                  <td className="text-right p-2">{formatCurrency(emp.utilityAllowance)}</td>
                  <td className="text-right p-2">{formatCurrency(emp.transportAllowance)}</td>
                  <td className="text-right p-2">{formatCurrency(emp.commission)}</td>
                  <td className="text-right p-2">{formatCurrency(emp.grossSalary)}</td>
                  <td className="text-right p-2 font-semibold">{formatCurrency(emp.netSalary)}</td>
                </tr>
              ))}
              <tr className="border-t-2 font-bold bg-muted/30">
                <td colSpan={3} className="p-2">TOTALS</td>
                <td className="text-right p-2">{formatCurrency(data.totals.basicSalary)}</td>
                <td className="text-right p-2">{formatCurrency(data.totals.rentAllowance)}</td>
                <td className="text-right p-2">{formatCurrency(data.totals.utilityAllowance)}</td>
                <td className="text-right p-2">{formatCurrency(data.totals.transportAllowance)}</td>
                <td className="text-right p-2">{formatCurrency(data.totals.commission)}</td>
                <td className="text-right p-2">{formatCurrency(data.totals.grossSalary)}</td>
                <td className="text-right p-2">{formatCurrency(data.totals.netSalary)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
