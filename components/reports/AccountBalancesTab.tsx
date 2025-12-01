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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TrialBalanceReport } from './TrialBalanceReport';
import { StatementOfAccountsComponent } from './StatementOfAccountsComponent';
import { AgeingAnalysisComponent } from './AgeingAnalysisComponent';
import { apiReportService } from '@/lib/services/ApiReportService';
import { apiAccountService } from '@/lib/services/ApiAccountService';
import { toast } from 'sonner';
import type { TrialBalance, StatementOfAccounts, AgeingAnalysis } from '@/types/reports';
import type { PrimaryAccount, SecondaryAccount, HolderAccount } from '@/types/accounts';

export function AccountBalancesTab() {
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalance | null>(null);
  const [statementData, setStatementData] = useState<StatementOfAccounts | null>(null);
  const [ageingData, setAgeingData] = useState<AgeingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Trial Balance state
  const [trialBalanceFilters, setTrialBalanceFilters] = useState({
    accountType: 'secondary' as 'secondary' | 'holder',
    mode: 'monthly',
    asAtDate: new Date().toISOString().split('T')[0],
  });

  // Statement of Accounts state
  const [primaryAccounts, setPrimaryAccounts] = useState<PrimaryAccount[]>([]);
  const [secondaryAccounts, setSecondaryAccounts] = useState<SecondaryAccount[]>([]);
  const [holderAccounts, setHolderAccounts] = useState<HolderAccount[]>([]);
  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string>('');
  const [selectedSecondaryId, setSelectedSecondaryId] = useState<string>('');
  const [selectedHolderId, setSelectedHolderId] = useState<string>('');
  const [statementFromDate, setStatementFromDate] = useState<string>(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [statementToDate, setStatementToDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Ageing Analysis state
  const [ageingDate, setAgeingDate] = useState<string>(new Date().toISOString().split('T')[0]);

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

  const handleRunTrialBalance = async () => {
    setLoading(true);
    try {
      const asOfDate = new Date(trialBalanceFilters.asAtDate);
      const accountType = trialBalanceFilters.accountType === 'secondary' ? 'SECONDARY' : 'HOLDER';
      
      const data = await apiReportService.generateTrialBalance(asOfDate, accountType);
      setTrialBalanceData(data);
      setStatementData(null);
      setAgeingData(null);
      toast.success('Trial Balance generated successfully');
    } catch (error) {
      console.error('Error generating trial balance:', error);
      toast.error('Failed to generate trial balance');
    } finally {
      setLoading(false);
    }
  };

  const handleRunStatementOfAccounts = async () => {
    if (!selectedHolderId) {
      toast.error('Please select a holder account');
      return;
    }

    setLoading(true);
    try {
      const start = new Date(statementFromDate);
      const end = new Date(statementToDate);
      
      const data = await apiReportService.generateStatementOfAccounts(selectedHolderId, start, end);
      setStatementData(data);
      setTrialBalanceData(null);
      setAgeingData(null);
      toast.success('Statement of Accounts generated successfully');
    } catch (error) {
      console.error('Error generating statement of accounts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate statement of accounts';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAgeingAnalysis = async () => {
    setLoading(true);
    try {
      const asOf = new Date(ageingDate);
      
      const data = await apiReportService.generateAgeingAnalysis(asOf, 'RECEIVABLES');
      setAgeingData(data);
      setTrialBalanceData(null);
      setStatementData(null);
      toast.success('Ageing Analysis generated successfully');
    } catch (error) {
      console.error('Error generating ageing analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate ageing analysis';
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
          <CardTitle>Statement of Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Period</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Input 
                  type="date" 
                  value={statementFromDate}
                  onChange={(e) => setStatementFromDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Input 
                  type="date" 
                  value={statementToDate}
                  onChange={(e) => setStatementToDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Account</Label>
            <div className="space-y-2">
              <Label>Primary account</Label>
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
              <Label>Secondary account</Label>
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

          <Button onClick={handleRunStatementOfAccounts} disabled={loading || !selectedHolderId}>
            {loading ? 'Generating...' : 'Run'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ageing Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current date</Label>
            <Input 
              type="date" 
              value={ageingDate}
              onChange={(e) => setAgeingDate(e.target.value)}
            />
          </div>
          <Button onClick={handleRunAgeingAnalysis} disabled={loading}>
            {loading ? 'Generating...' : 'Run'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trial Balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>On ...</Label>
            <RadioGroup
              value={trialBalanceFilters.accountType}
              onValueChange={(value) =>
                setTrialBalanceFilters((prev) => ({
                  ...prev,
                  accountType: value as 'secondary' | 'holder',
                }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="secondary" id="secondary" />
                <Label htmlFor="secondary">Secondary accounts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="holder" id="holder" />
                <Label htmlFor="holder">Holder accounts</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Mode</Label>
            <Select
              value={trialBalanceFilters.mode}
              onValueChange={(value) =>
                setTrialBalanceFilters((prev) => ({ ...prev, mode: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>As at ...</Label>
            <Input
              type="date"
              value={trialBalanceFilters.asAtDate}
              onChange={(e) =>
                setTrialBalanceFilters((prev) => ({
                  ...prev,
                  asAtDate: e.target.value,
                }))
              }
            />
          </div>

          <Button onClick={handleRunTrialBalance} disabled={loading}>
            {loading ? 'Generating...' : 'Run'}
          </Button>
        </CardContent>
      </Card>

      {trialBalanceData && (
        <TrialBalanceReport
          data={trialBalanceData}
          onExport={handleExport}
          onPrint={handlePrint}
        />
      )}

      {statementData && (
        <StatementOfAccountsComponent
          data={statementData}
          onExport={handleExport}
          onPrint={handlePrint}
        />
      )}

      {ageingData && (
        <AgeingAnalysisComponent
          data={ageingData}
          onExport={handleExport}
          onPrint={handlePrint}
        />
      )}
    </>
  );
}
