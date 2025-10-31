'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useUnpaidCommissions, usePayCommissions } from '@/lib/hooks/usePayroll';

interface CommissionSettlementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: string;
  onSuccess?: () => void;
}

export function CommissionSettlementsDialog({
  open,
  onOpenChange,
  employeeId,
  onSuccess,
}: CommissionSettlementsDialogProps) {
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  // Use TanStack Query for data fetching
  const { data: response, isLoading, refetch } = useUnpaidCommissions(employeeId);
  const payCommissionsMutation = usePayCommissions();

  useEffect(() => {
    if (open) {
      setSelectedCommissions(new Set());
      setPaymentMethod('');
      setPaymentReference('');
      refetch();
    }
  }, [open, employeeId, refetch]);

  // Process the response data
  const unpaidCommissions = (() => {
    if (!response) return [];

    const commissions = Array.isArray(response)
      ? response
      : response.commissions || [];

    // Convert Decimal types to numbers
    return commissions.map((c: any) => ({
      ...c,
      amount: Number(c.amount || 0),
      rate: Number(c.rate || 0),
      salesAmount: Number(c.salesAmount || 0),
    }));
  })();

  const toggleCommission = (commissionId: string) => {
    const newSelected = new Set(selectedCommissions);
    if (newSelected.has(commissionId)) {
      newSelected.delete(commissionId);
    } else {
      newSelected.add(commissionId);
    }
    setSelectedCommissions(newSelected);
  };

  const toggleAll = () => {
    if (selectedCommissions.size === unpaidCommissions.length) {
      setSelectedCommissions(new Set());
    } else {
      setSelectedCommissions(new Set(unpaidCommissions.map(c => c.id)));
    }
  };

  const calculateTotal = () => {
    return unpaidCommissions
      .filter(c => selectedCommissions.has(c.id))
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  };

  const handleProcessPayments = async () => {
    if (selectedCommissions.size === 0) {
      toast.error('Please select at least one commission to pay');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Use TanStack Query mutation
    payCommissionsMutation.mutate(Array.from(selectedCommissions), {
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        }
        onOpenChange(false);
      },
    });
  };

  const formatCurrency = (amount: number) => {
    return `GHS ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const total = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Commission Settlements
            {employeeId && unpaidCommissions.length > 0 && (
              <span className="text-base font-normal text-muted-foreground ml-2">
                - {unpaidCommissions[0]?.employee?.firstName} {unpaidCommissions[0]?.employee?.surname}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : unpaidCommissions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No unpaid commissions found</p>
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <Card className="border-2 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      Total Unpaid
                    </div>
                    <div className="text-2xl font-bold">
                      {unpaidCommissions.length}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      Selected
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedCommissions.size}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      Total Amount
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(total)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentReference">Payment Reference (Optional)</Label>
                <Input
                  id="paymentReference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g., Transaction ID, Check number"
                />
              </div>
            </div>

            {/* Commissions Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCommissions.size === unpaidCommissions.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Commission Date</TableHead>
                    <TableHead className="text-right">Sales Amount</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unpaidCommissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCommissions.has(commission.id)}
                          onCheckedChange={() => toggleCommission(commission.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {commission.employee?.firstName} {commission.employee?.surname}
                      </TableCell>
                      <TableCell>{formatDate(commission.commissionDate)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(commission.salesAmount)}
                      </TableCell>
                      <TableCell className="text-right">{commission.rate}%</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(commission.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {commission.remarks || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleProcessPayments}
                disabled={payCommissionsMutation.isPending || selectedCommissions.size === 0 || !paymentMethod}
              >
                {payCommissionsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Process ${selectedCommissions.size} Payment(s)`
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
