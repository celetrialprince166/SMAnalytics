'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AccountSelector } from '@/components/accounts/AccountSelector';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { apiSplitTransactionService } from '@/lib/services/ApiSplitTransactionService';
import { accountService } from '@/lib/services/AccountService';
import { toast } from 'sonner';
import { AccountOption } from '@/types';

interface SplitEntry {
  id: string;
  accountId: string;
  amount: string;
  description: string;
}

interface SplitTransactionFormProps {
  splitTransactionId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SplitTransactionForm({
  splitTransactionId,
  onSuccess,
  onCancel,
}: SplitTransactionFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [baseAccountId, setBaseAccountId] = useState('');
  const [baseAccountSide, setBaseAccountSide] = useState<'DEBIT' | 'CREDIT'>('CREDIT');
  const [splits, setSplits] = useState<SplitEntry[]>([
    { id: '1', accountId: '', amount: '', description: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);

  useEffect(() => {
    loadAccountOptions();
    if (splitTransactionId) {
      loadSplitTransaction(splitTransactionId);
    }
  }, [splitTransactionId]);

  const loadAccountOptions = async () => {
    try {
      const options = await accountService.getAccountOptions();
      setAccountOptions(options);
    } catch (err) {
      console.error('Failed to load account options:', err);
    }
  };

  const loadSplitTransaction = async (id: string) => {
    try {
      const split = await apiSplitTransactionService.getSplitTransactionById(id);
      if (split) {
        setDate(new Date(split.date).toISOString().split('T')[0]);
        setBaseAccountId(split.baseAccountId);
        setBaseAccountSide(split.baseAccountSide);
        const splitsData = Array.isArray(split.splits) ? split.splits : [];
        setSplits(
          splitsData.map((s: any, index: number) => ({
            id: String(index + 1),
            accountId: s.accountId,
            amount: s.amount.toString(),
            description: s.description,
          }))
        );
      }
    } catch (err) {
      setError('Failed to load split transaction');
    }
  };

  const addSplit = () => {
    const newId = String(splits.length + 1);
    setSplits([...splits, { id: newId, accountId: '', amount: '', description: '' }]);
  };

  const removeSplit = (id: string) => {
    if (splits.length > 1) {
      setSplits(splits.filter((s) => s.id !== id));
    }
  };

  const updateSplit = (id: string, field: keyof SplitEntry, value: string) => {
    setSplits(
      splits.map((s) => (s.id === id ? { ...s, [field]: value } : s))
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
    setIsLoading(true);

    try {
      // Validate splits
      const validSplits = splits.filter(
        (s) => s.accountId && s.amount && parseFloat(s.amount) > 0 && s.description
      );

      if (validSplits.length === 0) {
        throw new Error('At least one valid split is required');
      }

      if (!baseAccountId) {
        throw new Error('Base account is required');
      }

      const splitData = {
        date: new Date(date),
        baseAccountId,
        baseAccountSide,
        splits: validSplits.map((s) => ({
          accountId: s.accountId,
          amount: parseFloat(s.amount),
          description: s.description,
          reconciled: false,
        })),
      };

      if (splitTransactionId) {
        await apiSplitTransactionService.updateSplitTransaction(splitTransactionId, splitData);
        toast.success('Split transaction updated successfully');
      } else {
        await apiSplitTransactionService.createSplitTransaction(splitData);
        toast.success('Split transaction created successfully');
        handleNew();
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save split transaction');
      toast.error(err.message || 'Failed to save split transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setBaseAccountId('');
    setBaseAccountSide('CREDIT');
    setSplits([{ id: '1', accountId: '', amount: '', description: '' }]);
    setError('');
  };

  const total = calculateTotal();
  const baseAccountName = accountOptions.find((a) => a.id === baseAccountId)?.fullPath || '';

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {splitTransactionId ? 'Edit Split Transaction' : 'New Split Transaction'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Date and Base Account */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseAccountSide">Base Account Side</Label>
              <Select
                value={baseAccountSide}
                onValueChange={(value: 'DEBIT' | 'CREDIT') => setBaseAccountSide(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">Debit (Money In)</SelectItem>
                  <SelectItem value="CREDIT">Credit (Money Out)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {baseAccountSide === 'DEBIT'
                  ? 'Base account receives money, splits pay out'
                  : 'Base account pays out, splits receive money'}
              </p>
            </div>
          </div>

          {/* Base Account */}
          <div className="space-y-2">
            <Label>Base Account</Label>
            <AccountSelector
              value={baseAccountId}
              onChange={setBaseAccountId}
              placeholder="Select base account"
            />
            {baseAccountName && (
              <p className="text-sm text-muted-foreground">{baseAccountName}</p>
            )}
          </div>

          {/* Splits */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Split Entries</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSplit}>
                <Plus className="h-4 w-4 mr-2" />
                Add Split
              </Button>
            </div>

            <div className="space-y-4">
              {splits.map((split, index) => (
                <Card key={split.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Split {index + 1}</Label>
                      {splits.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSplit(split.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Account</Label>
                        <AccountSelector
                          value={split.accountId}
                          onChange={(value) => updateSplit(split.id, 'accountId', value)}
                          placeholder="Select account"
                          excludeAccountId={baseAccountId}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={split.amount}
                          onChange={(e) => updateSplit(split.id, 'amount', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={split.description}
                          onChange={(e) => updateSplit(split.id, 'description', e.target.value)}
                          placeholder="Enter description for this split"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Total */}
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-GH', {
                    style: 'currency',
                    currency: 'GHS',
                  }).format(total)}
                </span>
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleNew}>
              New
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : splitTransactionId ? 'Update' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
