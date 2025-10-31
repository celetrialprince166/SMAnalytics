'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IncomeStatementReport } from './IncomeStatementReport';
import { BalanceSheetReport } from './BalanceSheetReport';
import { CashFlowStatementReport } from './CashFlowStatementReport';
import { ComparativeCashFlowReport } from './ComparativeCashFlowReport';
import { ComparativeAccountReportComponent } from './ComparativeAccountReportComponent';
import { reportService } from '@/lib/services/ReportService';
import { accountService } from '@/lib/services/AccountService';
import { toast } from 'sonner';
import type { IncomeStatement, ComparativeAccountReport } from '@/types/reports';
import type { PrimaryAccount, SecondaryAccount } from '@/types/accounts';

export function FinancialAccountsTab() {
  const [incomeStatementData, setIncomeStatementData] = useState<IncomeStatement | null>(null);
  const [comparativeAccountData, setComparativeAccountData] = useState<ComparativeAccountReport | null>(null);
  const [activeReport, setActiveReport] = useState<'income' | 'balance' | 'cashflow' | 'comparative-cashflow' | 'comparative-account' | null>(null);
  const [loading, setLoading] = useState(false);
  const [primaryAccounts, setPrimaryAccounts] = useState<PrimaryAccount[]>([]);
  const [secondaryAccounts, setSecondaryAccounts] = useState<SecondaryAccount[]>([]);
  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string>('');
  const [selectedSecondaryId, setSelectedSecondaryId] = useState<string>('');
  const [periodType, setPeriodType] = useState<'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'>('QUARTERLY');
  const [holderAccountCount, setHolderAccountCount] = useState<number>(0);
  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    periods: '4',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedPrimaryId) {
      loadSecondaryAccounts(selectedPrimaryId);
    } else {
      setSecondaryAccounts([]);
      setSelectedSecondaryId('');
    }
  }, [selectedPrimaryId]);

  useEffect(() => {
    if (selectedSecondaryId) {
      checkHolderAccounts(selectedSecondaryId);
    }
  }, [selectedSecondaryId]);

  const loadAccounts = async () => {
    try {
      const hierarchy = await accountService.getAccountHierarchy();
      setPrimaryAccounts(hierarchy.primary);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    }
  };

  const loadSecondaryAccounts = async (primaryId: string) => {
    try {
      const secondaries = await accountService.getSecondaryAccounts(primaryId);
      setSecondaryAccounts(secondaries);
    } catch (error) {
      console.error('Error loading secondary accounts:', error);
      toast.error('Failed to load secondary accounts');
    }
  };

  const checkHolderAccounts = async (secondaryId: string) => {
    try {
      const holders = await accountService.getHolderAccounts(secondaryId);
      setHolderAccountCount(holders.length);
    } catch (error) {
      console.error('Error checking holder accounts:', error);
      setHolderAccountCount(0);
    }
  };

  const handleGenerateIncomeStatement = async () => {
    setLoading(true);
    try {
      const startDate = new Date(filters.fromDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(filters.periods));
      
      const data = await reportService.generateIncomeStatement(startDate, endDate);
      setIncomeStatementData(data);
      toast.success('Income Statement generated successfully');
    } catch (error) {
      console.error('Error generating income statement:', error);
      toast.error('Failed to generate income statement');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateComparativeAccountReport = async () => {
    if (!selectedSecondaryId) {
      toast.error('Please select a secondary account');
      return;
    }

    setLoading(true);
    try {
      const startDate = new Date(filters.fromDate);
      const numberOfPeriods = parseInt(filters.periods);
      
      const data = await reportService.generateComparativeAccountReport(
        selectedSecondaryId,
        startDate,
        numberOfPeriods,
        periodType
      );
      setComparativeAccountData(data);
      setActiveReport('comparative-account');
      toast.success('Comparative Account Report generated successfully');
    } catch (error) {
      console.error('Error generating comparative account report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate comparative account report';
      
      if (errorMessage.includes('No holder accounts found')) {
        toast.error('No holder accounts found. Please create holder accounts under this secondary account first.', {
          duration: 5000,
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'PDF' | 'EXCEL') => {
    toast.info(`Exporting to ${format}... (Feature coming soon)`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Accounting Reports & Statements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label className="text-base font-semibold">Select Period Type</Label>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="monthly" 
                checked={periodType === 'MONTHLY'}
                onCheckedChange={(checked) => checked && setPeriodType('MONTHLY')}
              />
              <Label htmlFor="monthly">Monthly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="quarterly" 
                checked={periodType === 'QUARTERLY'}
                onCheckedChange={(checked) => checked && setPeriodType('QUARTERLY')}
              />
              <Label htmlFor="quarterly">Quarterly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="semi-annually" 
                checked={periodType === 'SEMI_ANNUALLY'}
                onCheckedChange={(checked) => checked && setPeriodType('SEMI_ANNUALLY')}
              />
              <Label htmlFor="semi-annually">Semi-annually</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="annually" 
                checked={periodType === 'ANNUALLY'}
                onCheckedChange={(checked) => checked && setPeriodType('ANNUALLY')}
              />
              <Label htmlFor="annually">Annually</Label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>From</Label>
            <Input 
              type="date" 
              value={filters.fromDate}
              onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Number of Periods</Label>
            <Select 
              value={filters.periods}
              onValueChange={(value) => setFilters(prev => ({ ...prev, periods: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Periods</SelectItem>
                <SelectItem value="3">3 Periods</SelectItem>
                <SelectItem value="4">4 Periods</SelectItem>
                <SelectItem value="6">6 Periods</SelectItem>
                <SelectItem value="12">12 Periods</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-base font-semibold mb-4">Comparative Account Report</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate a report showing sub-accounts (holder accounts) across multiple periods.
            <br />
            <span className="text-xs italic">
              Note: This report requires holder accounts under the selected secondary account. 
              If you get an error, create holder accounts first in Manage → Accounts.
            </span>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Primary Account</Label>
              <Select value={selectedPrimaryId} onValueChange={setSelectedPrimaryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary account" />
                </SelectTrigger>
                <SelectContent>
                  {primaryAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Secondary Account</Label>
              <Select 
                value={selectedSecondaryId} 
                onValueChange={setSelectedSecondaryId}
                disabled={!selectedPrimaryId || secondaryAccounts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select secondary account" />
                </SelectTrigger>
                <SelectContent>
                  {secondaryAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {selectedSecondaryId && (
              <p className="text-xs text-muted-foreground">
                {holderAccountCount > 0 
                  ? `✓ Found ${holderAccountCount} holder account${holderAccountCount !== 1 ? 's' : ''} under this secondary account`
                  : '⚠ No holder accounts found. Please create holder accounts first in Manage → Accounts.'}
              </p>
            )}
            <Button 
              onClick={handleGenerateComparativeAccountReport} 
              disabled={loading || !selectedSecondaryId || holderAccountCount === 0}
            >
              {loading ? 'Generating...' : 'Run Comparative Report'}
            </Button>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-base font-semibold mb-4">Financial Statements</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate Income Statement, Balance Sheet, and Cash Flow Statement
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                handleGenerateIncomeStatement();
                setActiveReport('income');
              }} 
              disabled={loading}
              variant={activeReport === 'income' ? 'default' : 'outline'}
            >
              Income Statement
            </Button>
            <Button 
              onClick={() => setActiveReport('balance')} 
              variant={activeReport === 'balance' ? 'default' : 'outline'}
            >
              Balance Sheet
            </Button>
            <Button 
              onClick={() => setActiveReport('cashflow')} 
              variant={activeReport === 'cashflow' ? 'default' : 'outline'}
            >
              Cash Flow
            </Button>
            <Button 
              onClick={() => setActiveReport('comparative-cashflow')} 
              variant={activeReport === 'comparative-cashflow' ? 'default' : 'outline'}
            >
              Comparative Cash Flow
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    {activeReport === 'income' && incomeStatementData && (
      <IncomeStatementReport
        data={incomeStatementData}
        onExport={handleExport}
        onPrint={handlePrint}
      />
    )}

    {activeReport === 'balance' && (
      <BalanceSheetReport />
    )}

    {activeReport === 'cashflow' && (
      <CashFlowStatementReport />
    )}

    {activeReport === 'comparative-cashflow' && (
      <ComparativeCashFlowReport />
    )}

    {activeReport === 'comparative-account' && comparativeAccountData && (
      <ComparativeAccountReportComponent
        data={comparativeAccountData}
        onExport={handleExport}
        onPrint={handlePrint}
      />
    )}
  </>
  );
}
