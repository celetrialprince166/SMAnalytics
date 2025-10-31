'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { apiEmployeeService } from '@/lib/services/ApiEmployeeService';
import { apiPayrollService } from '@/lib/services/ApiPayrollService';
import { AccountService } from '@/lib/services/AccountService';
import { SalaryPaymentDialog } from './SalaryPaymentDialog';
import { PayslipDialog } from './PayslipDialog';
import type { Employee, HolderAccount } from '@/types';

interface SalaryFormData {
  employeeId: string;
  payrollDate: string;
  basicSalary: number;
  allowances: number;
  commission: number;
  loanDeduction: number;
  salaryHolding: string;
  branch: string;
  accountNo: string;
  applyTax: boolean;
  applyPension: boolean;
}

export function PayrollSalariesForm() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bankAccounts, setBankAccounts] = useState<HolderAccount[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<SalaryFormData>({
    employeeId: '',
    payrollDate: new Date().toISOString().split('T')[0],
    basicSalary: 0,
    allowances: 0,
    commission: 0,
    loanDeduction: 0,
    salaryHolding: '',
    branch: '',
    accountNo: '',
    applyTax: true,
    applyPension: true,
  });
  const [loading, setLoading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [calculations, setCalculations] = useState({
    grossSalary: 0,
    taxDeduction: 0,
    pensionDeduction: 0,
    totalDeductions: 0,
    netSalary: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateSalary();
  }, [formData, selectedEmployee]);

  const loadData = async () => {
    try {
      const allEmployees = await apiEmployeeService.getEmployees();
      const activeEmployees = allEmployees.filter((e) => e.status === 'ACTIVE');
      setEmployees(activeEmployees);

      const accountService = AccountService.getInstance();
      const hierarchy = await accountService.getAccountHierarchy();
      const banks: HolderAccount[] = [];
      hierarchy.primary.forEach((primary) => {
        hierarchy.secondary
          .filter((sec) => sec.primaryAccountId === primary.id)
          .forEach((secondary) => {
            hierarchy.holder
              .filter((holder) => holder.secondaryAccountId === secondary.id)
              .forEach((holder) => {
                if (holder.name.toLowerCase().includes('bank')) {
                  banks.push(holder);
                }
              });
          });
      });
      setBankAccounts(banks);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  const handleEmployeeSelect = async (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setFormData((prev) => ({
        ...prev,
        employeeId,
        basicSalary: Number(employee.basicSalary),
      }));
    }
  };

  const calculateSalary = async () => {
    if (!selectedEmployee) {
      setCalculations({
        grossSalary: 0,
        taxDeduction: 0,
        pensionDeduction: 0,
        totalDeductions: 0,
        netSalary: 0,
      });
      return;
    }

    try {
      const grossSalary = Number(formData.basicSalary) + Number(formData.allowances) + Number(formData.commission);
      
      let taxDeduction = 0;
      let pensionDeduction = 0;

      if (formData.applyTax) {
        const taxConfig = await apiPayrollService.getActiveTaxConfiguration();
        if (taxConfig) {
          taxDeduction = Number(apiPayrollService.calculateIncomeTax(
            grossSalary,
            taxConfig,
            selectedEmployee.nationality === 'GHANAIAN'
          ));
        }
      }

      if (formData.applyPension) {
        const pensionConfig = await apiPayrollService.getActivePensionConfiguration();
        if (pensionConfig) {
          const pensionCalc = apiPayrollService.calculatePensionDeductions(
            Number(formData.basicSalary),
            pensionConfig
          );
          pensionDeduction = Number(pensionCalc.totalSSNIT);
        }
      }

      const totalDeductions = Number(taxDeduction) + Number(pensionDeduction) + Number(formData.loanDeduction);
      const netSalary = Number(grossSalary) - Number(totalDeductions);

      setCalculations({
        grossSalary: Number(grossSalary),
        taxDeduction: Number(taxDeduction),
        pensionDeduction: Number(pensionDeduction),
        totalDeductions: Number(totalDeductions),
        netSalary: Number(netSalary),
      });
    } catch (error) {
      console.error('Error calculating salary:', error);
    }
  };

  const handleClear = () => {
    setFormData({
      employeeId: '',
      payrollDate: new Date().toISOString().split('T')[0],
      basicSalary: 0,
      allowances: 0,
      commission: 0,
      loanDeduction: 0,
      salaryHolding: '',
      branch: '',
      accountNo: '',
      applyTax: true,
      applyPension: true,
    });
    setSelectedEmployee(null);
    toast.info('Form cleared');
  };

  const handleProcessSalary = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    if (calculations.netSalary <= 0) {
      toast.error('Net salary must be positive');
      return;
    }

    setLoading(true);
    try {
      await apiPayrollService.processSalary({
        employeeId: selectedEmployee.id,
        salaryDate: new Date(formData.payrollDate),
        allowances: formData.allowances,
        commission: formData.commission,
        otherDeductions: formData.loanDeduction,
        remarks: `Salary for ${selectedEmployee.firstName} ${selectedEmployee.surname}`,
      });

      toast.success('Salary processed successfully');
      handleClear();
    } catch (error) {
      console.error('Error processing salary:', error);
      toast.error('Failed to process salary');
    } finally {
      setLoading(false);
    }
  };

  const handlePayments = () => {
    setPaymentDialogOpen(true);
  };

  const handlePaymentComplete = () => {
    // Refresh form or show success message
    toast.success('Payments processed successfully');
  };

  const handleViewPayslip = () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }
    
    if (calculations.netSalary <= 0) {
      toast.error('Please calculate salary first');
      return;
    }
    
    setPayslipDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salary Processing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employee Information */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Employee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select value={formData.employeeId} onValueChange={handleEmployeeSelect}>
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.employeeId} - {employee.firstName} {employee.surname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payrollDate">Payroll date</Label>
                <div className="relative">
                  <Input
                    id="payrollDate"
                    type="date"
                    value={formData.payrollDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, payrollDate: e.target.value }))
                    }
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {selectedEmployee && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entryDate">Entry date</Label>
                  <Input
                    id="entryDate"
                    type="date"
                    value={new Date(selectedEmployee.entryDate).toISOString().split('T')[0]}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={selectedEmployee.status}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={selectedEmployee.department}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={selectedEmployee.nationality}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    value={selectedEmployee.gender}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital status</Label>
                  <Input
                    id="maritalStatus"
                    value={selectedEmployee.maritalStatus}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Salary Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="basicSalary">Basic salary</Label>
                <Input
                  id="basicSalary"
                  type="number"
                  placeholder="0.00"
                  value={formData.basicSalary}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      basicSalary: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowances">Allowances</Label>
                <Input
                  id="allowances"
                  type="number"
                  placeholder="0.00"
                  value={formData.allowances}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      allowances: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission">Commission</Label>
                <Input
                  id="commission"
                  type="number"
                  placeholder="0.00"
                  value={formData.commission}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      commission: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grossSalary">Gross salary</Label>
                <Input
                  id="grossSalary"
                  type="number"
                  value={(calculations.grossSalary || 0).toFixed(2)}
                  readOnly
                  className="bg-muted font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Deductions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="applyTax"
                  checked={formData.applyTax}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, applyTax: !!checked }))
                  }
                />
                <Label htmlFor="applyTax">Apply tax</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxDeduction">Tax deduction</Label>
                <Input
                  id="taxDeduction"
                  type="number"
                  value={(calculations.taxDeduction || 0).toFixed(2)}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="applyPension"
                  checked={formData.applyPension}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, applyPension: !!checked }))
                  }
                />
                <Label htmlFor="applyPension">Apply pension</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pensionDeduction">Pension deduction</Label>
                <Input
                  id="pensionDeduction"
                  type="number"
                  value={(calculations.pensionDeduction || 0).toFixed(2)}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="netSalary">Net salary</Label>
                <Input
                  id="netSalary"
                  type="number"
                  value={(calculations.netSalary || 0).toFixed(2)}
                  readOnly
                  className="bg-muted font-bold text-lg"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Information */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Bank Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaryHolding">Salary holding</Label>
                <Select
                  value={formData.salaryHolding}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, salaryHolding: value }))
                  }
                >
                  <SelectTrigger id="salaryHolding">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  placeholder="Enter branch"
                  value={formData.branch}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, branch: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNo">Account no.</Label>
                <Input
                  id="accountNo"
                  placeholder="Enter account number"
                  value={formData.accountNo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, accountNo: e.target.value }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Loan */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Staff Loan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="loanDeduction">Loan deduction</Label>
              <Input
                id="loanDeduction"
                type="number"
                placeholder="0.00"
                value={formData.loanDeduction}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    loanDeduction: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button
            variant="outline"
            onClick={handleProcessSalary}
            disabled={loading || !selectedEmployee}
          >
            {loading ? 'Processing...' : 'Process Salary'}
          </Button>
          <Button onClick={handlePayments}>Payments</Button>
          <Button onClick={handleViewPayslip} disabled={!selectedEmployee}>
            View Payslip
          </Button>
        </div>
      </CardContent>

      {/* Payment Dialog */}
      <SalaryPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        employeeId={selectedEmployee?.id}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Payslip Dialog */}
      <PayslipDialog
        open={payslipDialogOpen}
        onOpenChange={setPayslipDialogOpen}
        employee={selectedEmployee}
        salaryData={{
          basicSalary: Number(formData.basicSalary),
          allowances: Number(formData.allowances),
          commission: Number(formData.commission),
          grossSalary: Number(calculations.grossSalary),
          taxDeduction: Number(calculations.taxDeduction),
          pensionDeduction: Number(calculations.pensionDeduction),
          loanDeduction: Number(formData.loanDeduction),
          totalDeductions: Number(calculations.totalDeductions),
          netSalary: Number(calculations.netSalary),
        }}
        payrollDate={formData.payrollDate}
      />
    </Card>
  );
}
