'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { apiReportService } from '@/lib/services/ApiReportService';
import { ReportHeader } from './ReportHeader';
import type { CashFlowStatement } from '@/types/reports';

export function CashFlowStatementReport() {
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [cashFlow, setCashFlow] = useState<CashFlowStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCashFlow = async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await apiReportService.generateCashFlowStatement(startDate, endDate);
      setCashFlow(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cash flow statement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashFlow();
  }, [startDate, endDate]);

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
          title="Statement of Cash Flows"
          subtitle={`For the period ${format(startDate, 'MMM dd, yyyy')} to ${format(endDate, 'MMM dd, yyyy')}`}
          onExport={handleExport}
          onPrint={handlePrint}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Start: {format(startDate, 'MMM dd')}
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                End: {format(endDate, 'MMM dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
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

        {/* Cash Flow Statement */}
        {!loading && cashFlow && (
          <div className="space-y-6">
            {/* Operating Activities */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold border-b pb-2">{cashFlow.operatingActivities.title}</h3>
              <div className="space-y-1">
                {cashFlow.operatingActivities.lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className={idx === 0 ? 'font-medium' : 'text-muted-foreground pl-4'}>
                      {item.description}
                    </span>
                    <span className={item.amount < 0 ? 'text-destructive' : ''}>
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold pt-4 border-t-2 mt-4">
                  <span>Net Cash from Operating Activities</span>
                  <span className={cashFlow.operatingActivities.total < 0 ? 'text-destructive' : 'text-green-600'}>
                    {formatAmount(cashFlow.operatingActivities.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Investing Activities */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold border-b pb-2">{cashFlow.investingActivities.title}</h3>
              <div className="space-y-1">
                {cashFlow.investingActivities.lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.description}</span>
                    <span className={item.amount < 0 ? 'text-destructive' : ''}>
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold pt-4 border-t-2 mt-4">
                  <span>Net Cash from Investing Activities</span>
                  <span className={cashFlow.investingActivities.total < 0 ? 'text-destructive' : 'text-green-600'}>
                    {formatAmount(cashFlow.investingActivities.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Financing Activities */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold border-b pb-2">{cashFlow.financingActivities.title}</h3>
              <div className="space-y-1">
                {cashFlow.financingActivities.lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.description}</span>
                    <span className={item.amount < 0 ? 'text-destructive' : ''}>
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold pt-4 border-t-2 mt-4">
                  <span>Net Cash from Financing Activities</span>
                  <span className={cashFlow.financingActivities.total < 0 ? 'text-destructive' : 'text-green-600'}>
                    {formatAmount(cashFlow.financingActivities.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold border-b pb-2">Cash Flow Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Net Cash Flows</span>
                  <span className={cashFlow.netCashFlow < 0 ? 'text-destructive font-medium' : 'text-green-600 font-medium'}>
                    {formatAmount(cashFlow.netCashFlow)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Beginning Cash & Bank Balances</span>
                  <span>{formatAmount(cashFlow.beginningCash)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t-2">
                  <span>Ending Cash & Bank Balances</span>
                  <span>{formatAmount(cashFlow.endingCash)}</span>
                </div>

                {/* Reconciliation Check */}
                {Math.abs(cashFlow.endingCash - (cashFlow.beginningCash + cashFlow.netCashFlow)) > 0.01 && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mt-4">
                    ⚠️ Cash flow does not reconcile! Please review your calculations.
                  </div>
                )}
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
