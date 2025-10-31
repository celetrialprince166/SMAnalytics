'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Printer } from 'lucide-react';
import type { EmployeesRegisterReport } from '@/types/reports';

interface Props {
  data: EmployeesRegisterReport;
  onExport: (format: 'PDF' | 'EXCEL') => void;
  onPrint: () => void;
}

export function EmployeesRegisterComponent({ data, onExport, onPrint }: Props) {
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
            <p className="text-sm text-muted-foreground mt-1">As of: {formatDate(data.asOfDate)}</p>
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
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Department</th>
                <th className="text-left p-2">Entry Level</th>
                <th className="text-left p-2">Current Level</th>
                <th className="text-right p-2">Entry Salary</th>
                <th className="text-right p-2">Current Salary</th>
              </tr>
            </thead>
            <tbody>
              {data.employees.map((emp, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="p-2">{emp.employeeId}</td>
                  <td className="p-2">{emp.employeeName}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      emp.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-2">{emp.department}</td>
                  <td className="p-2">{emp.entryLevel}</td>
                  <td className="p-2">{emp.currentLevel}</td>
                  <td className="text-right p-2">{formatCurrency(emp.entryBasicSalary)}</td>
                  <td className="text-right p-2 font-semibold">{formatCurrency(emp.currentBasicSalary)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Total Employees: {data.employees.length}
        </div>
      </CardContent>
    </Card>
  );
}
