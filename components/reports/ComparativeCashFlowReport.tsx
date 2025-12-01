'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { apiReportService } from '@/lib/services/ApiReportService';
import { ReportHeader } from './ReportHeader';
import type { ComparativeCashFlowStatement } from '@/types/reports';

export function ComparativeCashFlowReport() {
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [numberOfPeriods, setNumberOfPeriods] = useState<number>(3);
  const [periodType, setPeriodType] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [cashFlow, setCashFlow] = useState<ComparativeCashFlowStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCashFlow = async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await apiReportService.generateComparativeCashFlowStatement(
        startDate,
        numberOfPeriods,
        periodType
      );
      setCashFlow(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparative cash flow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashFlow();
  }, [startDate, numberOfPeriods, periodType]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatAmount = (amount: number) => {
    const formatted = formatCurrency(Math.abs(amount));
    return amount < 0 ? `(${formatted})` : formatted;
  };

  const formatPeriodHeader = (period: { startDate: Date; endDate: Date }) => {
    if (periodType === 'MONTHLY') {
      return format(period.endDate, 'dd MMM yy');
    } else {
      return format(period.endDate, 'yyyy');
    }
  };

  const handleExport = (format: 'PDF' | 'EXCEL') => {
    console.log(`Exporting as ${format}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="mt-6 print:shadow-none">
      <CardHeader>
        <ReportHeader
          title="Comparative Cash Flow Statement"
          subtitle={`${periodType === 'MONTHLY' ? 'Month-by-Month' : 'Year-by-Year'} Comparison`}
          onExport={handleExport}
          onPrint={handlePrint}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Start: {format(startDate, 'MMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select value={periodType} onValueChange={(value: 'MONTHLY' | 'YEARLY') => setPeriodType(value)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={numberOfPeriods.toString()} onValueChange={(value) => setNumberOfPeriods(parseInt(value))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Periods</SelectItem>
              <SelectItem value="3">3 Periods</SelectItem>
              <SelectItem value="6">6 Periods</SelectItem>
              <SelectItem value="12">12 Periods</SelectItem>
            </SelectContent>
          </Select>
        </ReportHeader>
      </CardHeader>

      <CardContent>
        {/* Error */}
        {error && (
          <div className="border border-destructive rounded-md p-4 mb-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Comparative Cash Flow */}
        {!loading && cashFlow && (
          <div className="space-y-6">
            {/* Operating Activities */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold border-b pb-2">{cashFlow.operatingActivities.title}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Description</th>
                      {cashFlow.periods.map((period, idx) => (
                        <th key={idx} className="text-right py-2 font-medium px-4">
                          {formatPeriodHeader(period)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlow.operatingActivities.lineItems.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 text-muted-foreground">{item.description}</td>
                        {item.amounts.map((amount, periodIdx) => (
                          <td key={periodIdx} className={`text-right py-2 px-4 ${amount < 0 ? 'text-destructive' : ''}`}>
                            {formatAmount(amount)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="font-semibold border-t-2">
                      <td className="py-3">Net Cash from Operating Activities</td>
                      {cashFlow.operatingActivities.totals.map((total, idx) => (
                        <td key={idx} className={`text-right py-3 px-4 ${total < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {formatAmount(total)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Investing Activities */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold border-b pb-2">{cashFlow.investingActivities.title}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Description</th>
                      {cashFlow.periods.map((period, idx) => (
                        <th key={idx} className="text-right py-2 font-medium px-4">
                          {formatPeriodHeader(period)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlow.investingActivities.lineItems.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 text-muted-foreground">{item.description}</td>
                        {item.amounts.map((amount, periodIdx) => (
                          <td key={periodIdx} className={`text-right py-2 px-4 ${amount < 0 ? 'text-destructive' : ''}`}>
                            {formatAmount(amount)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="font-semibold border-t-2">
                      <td className="py-3">Net Cash from Investing Activities</td>
                      {cashFlow.investingActivities.totals.map((total, idx) => (
                        <td key={idx} className={`text-right py-3 px-4 ${total < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {formatAmount(total)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financing Activities */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold border-b pb-2">{cashFlow.financingActivities.title}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Description</th>
                      {cashFlow.periods.map((period, idx) => (
                        <th key={idx} className="text-right py-2 font-medium px-4">
                          {formatPeriodHeader(period)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlow.financingActivities.lineItems.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 text-muted-foreground">{item.description}</td>
                        {item.amounts.map((amount, periodIdx) => (
                          <td key={periodIdx} className={`text-right py-2 px-4 ${amount < 0 ? 'text-destructive' : ''}`}>
                            {formatAmount(amount)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="font-semibold border-t-2">
                      <td className="py-3">Net Cash from Financing Activities</td>
                      {cashFlow.financingActivities.totals.map((total, idx) => (
                        <td key={idx} className={`text-right py-3 px-4 ${total < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {formatAmount(total)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold border-b pb-2">Cash Flow Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Item</th>
                      {cashFlow.periods.map((period, idx) => (
                        <th key={idx} className="text-right py-2 font-medium px-4">
                          {formatPeriodHeader(period)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Net Cash Flows</td>
                      {cashFlow.netCashFlows.map((amount, idx) => (
                        <td key={idx} className={`text-right py-2 px-4 font-medium ${amount < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {formatAmount(amount)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Beginning Cash & Bank Balances</td>
                      {cashFlow.beginningCash.map((amount, idx) => (
                        <td key={idx} className="text-right py-2 px-4">
                          {formatAmount(amount)}
                        </td>
                      ))}
                    </tr>
                    <tr className="font-bold border-t-2">
                      <td className="py-3">Ending Cash & Bank Balances</td>
                      {cashFlow.endingCash.map((amount, idx) => (
                        <td key={idx} className="text-right py-3 px-4">
                          {formatAmount(amount)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 italic">
          Generated on {format(new Date(), 'MMMM dd, yyyy')}
        </div>
      </CardContent>
    </Card>
  );
}
