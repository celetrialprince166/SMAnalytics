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
import { toast } from 'sonner';
import { apiPayrollService } from '@/lib/services/ApiPayrollService';
import type { SalaryEntry } from '@/types';

interface SalaryPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: string;
  onPaymentComplete?: () => void;
}

export function SalaryPaymentDialog({
  open,
  onOpenChange,
  employeeId,
  onPaymentComplete,
}: SalaryPaymentDialogProps) {
  const [unpaidSalaries, setUnpaidSalaries] = useState<any[]>([]);
  const [selectedSalaries, setSelectedSalaries] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open) {
      loadUnpaidSalaries();
    }
  }, [open, employeeId]);

  const loadUnpaidSalaries = async () => {
    setLoadingData(true);
    try {
      const salaries = await apiPayrollService.getUnpaidSalaries(employeeId);
      setUnpaidSalaries(salaries);
      // Auto-select all if only one employee
      if (employeeId && salaries.length > 0) {
        setSelectedSalaries(new Set(salaries.map(s => s.id)));
      }
    } catch (error) {
      console.error('Error loading unpaid salaries:', error);
      toast.error('Failed to load unpaid salaries');
    } finally {
      setLoadingData(false);
    }
  };

  const toggleSalary = (salaryId: string) => {
    const newSelected = new Set(selectedSalaries);
    if (newSelected.has(salaryId)) {
      newSelected.delete(salaryId);
    } else {
      newSelected.add(salaryId);
    }
    setSelectedSalaries(newSelected);
  };

  const toggleAll = () => {
    if (selectedSalaries.size === unpaidSalaries.length) {
      setSelectedSalaries(new Set());
    } else {
      setSelectedSalaries(new Set(unpaidSalaries.map(s => s.id)));
    }
  };

  const calculateTotal = () => {
    return unpaidSalaries
      .filter(s => selectedSalaries.has(s.id))
      .reduce((sum, s) => sum + Number(s.netSalary), 0);
  };

  const handlePayment = async () => {
    if (selectedSalaries.size === 0) {
      toast.error('Please select at least one salary to pay');
      return;
    }

    setLoading(true);
    try {
      const salaryIds = Array.from(selectedSalaries);
      const results = await apiPayrollService.payMultipleSalaries(
        salaryIds,
        paymentMethod,
        paymentReference || undefined
      );

      if (results.success > 0) {
        toast.success(`Successfully paid ${results.success} salary(ies)`);
      }

      if (results.failed > 0) {
        toast.error(`Failed to pay ${results.failed} salary(ies)`);
      }

      // Reload data
      await loadUnpaidSalaries();
      setSelectedSalaries(new Set());
      setPaymentReference('');

      // Notify parent
      if (onPaymentComplete) {
        onPaymentComplete();
      }

      // Close dialog if all successful
      if (results.failed === 0) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error processing payments:', error);
      toast.error('Failed to process payments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Salary Payments</DialogTitle>
          <DialogDescription>
            Select unpaid salaries to mark as paid
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading unpaid salaries...
          </div>
        ) : unpaidSalaries.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No unpaid salaries found
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payment Method */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CHECK">Check</SelectItem>
                    <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentReference">Payment Reference (Optional)</Label>
                <Input
                  id="paymentReference"
                  placeholder="e.g., TXN-2025-001"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
            </div>

            {/* Select All */}
            <div className="flex items-center space-x-2 border-b pb-2">
              <Checkbox
                id="selectAll"
                checked={selectedSalaries.size === unpaidSalaries.length}
                onCheckedChange={toggleAll}
              />
              <Label htmlFor="selectAll" className="font-semibold cursor-pointer">
                Select All ({unpaidSalaries.length} salaries)
              </Label>
            </div>

            {/* Salary List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {unpaidSalaries.map((salary) => (
                <div
                  key={salary.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedSalaries.has(salary.id)}
                    onCheckedChange={() => toggleSalary(salary.id)}
                  />
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <div>
                      <div className="font-medium">
                        {salary.employee?.firstName} {salary.employee?.surname}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {salary.employee?.employeeId}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Department</div>
                      <div className="text-sm">{salary.employee?.department || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Salary Date</div>
                      <div className="text-sm">
                        {new Date(salary.salaryDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Net Salary</div>
                      <div className="font-semibold">
                        GHS {Number(salary.netSalary).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedSalaries.size} of {unpaidSalaries.length}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="text-2xl font-bold">
                    GHS {calculateTotal().toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={loading || selectedSalaries.size === 0 || loadingData}
          >
            {loading ? 'Processing...' : `Pay ${selectedSalaries.size} Salary(ies)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
