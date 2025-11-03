'use client';

/**
 * Petty Cash Split Transaction Form
 * 
 * Specialized form for petty cash transactions with split entries
 * Restricted to Operating Expense accounts only
 * Uses TanStack Query for data fetching with cascading dropdowns:
 * Secondary Account (under Operating Expense) → Holder Account
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, AlertCircle, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePettyCashAccount } from '@/hooks/usePettyCash';
import { usePrimaryAccounts, useSecondaryAccounts } from '@/hooks/useAccounts';
import { PettyCashSplitEntry } from './PettyCashSplitEntry';
import { apiSplitTransactionService } from '@/lib/services/ApiSplitTransactionService';
import { useDebugMode } from '@/lib/contexts/DebugModeContext';
import { captureSplitTransaction } from '@/lib/utils/transactionDebugCapture';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SplitEntry {
  id: string;
  secondaryAccountId: string;
  holderAccountId: string;
  amount: string;
  description: string;
}

interface PettyCashSplitFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PettyCashSplitForm({
  onSuccess,
  onCancel,
}: PettyCashSplitFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [pettyCashSide, setPettyCashSide] = useState<'DEBIT' | 'CREDIT'>('CREDIT'); // Default: money out
  const [splits, setSplits] = useState<SplitEntry[]>([
    { id: '1', secondaryAccountId: '', holderAccountId: '', amount: '', description: '' },
  ]);
  const [reconciled, setReconciled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Debug mode hook
  const { settings: debugSettings, setCurrentDebugData, addToHistory, openModal } = useDebugMode();

  // TanStack Query hooks
  const { data: pettyCashAccount, isLoading: loadingPettyCash } = usePettyCashAccount();
  const { data: primaryAccounts = [], isLoading: loadingPrimary } = usePrimaryAccounts();

  // Find Operating Expense primary account
  const operatingExpensePrimary = primaryAccounts.find(
    (p) => p.type === 'EXPENSES' && p.name.toLowerCase().includes('operating') && p.isActive
  );
  
  // Debug: Log all primary accounts to see what's available
  console.log('All primary accounts:', primaryAccounts.map(p => ({ id: p.id, name: p.name, type: p.type })));
  console.log('Found operating expense primary:', operatingExpensePrimary);

  // Get secondary accounts under Operating Expense
  const { data: secondaryAccounts = [], isLoading: loadingSecondary } = useSecondaryAccounts(
    operatingExpensePrimary?.id
  );

  const addSplit = () => {
    const newId = String(splits.length + 1);
    setSplits([
      ...splits,
      { id: newId, secondaryAccountId: '', holderAccountId: '', amount: '', description: '' },
    ]);
  };

  const removeSplit = (id: string) => {
    if (splits.length > 1) {
      setSplits(splits.filter((s) => s.id !== id));
    } else {
      toast.error('At least one split entry is required');
    }
  };

  const updateSplit = (id: string, field: keyof SplitEntry, value: string) => {
    setSplits(
      splits.map((s) => {
        if (s.id === id) {
          // If changing secondary account, reset holder account
          if (field === 'secondaryAccountId') {
            return { ...s, [field]: value, holderAccountId: '' };
          }
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  const calculateTotal = () => {
    return splits.reduce((sum, split) => {
      const amount = parseFloat(split.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!pettyCashAccount) {
        throw new Error('Petty cash account not found');
      }

      // Validate splits
      const validSplits = splits.filter(
        (s) =>
          s.secondaryAccountId &&
          s.holderAccountId &&
          s.amount &&
          parseFloat(s.amount) > 0 &&
          s.description.trim()
      );

      if (validSplits.length === 0) {
        throw new Error('At least one valid split entry is required');
      }

      // Create split transaction data
      const splitData = {
        date: new Date(date),
        baseAccountId: pettyCashAccount.id,
        baseAccountSide: pettyCashSide,
        splits: validSplits.map((s) => ({
          accountId: s.holderAccountId,
          amount: parseFloat(s.amount),
          description: s.description,
          reconciled: false,
        })),
      };

      console.log('Creating split transaction with data:', JSON.stringify(splitData, null, 2));
      console.log('Valid splits:', validSplits);
      console.log('Petty cash account:', pettyCashAccount);
      
      // Debug: Check the selected accounts
      for (const split of validSplits) {
        console.log(`Split account ID: ${split.holderAccountId}`);
        // Try to fetch this account to see if it exists
        try {
          const response = await fetch(`/api/accounts/holder/${split.holderAccountId}`);
          if (response.ok) {
            const accountData = await response.json();
            console.log(`Account ${split.holderAccountId} data:`, accountData);
          } else {
            console.log(`Account ${split.holderAccountId} not found:`, response.status);
          }
        } catch (err) {
          console.log(`Error fetching account ${split.holderAccountId}:`, err);
        }
      }

      // Use the API service to create split transaction
      const result = await apiSplitTransactionService.createSplitTransaction(splitData);

      toast.success('Petty cash split transaction created successfully');
      
      // Capture debug data if debug mode is enabled
      if (debugSettings.enabled && result) {
        try {
          const debugData = await captureSplitTransaction(
            result.id,
            pettyCashAccount.id,
            pettyCashSide,
            validSplits.map(s => ({
              accountId: s.holderAccountId,
              amount: parseFloat(s.amount),
              description: s.description,
            })),
            new Date(date),
            true // is petty cash
          );
          
          setCurrentDebugData(debugData);
          addToHistory(debugData);
          
          if (debugSettings.autoShow) {
            openModal();
          }
        } catch (debugError) {
          console.error('Failed to capture debug data:', debugError);
        }
      }
      
      handleNew();

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Full error:', err);
      const errorMessage = err.message || 'Failed to save petty cash split transaction';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNew = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setPettyCashSide('CREDIT');
    setSplits([
      { id: '1', secondaryAccountId: '', holderAccountId: '', amount: '', description: '' },
    ]);
    setReconciled(false);
    setError('');
  };

  const total = calculateTotal();

  if (loadingPettyCash || loadingPrimary) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!pettyCashAccount) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Petty Cash account not found. Please create a holder account with "Petty Cash" in the name.
        </AlertDescription>
      </Alert>
    );
  }

  if (!operatingExpensePrimary) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Operating Expense primary account not found. Please ensure an EXPENSES type primary
          account exists.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Petty Cash Transaction</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create a petty cash transaction with one or more Operating Expense accounts
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Date and Petty Cash Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Petty Cash Direction</Label>
              <Select
                value={pettyCashSide}
                onValueChange={(value: 'DEBIT' | 'CREDIT') => setPettyCashSide(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">Money In (Debit Petty Cash)</SelectItem>
                  <SelectItem value="CREDIT">Money Out (Credit Petty Cash)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {pettyCashSide === 'DEBIT'
                  ? 'Petty cash receives money, expenses pay out'
                  : 'Petty cash pays out, expenses receive money'}
              </p>
            </div>
          </div>

          {/* Petty Cash Account (Fixed) */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Petty Cash Account (Fixed)</Label>
            <div className="p-4 border rounded-lg bg-muted/50">
              <Input
                value={`${pettyCashAccount.code} - ${pettyCashAccount.name}`}
                disabled
                className="bg-background font-medium"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Current Balance: {new Intl.NumberFormat('en-GH', {
                  style: 'currency',
                  currency: 'GHS',
                }).format(Number(pettyCashAccount.balance))}
              </p>
            </div>
          </div>

          {/* Split Entries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Operating Expense Split Entries
              </Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addSplit}
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Split
              </Button>
            </div>

            <div className="space-y-4">
              {splits.map((split, index) => (
                <PettyCashSplitEntry
                  key={split.id}
                  split={split}
                  index={index}
                  secondaryAccounts={secondaryAccounts}
                  loadingSecondary={loadingSecondary}
                  isSubmitting={isSubmitting}
                  canRemove={splits.length > 1}
                  onUpdate={updateSplit}
                  onRemove={removeSplit}
                />
              ))}
            </div>

            {/* Total */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat('en-GH', {
                    style: 'currency',
                    currency: 'GHS',
                  }).format(total)}
                </span>
              </div>
            </Card>
          </div>

          {/* Reconciled */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reconciled"
              checked={reconciled}
              onCheckedChange={(checked) => setReconciled(checked as boolean)}
              disabled={isSubmitting}
            />
            <Label htmlFor="reconciled" className="cursor-pointer">
              Mark all entries as reconciled
            </Label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleNew}
              disabled={isSubmitting}
            >
              New
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || splits.length === 0 || total === 0}
            >
              {isSubmitting ? 'Saving...' : 'Save Split Transaction'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
