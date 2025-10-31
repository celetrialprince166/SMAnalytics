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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { apiPayrollService } from '@/lib/services/ApiPayrollService';

interface CommissionScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
}

export function CommissionScheduleDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
}: CommissionScheduleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredCommissions, setFilteredCommissions] = useState<any[]>([]);

  useEffect(() => {
    if (open && employeeId) {
      loadCommissions();
    }
  }, [open, employeeId]);

  useEffect(() => {
    filterCommissions();
  }, [commissions, startDate, endDate]);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      const response = await apiPayrollService.getCommissions();
      
      // Handle response format (could be array or object with commissions property)
      const allCommissions = Array.isArray(response) 
        ? response 
        : response.commissions || [];
      
      console.log('All commissions:', allCommissions);
      
      // Filter commissions for this employee
      const employeeCommissions = allCommissions.filter(
        (c: any) => c.employeeId === employeeId
      );
      
      console.log('Employee commissions:', employeeCommissions);
      
      // Convert Decimal types to numbers and extract month/year from commissionDate
      const processedCommissions = employeeCommissions.map((c: any) => {
        const commDate = new Date(c.commissionDate);
        return {
          ...c,
          month: commDate.getMonth() + 1, // JavaScript months are 0-indexed
          year: commDate.getFullYear(),
          amount: Number(c.amount || 0),
          rate: Number(c.rate || 0),
          salesAmount: Number(c.salesAmount || 0),
          // These fields might not exist in the commissions table
          salesTarget: 0,
          salesAchieved: Number(c.salesAmount || 0),
          salesCommission: Number(c.amount || 0),
          supportContract: 0,
          supportEffectiveSales: 0,
          supportCommission: 0,
          totalCommission: Number(c.amount || 0),
          withholdingTax: Number(c.amount || 0) * 0.05, // 5% WHT
          netCommission: Number(c.amount || 0) * 0.95, // After 5% WHT
        };
      });
      
      // Sort by date (newest first)
      processedCommissions.sort((a: any, b: any) => {
        const dateA = new Date(a.commissionDate);
        const dateB = new Date(b.commissionDate);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('Processed commissions:', processedCommissions);
      setCommissions(processedCommissions);
    } catch (error) {
      console.error('Error loading commissions:', error);
      toast.error('Failed to load commission schedule');
    } finally {
      setLoading(false);
    }
  };

  const filterCommissions = () => {
    let filtered = [...commissions];

    if (startDate) {
      const start = new Date(startDate);
      start.setDate(1); // Set to first day of month
      filtered = filtered.filter((c) => {
        const commDate = new Date(c.commissionDate);
        return commDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setMonth(end.getMonth() + 1); // Move to next month
      end.setDate(0); // Set to last day of selected month
      filtered = filtered.filter((c) => {
        const commDate = new Date(c.commissionDate);
        return commDate <= end;
      });
    }

    setFilteredCommissions(filtered);
  };

  const calculateSummary = () => {
    const total = filteredCommissions.reduce(
      (sum, c) => sum + Number(c.totalCommission || 0),
      0
    );
    const paid = filteredCommissions
      .filter((c) => c.isPaid)
      .reduce((sum, c) => sum + Number(c.totalCommission || 0), 0);
    const unpaid = total - paid;
    const count = filteredCommissions.length;
    const paidCount = filteredCommissions.filter((c) => c.isPaid).length;

    return { total, paid, unpaid, count, paidCount };
  };

  const summary = calculateSummary();

  const formatMonth = (month: number, year: number) => {
    // Validate month and year
    if (!month || !year || month < 1 || month > 12 || year < 1900) {
      return 'Invalid Date';
    }
    
    const date = new Date(year, month - 1);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = Number(amount || 0);
    
    if (isNaN(numAmount)) {
      return 'GHS 0.00';
    }
    
    return `GHS ${numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleExport = () => {
    // Create CSV content
    const headers = [
      'Period',
      'Sales Target',
      'Sales Achieved',
      'Sales Commission',
      'Support Contract',
      'Support Sales',
      'Support Commission',
      'Total Commission',
      'Withholding Tax',
      'Net Commission',
      'Status',
      'Payment Date',
    ];

    const rows = filteredCommissions.map((c) => [
      formatMonth(c.month, c.year),
      c.salesTarget || 0,
      c.salesAchieved || 0,
      c.salesCommission || 0,
      c.supportContract || 0,
      c.supportEffectiveSales || 0,
      c.supportCommission || 0,
      c.totalCommission || 0,
      c.withholdingTax || 0,
      c.netCommission || 0,
      c.isPaid ? 'Paid' : 'Unpaid',
      c.paidDate ? new Date(c.paidDate).toLocaleDateString() : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Commission_Schedule_${employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Commission schedule exported');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Commission Schedule - {employeeName}
          </DialogTitle>
        </DialogHeader>

        {/* Date Filters */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="month"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="month"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.total)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.count} entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.paid)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.paidCount} paid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unpaid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(summary.unpaid)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.count - summary.paidCount} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.count > 0 ? summary.total / summary.count : 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                per period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCommissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No commission records found
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Sales Target</TableHead>
                  <TableHead className="text-right">Sales Achieved</TableHead>
                  <TableHead className="text-right">Sales Comm.</TableHead>
                  <TableHead className="text-right">Support Comm.</TableHead>
                  <TableHead className="text-right">Total Comm.</TableHead>
                  <TableHead className="text-right">WHT (5%)</TableHead>
                  <TableHead className="text-right">Net Comm.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">
                      {formatMonth(commission.month, commission.year)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(commission.salesTarget || 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(commission.salesAchieved || 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(commission.salesCommission || 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(commission.supportCommission || 0))}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(commission.totalCommission || 0))}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(Number(commission.withholdingTax || 0))}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(Number(commission.netCommission || 0))}
                    </TableCell>
                    <TableCell>
                      {commission.isPaid ? (
                        <Badge variant="default" className="bg-green-600">
                          Paid
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Unpaid</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {commission.paidDate
                        ? new Date(commission.paidDate).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleExport}
            disabled={filteredCommissions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
