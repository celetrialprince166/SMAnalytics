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
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiEmployeeService } from '@/lib/services/ApiEmployeeService';
import { apiPayrollService } from '@/lib/services/ApiPayrollService';
import { CommissionScheduleDialog } from './CommissionScheduleDialog';
import { CommissionSettlementsDialog } from './CommissionSettlementsDialog';
import type { Employee } from '@/types';

interface CommissionFormData {
  employeeId: string;
  processDate: string;
  commissionCode: string;
  // As Sales Resource
  salesTarget: number;
  salesAchieved: number;
  effectiveSales: number;
  salesCommissionRate: number;
  salesCommission: number;
  // As Support Resource
  supportContract: number;
  supportEffectiveSales: number;
  supportCommissionRate: number;
  supportCommission: number;
  // Tax
  applyWithholdingTax: boolean;
}

export function PayrollCommissionsForm() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<CommissionFormData>({
    employeeId: '',
    processDate: new Date().toISOString().split('T')[0],
    commissionCode: '',
    salesTarget: 0,
    salesAchieved: 0,
    effectiveSales: 0,
    salesCommissionRate: 0,
    salesCommission: 0,
    supportContract: 0,
    supportEffectiveSales: 0,
    supportCommissionRate: 0,
    supportCommission: 0,
    applyWithholdingTax: false,
  });
  const [loading, setLoading] = useState(false);
  const [loadingSalesData, setLoadingSalesData] = useState(false);
  const [salesData, setSalesData] = useState<any>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [settlementsDialogOpen, setSettlementsDialogOpen] = useState(false);
  const [summary, setSummary] = useState({
    totalRelevantSales: 0,
    totalEffectiveSales: 0,
    totalCommissionExpected: 0,
    totalCommissionProcessed: 0,
    totalCommissionPaid: 0,
  });
  const [overallCommission, setOverallCommission] = useState(0);
  const [availableCommission, setAvailableCommission] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateCommissions();
  }, [
    formData.effectiveSales,
    formData.salesCommissionRate,
    formData.supportEffectiveSales,
    formData.supportCommissionRate,
    formData.applyWithholdingTax,
  ]);

  useEffect(() => {
    calculateSummary();
  }, [
    formData.salesTarget,
    formData.supportContract,
    formData.effectiveSales,
    formData.supportEffectiveSales,
    formData.salesCommission,
    formData.supportCommission,
    selectedEmployee,
    overallCommission,
  ]);

  const loadData = async () => {
    try {
      const allEmployees = await apiEmployeeService.getEmployees();
      const activeEmployees = allEmployees.filter((e) => e.status === 'ACTIVE');
      setEmployees(activeEmployees);
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
        commissionCode: `COM-${employee.employeeId}-${new Date().getFullYear()}`,
      }));
      // Reset sales data when changing employee
      setSalesData(null);
    }
  };

  const loadSalesData = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee first');
      return;
    }

    setLoadingSalesData(true);
    try {
      const data = await apiEmployeeService.getEmployeeSalesCommissions(selectedEmployee.id);
      
      setSalesData(data.salesData);

      // Auto-populate form with sales data
      setFormData((prev) => ({
        ...prev,
        // Sales Resource data
        salesTarget: data.salesData.sales.totalTarget,
        salesAchieved: data.salesData.sales.totalRelevantSales,
        effectiveSales: data.salesData.sales.totalRelevantSales,
        salesCommissionRate: data.salesData.sales.avgCommissionRate,
        
        // Support Resource data
        supportContract: data.salesData.support.totalTarget,
        supportEffectiveSales: data.salesData.support.totalRelevantSales,
        supportCommissionRate: data.salesData.support.avgCommissionRate,
      }));

      toast.success(`Loaded ${data.salesData.overall.salesCount} sales records`);
    } catch (error) {
      console.error('Error loading sales data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoadingSalesData(false);
    }
  };

  const calculateCommissions = () => {
    // Calculate sales commission
    const salesCommission = (formData.effectiveSales * formData.salesCommissionRate) / 100;
    
    // Calculate support commission
    const supportCommission = (formData.supportEffectiveSales * formData.supportCommissionRate) / 100;

    // Only update if values have changed to prevent infinite loop
    if (
      formData.salesCommission !== salesCommission ||
      formData.supportCommission !== supportCommission
    ) {
      setFormData((prev) => ({
        ...prev,
        salesCommission,
        supportCommission,
      }));
    }

    // Calculate overall commission
    const total = salesCommission + supportCommission;
    const withTax = formData.applyWithholdingTax ? total * 0.95 : total; // 5% withholding tax
    setOverallCommission(withTax);
  };

  const calculateSummary = async () => {
    if (!selectedEmployee) {
      setSummary({
        totalRelevantSales: 0,
        totalEffectiveSales: 0,
        totalCommissionExpected: 0,
        totalCommissionProcessed: 0,
        totalCommissionPaid: 0,
      });
      setAvailableCommission(0);
      return;
    }

    try {
      // Get commission history for employee
      const totalUnpaid = await apiPayrollService.getTotalUnpaidCommissions(selectedEmployee.id);
      
      const totalRelevantSales = formData.salesTarget + formData.supportContract;
      const totalEffectiveSales = formData.effectiveSales + formData.supportEffectiveSales;
      const totalCommissionExpected = formData.salesCommission + formData.supportCommission;
      
      setSummary({
        totalRelevantSales,
        totalEffectiveSales,
        totalCommissionExpected,
        totalCommissionProcessed: totalUnpaid,
        totalCommissionPaid: 0, // Would need to calculate from paid commissions
      });

      setAvailableCommission(totalUnpaid + overallCommission);
    } catch (error) {
      console.error('Error calculating summary:', error);
    }
  };

  const handleClear = () => {
    setFormData({
      employeeId: '',
      processDate: new Date().toISOString().split('T')[0],
      commissionCode: '',
      salesTarget: 0,
      salesAchieved: 0,
      effectiveSales: 0,
      salesCommissionRate: 0,
      salesCommission: 0,
      supportContract: 0,
      supportEffectiveSales: 0,
      supportCommissionRate: 0,
      supportCommission: 0,
      applyWithholdingTax: false,
    });
    setSelectedEmployee(null);
    toast.info('Form cleared');
  };

  const handleProcessCommission = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    if (overallCommission <= 0) {
      toast.error('Commission amount must be positive');
      return;
    }

    setLoading(true);
    try {
      await apiPayrollService.createCommission({
        employeeId: selectedEmployee.id,
        commissionDate: new Date(formData.processDate),
        amount: overallCommission,
        rate: formData.salesCommissionRate || formData.supportCommissionRate,
        salesAmount: formData.effectiveSales + formData.supportEffectiveSales,
        remarks: `Commission for ${selectedEmployee.firstName} ${selectedEmployee.surname} - ${formData.commissionCode}`,
      });

      toast.success('Commission processed successfully');
      handleClear();
    } catch (error) {
      console.error('Error processing commission:', error);
      toast.error('Failed to process commission');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSchedule = () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }
    setScheduleDialogOpen(true);
  };

  const handleSettlements = () => {
    setSettlementsDialogOpen(true);
  };

  const handlePrevious = () => {
    toast.info('Previous record');
  };

  const handleNext = () => {
    toast.info('Next record');
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Commission Processing</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
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
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={selectedEmployee?.department || ''}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            {selectedEmployee && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Data Card */}
        {selectedEmployee && (
          <Card className="border-2 bg-blue-50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Sales Commission Data</CardTitle>
                <Button
                  onClick={loadSalesData}
                  disabled={loadingSalesData}
                  size="sm"
                  variant="default"
                >
                  {loadingSalesData ? 'Loading...' : 'Load from Sales'}
                </Button>
              </div>
            </CardHeader>
            {salesData && (
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Total Sales</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {salesData.overall.salesCount}
                    </div>
                  </div>
                  <div className="text-center bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Sales Amount</div>
                    <div className="text-lg font-semibold text-gray-800">
                      GHS {salesData.overall.totalSales.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div className="text-center bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Commission Earned</div>
                    <div className="text-lg font-semibold text-green-600">
                      GHS {salesData.overall.totalCommission.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-center text-gray-600">
                  Data loaded from sales records • Click "Load from Sales" to refresh
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Processing */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="processDate">Process date</Label>
                <div className="relative">
                  <Input
                    id="processDate"
                    type="date"
                    value={formData.processDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, processDate: e.target.value }))
                    }
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissionCode">Commission code</Label>
                <Input
                  id="commissionCode"
                  value={formData.commissionCode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, commissionCode: e.target.value }))
                  }
                  placeholder="Enter commission code"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">As Sales Resource</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salesTarget">Target</Label>
                <Input
                  id="salesTarget"
                  type="number"
                  placeholder="0.00"
                  value={formData.salesTarget}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      salesTarget: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesAchieved">Achieved</Label>
                <Input
                  id="salesAchieved"
                  type="number"
                  placeholder="0.00"
                  value={formData.salesAchieved}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      salesAchieved: parseFloat(e.target.value) || 0,
                      effectiveSales: parseFloat(e.target.value) || 0, // Auto-populate effective sales
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effectiveSales">Effective sales</Label>
                <Input
                  id="effectiveSales"
                  type="number"
                  placeholder="0.00"
                  value={formData.effectiveSales}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      effectiveSales: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesCommissionRate">Commission rate (%)</Label>
                <Input
                  id="salesCommissionRate"
                  type="number"
                  placeholder="0.00"
                  value={formData.salesCommissionRate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      salesCommissionRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesCommission">Commission</Label>
                <Input
                  id="salesCommission"
                  type="number"
                  value={formData.salesCommission.toFixed(2)}
                  readOnly
                  className="bg-muted font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">As Support Resource</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supportContract">Contract</Label>
                <Input
                  id="supportContract"
                  type="number"
                  placeholder="0.00"
                  value={formData.supportContract}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      supportContract: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEffectiveSales">Effective sales</Label>
                <Input
                  id="supportEffectiveSales"
                  type="number"
                  placeholder="0.00"
                  value={formData.supportEffectiveSales}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      supportEffectiveSales: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportCommissionRate">Commission rate (%)</Label>
                <Input
                  id="supportCommissionRate"
                  type="number"
                  placeholder="0.00"
                  value={formData.supportCommissionRate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      supportCommissionRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportCommission">Commission</Label>
                <Input
                  id="supportCommission"
                  type="number"
                  value={formData.supportCommission.toFixed(2)}
                  readOnly
                  className="bg-muted font-semibold"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="applyWithholdingTax"
                  checked={formData.applyWithholdingTax}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, applyWithholdingTax: !!checked }))
                  }
                />
                <Label htmlFor="applyWithholdingTax">Apply withholding tax (5%)</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total relevant sales:</span>
                <span className="font-semibold">{summary.totalRelevantSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total effective sales:</span>
                <span className="font-semibold">{summary.totalEffectiveSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total commission expected:</span>
                <span className="font-semibold">{summary.totalCommissionExpected.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total commission processed:</span>
                <span className="font-semibold">{summary.totalCommissionProcessed.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total commission paid:</span>
                <span className="font-semibold">{summary.totalCommissionPaid.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Overall</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <Input
                type="number"
                value={overallCommission.toFixed(2)}
                readOnly
                className="text-center text-2xl font-bold bg-muted border-2"
              />
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Available</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <Input
                type="number"
                value={availableCommission.toFixed(2)}
                readOnly
                className="text-center text-2xl font-bold bg-muted border-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button
            variant="outline"
            onClick={handleProcessCommission}
            disabled={loading || !selectedEmployee}
          >
            {loading ? 'Processing...' : 'Process Commission'}
          </Button>
          <Button onClick={handleViewSchedule} disabled={!selectedEmployee}>
            View Schedule
          </Button>
          <Button onClick={handleSettlements}>
            Settlements
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Commission Schedule Dialog */}
    {selectedEmployee && (
      <CommissionScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        employeeId={selectedEmployee.id}
        employeeName={`${selectedEmployee.firstName} ${selectedEmployee.surname}`}
      />
    )}

    {/* Commission Settlements Dialog */}
    <CommissionSettlementsDialog
      open={settlementsDialogOpen}
      onOpenChange={setSettlementsDialogOpen}
      employeeId={selectedEmployee?.id}
      onSuccess={() => {
        // Refresh data after successful payment
        loadData();
      }}
    />
    </>
  );
}
