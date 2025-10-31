'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { reportService } from '@/lib/services/ReportService';
import type { BalanceSheet } from '@/types/reports';

export function BalanceSheetReport() {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBalanceSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await reportService.generateBalanceSheet(asOfDate);
      setBalanceSheet(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balance sheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalanceSheet();
  }, [asOfDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Statement of Financial Position</h2>
          <p className="text-sm text-muted-foreground">
            As at {format(asOfDate, 'MMMM dd, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(asOfDate, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={asOfDate}
                onSelect={(date) => date && setAsOfDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Balance Sheet */}
      {!loading && balanceSheet && (
        <div className="space-y-6">
          {/* Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {balanceSheet.assets.subsections.map((subsection, idx) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="font-semibold text-sm">{subsection.title}</h4>
                    <div className="space-y-2">
                      {subsection.categories && subsection.categories.map((category, catIdx) => (
                        <div key={catIdx} className="space-y-1">
                          <div className="text-sm font-medium pl-2">{category.title}</div>
                          {category.lineItems.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex justify-between text-sm pl-6">
                              <span className="text-muted-foreground">{item.accountName}</span>
                              <span>{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                          {category.lineItems.length > 1 && (
                            <div className="flex justify-between text-sm pl-6 text-muted-foreground italic">
                              <span>Subtotal</span>
                              <span>{formatCurrency(category.subtotal)}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-medium pt-2 border-t">
                        <span>Total {subsection.title}</span>
                        <span>{formatCurrency(subsection.subtotal)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-base pt-4 border-t-2">
                  <span>Total Assets</span>
                  <span>{formatCurrency(balanceSheet.totalAssets)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liabilities & Equity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Liabilities & Shareholders Equity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Liabilities */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Liabilities</h4>
                  {balanceSheet.liabilities.subsections.map((subsection, idx) => (
                    <div key={idx} className="space-y-3">
                      <h5 className="font-medium text-sm">{subsection.title}</h5>
                      <div className="space-y-2">
                        {subsection.categories && subsection.categories.map((category, catIdx) => (
                          <div key={catIdx} className="space-y-1">
                            <div className="text-sm font-medium pl-2">{category.title}</div>
                            {category.lineItems.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex justify-between text-sm pl-6">
                                <span className="text-muted-foreground">{item.accountName}</span>
                                <span>{formatCurrency(item.amount)}</span>
                              </div>
                            ))}
                            {category.lineItems.length > 1 && (
                              <div className="flex justify-between text-sm pl-6 text-muted-foreground italic">
                                <span>Subtotal</span>
                                <span>{formatCurrency(category.subtotal)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-medium pt-2 border-t">
                          <span>Total {subsection.title}</span>
                          <span>{formatCurrency(subsection.subtotal)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total Liabilities</span>
                    <span>{formatCurrency(balanceSheet.totalLiabilities)}</span>
                  </div>
                </div>

                {/* Equity */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Shareholders Equity</h4>
                  {balanceSheet.equity.subsections.map((subsection, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="space-y-2">
                        {subsection.categories && subsection.categories.map((category, catIdx) => (
                          <div key={catIdx} className="space-y-1">
                            <div className="text-sm font-medium pl-2">{category.title}</div>
                            {category.lineItems.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex justify-between text-sm pl-6">
                                <span className="text-muted-foreground">{item.accountName}</span>
                                <span>{formatCurrency(item.amount)}</span>
                              </div>
                            ))}
                            {category.lineItems.length > 1 && (
                              <div className="flex justify-between text-sm pl-6 text-muted-foreground italic">
                                <span>Subtotal</span>
                                <span>{formatCurrency(category.subtotal)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total Equity</span>
                    <span>{formatCurrency(balanceSheet.totalEquity)}</span>
                  </div>
                </div>

                {/* Total Liabilities & Equity */}
                <div className="flex justify-between font-bold text-base pt-4 border-t-2">
                  <span>Total Liabilities & Equity</span>
                  <span>{formatCurrency(balanceSheet.totalLiabilities + balanceSheet.totalEquity)}</span>
                </div>

                {/* Balance Check */}
                {Math.abs(balanceSheet.totalAssets - (balanceSheet.totalLiabilities + balanceSheet.totalEquity)) > 0.01 && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                    ⚠️ Balance Sheet does not balance! Please review your accounts.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
