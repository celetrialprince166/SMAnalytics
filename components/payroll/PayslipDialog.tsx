'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import type { Employee } from '@/types';

interface PayslipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  salaryData: {
    basicSalary: number;
    allowances: number;
    commission: number;
    grossSalary: number;
    taxDeduction: number;
    pensionDeduction: number;
    loanDeduction: number;
    totalDeductions: number;
    netSalary: number;
  };
  payrollDate: string;
}

export function PayslipDialog({
  open,
  onOpenChange,
  employee,
  salaryData,
  payrollDate,
}: PayslipDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!employee) return null;

  const formatCurrency = (amount: number) => {
    return `GHS ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const generatePDF = () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Company Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('SNM ANALYTICS', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Accounting Management System', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 15;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYSLIP', pageWidth / 2, yPos, { align: 'center'});
      
      // Draw line
      yPos += 5;
      doc.setLineWidth(0.5);
      doc.line(20, yPos, pageWidth - 20, yPos);
      
      // Employee Information
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('EMPLOYEE INFORMATION', 20, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const leftCol = 20;
      const rightCol = 110;
      
      doc.text(`Employee Name:`, leftCol, yPos);
      doc.text(`${employee.firstName} ${employee.surname}`, leftCol + 35, yPos);
      
      doc.text(`Employee ID:`, rightCol, yPos);
      doc.text(employee.employeeId, rightCol + 30, yPos);
      
      yPos += 6;
      doc.text(`Department:`, leftCol, yPos);
      doc.text(employee.department || 'N/A', leftCol + 35, yPos);
      
      doc.text(`Pay Period:`, rightCol, yPos);
      doc.text(formatDate(payrollDate), rightCol + 30, yPos);
      
      yPos += 6;
      doc.text(`Position:`, leftCol, yPos);
      doc.text(employee.position || 'N/A', leftCol + 35, yPos);
      
      doc.text(`Payment Date:`, rightCol, yPos);
      doc.text(new Date().toLocaleDateString('en-GB'), rightCol + 30, yPos);
      
      // Earnings Section
      yPos += 15;
      doc.setLineWidth(0.3);
      doc.line(20, yPos, pageWidth - 20, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('EARNINGS', 20, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      doc.text('Basic Salary', leftCol, yPos);
      doc.text(formatCurrency(salaryData.basicSalary), pageWidth - 20, yPos, { align: 'right' });
      
      yPos += 6;
      doc.text('Allowances', leftCol, yPos);
      doc.text(formatCurrency(salaryData.allowances), pageWidth - 20, yPos, { align: 'right' });
      
      yPos += 6;
      doc.text('Commission', leftCol, yPos);
      doc.text(formatCurrency(salaryData.commission), pageWidth - 20, yPos, { align: 'right' });
      
      yPos += 8;
      doc.setLineWidth(0.2);
      doc.line(leftCol, yPos, pageWidth - 20, yPos);
      
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Gross Salary', leftCol, yPos);
      doc.text(formatCurrency(salaryData.grossSalary), pageWidth - 20, yPos, { align: 'right' });
      
      // Deductions Section
      yPos += 12;
      doc.setLineWidth(0.3);
      doc.line(20, yPos, pageWidth - 20, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('DEDUCTIONS', 20, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      doc.text('Income Tax', leftCol, yPos);
      doc.text(formatCurrency(salaryData.taxDeduction), pageWidth - 20, yPos, { align: 'right' });
      
      yPos += 6;
      doc.text('Pension (SSNIT + Tier 2)', leftCol, yPos);
      doc.text(formatCurrency(salaryData.pensionDeduction), pageWidth - 20, yPos, { align: 'right' });
      
      yPos += 6;
      doc.text('Loan Deduction', leftCol, yPos);
      doc.text(formatCurrency(salaryData.loanDeduction), pageWidth - 20, yPos, { align: 'right' });
      
      yPos += 8;
      doc.setLineWidth(0.2);
      doc.line(leftCol, yPos, pageWidth - 20, yPos);
      
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Total Deductions', leftCol, yPos);
      doc.text(formatCurrency(salaryData.totalDeductions), pageWidth - 20, yPos, { align: 'right' });
      
      // Net Salary
      yPos += 12;
      doc.setLineWidth(0.5);
      doc.line(20, yPos, pageWidth - 20, yPos);
      
      yPos += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('NET SALARY', leftCol, yPos);
      doc.text(formatCurrency(salaryData.netSalary), pageWidth - 20, yPos, { align: 'right' });
      
      yPos += 5;
      doc.setLineWidth(0.5);
      doc.line(20, yPos, pageWidth - 20, yPos);
      
      // Bank Details (if available)
      if (employee.holdingBank) {
        yPos += 12;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('BANK DETAILS', 20, yPos);
        
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        doc.text(`Bank:`, leftCol, yPos);
        doc.text(employee.holdingBank, leftCol + 35, yPos);
        
        if (employee.bankBranch) {
          doc.text(`Branch:`, rightCol, yPos);
          doc.text(employee.bankBranch, rightCol + 30, yPos);
        }
        
        if (employee.bankAccountNo) {
          yPos += 6;
          doc.text(`Account Number:`, leftCol, yPos);
          doc.text(employee.bankAccountNo, leftCol + 35, yPos);
        }
      }
      
      // Footer
      yPos = doc.internal.pageSize.getHeight() - 30;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('This is a computer-generated payslip and does not require a signature.', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 5;
      doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, pageWidth / 2, yPos, { align: 'center' });
      
      // Save PDF
      const fileName = `Payslip_${employee.employeeId}_${new Date(payrollDate).toISOString().slice(0, 7)}.pdf`;
      doc.save(fileName);
      
      toast.success('Payslip PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Employee Payslip</DialogTitle>
          <DialogDescription>
            Salary details for {employee.firstName} {employee.surname}
          </DialogDescription>
        </DialogHeader>

        {/* Payslip Content */}
        <div className="payslip-content bg-white p-8 print:p-0">
          {/* Company Header */}
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
            <h1 className="text-2xl font-bold text-gray-800">SNM ANALYTICS</h1>
            <p className="text-sm text-gray-600">Accounting Management System</p>
            <h2 className="text-xl font-semibold mt-4 text-gray-700">PAYSLIP</h2>
          </div>

          {/* Employee Information */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-gray-800">Employee Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Employee Name:</span>
                <span className="ml-2 text-gray-800">{employee.firstName} {employee.surname}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Employee ID:</span>
                <span className="ml-2 text-gray-800">{employee.employeeId}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Department:</span>
                <span className="ml-2 text-gray-800">{employee.department || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Pay Period:</span>
                <span className="ml-2 text-gray-800">{formatDate(payrollDate)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Position:</span>
                <span className="ml-2 text-gray-800">{employee.position || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Payment Date:</span>
                <span className="ml-2 text-gray-800">{new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 text-gray-800 border-b border-gray-300 pb-2">
              Earnings
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Basic Salary</span>
                <span className="font-medium text-gray-800">{formatCurrency(salaryData.basicSalary)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Allowances</span>
                <span className="font-medium text-gray-800">{formatCurrency(salaryData.allowances)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Commission</span>
                <span className="font-medium text-gray-800">{formatCurrency(salaryData.commission)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold border-t border-gray-300 pt-2 mt-2">
                <span className="text-gray-800">Gross Salary</span>
                <span className="text-gray-800">{formatCurrency(salaryData.grossSalary)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 text-gray-800 border-b border-gray-300 pb-2">
              Deductions
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Income Tax</span>
                <span className="font-medium text-gray-800">{formatCurrency(salaryData.taxDeduction)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pension (SSNIT + Tier 2)</span>
                <span className="font-medium text-gray-800">{formatCurrency(salaryData.pensionDeduction)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Loan Deduction</span>
                <span className="font-medium text-gray-800">{formatCurrency(salaryData.loanDeduction)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold border-t border-gray-300 pt-2 mt-2">
                <span className="text-gray-800">Total Deductions</span>
                <span className="text-gray-800">{formatCurrency(salaryData.totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-blue-900">NET SALARY</span>
              <span className="text-2xl font-bold text-blue-900">{formatCurrency(salaryData.netSalary)}</span>
            </div>
          </div>

          {/* Bank Details */}
          {employee.holdingBank && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Bank Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Bank:</span>
                  <span className="ml-2 text-gray-800">{employee.holdingBank}</span>
                </div>
                {employee.bankBranch && (
                  <div>
                    <span className="font-medium text-gray-600">Branch:</span>
                    <span className="ml-2 text-gray-800">{employee.bankBranch}</span>
                  </div>
                )}
                {employee.bankAccountNo && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Account Number:</span>
                    <span className="ml-2 text-gray-800">{employee.bankAccountNo}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 italic mt-8 pt-4 border-t border-gray-200">
            <p>This is a computer-generated payslip and does not require a signature.</p>
            <p className="mt-1">Generated on: {new Date().toLocaleString('en-GB')}</p>
          </div>
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={generatePDF} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            {loading ? 'Generating...' : 'Download PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
