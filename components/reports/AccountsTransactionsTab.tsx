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
import { PettyCashAnalysisComponent } from './PettyCashAnalysisComponent';
import { AccountTransactionsReportComponent } from './AccountTransactionsReportComponent';
import { apiReportService } from '@/lib/services/ApiReportService';
import { apiAccountService } from '@/lib/services/ApiAccountService';
import { toast } from 'sonner';
import type { PettyCashAnalysis, AccountReport } from '@/types/reports';
import type { PrimaryAccount, SecondaryAccount, HolderAccount } from '@/types/accounts';

export function AccountsTransactionsTab() {
  const [pettyCashData, setPettyCashData] = useState<PettyCashAnalysis | null>(null);
  const [accountReportData, setAccountReportData] = useState<AccountReport | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Petty Cash state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');

  // Account Transactions state
  const [primaryAccounts, setPrimaryAccounts] = useState<PrimaryAccount[]>([]);
  const [secondaryAccounts, setSecondaryAccounts] = useState<SecondaryAccount[]>([]);
  const [holderAccounts, setHolderAccounts] = useState<HolderAccount[]>([]);
  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string>('');
  const [selectedSecondaryId, setSelectedSecondaryId] = useState<string>('');
  const [selectedHolderId, setSelectedHolderId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      setMonth(monthNames[date.getMonth()]);
      setYear(date.getFullYear().toString());
    }
  }, [selectedDate]);

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
      loadHolderAccounts(selectedSecondaryId);
    } else {
      setHolderAccounts([]);
      setSelectedHolderId('');
    }
  }, [selectedSecondaryId]);

  const loadAccounts = async () => {
    try {
      const hierarchy = await apiAccountService.getAccountHierarchy();
      setPrimaryAccounts(hierarchy.primary);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    }
  };

  const loadSecondaryAccounts = async (primaryId: string) => {
    try {
      const secondaries = await apiAccountService.getSecondaryAccounts(primaryId);
      setSecondaryAccounts(secondaries);
    } catch (error) {
      console.error('Error loading secondary accounts:', error);
      toast.error('Failed to load secondary accounts');
    }
  };

  const loadHolderAccounts = async (secondaryId: string) => {
    try {
      const holders = await apiAccountService.getHolderAccounts(secondaryId);
      setHolderAccounts(holders);
    } catch (error) {
      console.error('Error loading holder accounts:', error);
      toast.error('Failed to load holder accounts');
    }
  };

  const handleGeneratePettyCash = async () => {
    setLoading(true);
    try {
      const date = new Date(selectedDate);
      const monthNum = date.getMonth() + 1;
      const yearNum = date.getFullYear();
      
      const data = await apiReportService.generatePettyCashAnalysis(monthNum, yearNum);
      setPettyCashData(data);
      setAccountReportData(null);
      toast.success('Petty Cash Analysis generated successfully');
    } catch (error) {
      console.error('Error generating petty cash analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate petty cash analysis';
      
      if (errorMessage.includes('Petty cash account not found')) {
        toast.error('Petty cash account not found. Please create a holder account with "Petty Cash" in the name.', {
          duration: 5000,
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAccountReport = async () => {
    if (!selectedHolderId) {
      toast.error('Please select a holder account');
      return;
    }

    setLoading(true);
    try {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      
      const data = await apiReportService.generateAccountReport(selectedHolderId, start, end);
      setAccountReportData(data);
      setPettyCashData(null);
      toast.success('Account Transactions Report generated successfully');
    } catch (error) {
      console.error('Error generating account report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate account report';
      toast.error(errorMessage);
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
          <CardTitle>Petty Cash Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Input value={month} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input value={year} readOnly />
            </div>
          </div>
          <Button onClick={handleGeneratePettyCash} disabled={loading}>
            {loading ? 'Generating...' : 'Run'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Transactions Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Period</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Account</Label>
            <div className="space-y-2">
              <Label>Primary Account</Label>
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
              <Label>Secondary Account</Label>
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
            <div className="space-y-2">
              <Label>Holder Account</Label>
              <Select 
                value={selectedHolderId} 
                onValueChange={setSelectedHolderId}
                disabled={!selectedSecondaryId || holderAccounts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select holder account" />
                </SelectTrigger>
                <SelectContent>
                  {holderAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerateAccountReport} disabled={loading || !selectedHolderId}>
            {loading ? 'Generating...' : 'Run'}
          </Button>
        </CardContent>
      </Card>

      {pettyCashData && (
        <PettyCashAnalysisComponent
          data={pettyCashData}
          onExport={handleExport}
          onPrint={handlePrint}
        />
      )}

      {accountReportData && (
        <AccountTransactionsReportComponent
          data={accountReportData}
          onExport={handleExport}
          onPrint={handlePrint}
        />
      )}
    </>
  );
}
