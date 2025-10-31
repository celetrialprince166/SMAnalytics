'use client';

/**
 * Petty Cash Transaction Form Component
 * 
 * Specialized form for petty cash transactions with account restrictions
 * Uses TanStack Query for data management
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { AccountSelector } from '@/components/accounts/AccountSelector';
import { Loader2, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { 
  usePettyCashAccount, 
  useCreatePettyCashTransaction,
  useUpdatePettyCashTransaction 
} from '@/hooks/usePettyCash';
import {
  useNextTransactionNumber,
  useTransactionsByDate,
  useTransaction
} from '@/hooks/useTransactions';

interface PettyCashTransactionFormProps {
  transactionId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PettyCashTransactionForm({
  transactionId,
  onSuccess,
  onCancel,
}: PettyCashTransactionFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [pettyCashSide, setPettyCashSide] = useState<'debit' | 'credit'>('credit'); // Default: money out
  const [otherAccountId, setOtherAccountId] = useState('');
  const [reconciled, setReconciled] = useState(false);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Date navigation state
  const [dateSearch, setDateSearch] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);

  // TanStack Query hooks
  const { data: pettyCashAccount, isLoading: loadingPettyCash } = usePettyCashAccount();
  const { data: nextNumberData } = useNextTransactionNumber(
    new Date(date),
    'petty',
    !isEditMode && !transactionId
  );
  const { data: transactionsData } = useTransactionsByDate(dateSearch ? date : undefined);
  const { data: existingTransaction, isLoading: loadingTransaction } = useTransaction(transactionId);
  
  const createMutation = useCreatePettyCashTransaction();
  const updateMutation = useUpdatePettyCashTransaction();

  const transactions = transactionsData || [];
  const totalCount = transactions.length;

  // Load existing transaction for edit mode
  useEffect(() => {
    if (existingTransaction && transactionId) {
      setDate(new Date(existingTransaction.date).toISOString().split('T')[0]);
      setTransactionNumber(existingTransaction.number);
      setDescription(existingTransaction.description);
      setAmount(existingTransaction.amount.toString());
      setReconciled(existingTransaction.reconciled);
      setIsEditMode(true);

      // Determine which side petty cash is on
      if (pettyCashAccount) {
        if (existingTransaction.debitAccountId === pettyCashAccount.id) {
          setPettyCashSide('debit');
          setOtherAccountId(existingTransaction.creditAccountId);
        } else {
          setPettyCashSide('credit');
          setOtherAccountId(existingTransaction.debitAccountId);
        }
      }
    }
  }, [existingTransaction, transactionId, pettyCashAccount]);

  // Update transaction number when date or nextNumberData changes
  useEffect(() => {
    if (!isEditMode && nextNumberData?.base) {
      setTransactionNumber(`${nextNumberData.base}.01`);
    }
  }, [nextNumberData, isEditMode]);

  const handleNew = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setAmount('');
    setPettyCashSide('credit');
    setOtherAccountId('');
    setReconciled(false);
    setError('');
    setIsEditMode(false);
    setCurrentPosition(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!pettyCashAccount) {
        throw new Error('Petty cash account not found');
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount greater than zero');
      }

      if (!otherAccountId) {
        throw new Error('Please select the other account');
      }

      const transactionData = {
        date: new Date(date),
        number: transactionNumber,
        description,
        amount: amountNum,
        debitAccountId: pettyCashSide === 'debit' ? pettyCashAccount.id : otherAccountId,
        creditAccountId: pettyCashSide === 'credit' ? pettyCashAccount.id : otherAccountId,
        reconciled,
        pettyCashSide,
      };

      if (isEditMode && transactionId) {
        await updateMutation.mutateAsync({
          transactionId,
          data: transactionData,
        });
      } else {
        await createMutation.mutateAsync(transactionData);
        handleNew();
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save petty cash transaction');
      toast.error(err.message || 'Failed to save petty cash transaction');
    }
  };

  // Navigation handlers
  const loadTransaction = (transaction: any, position: number) => {
    if (transaction) {
      setDate(new Date(transaction.date).toISOString().split('T')[0]);
      setTransactionNumber(transaction.number);
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setReconciled(transaction.reconciled);
      setIsEditMode(true);
      setCurrentPosition(position);

      if (pettyCashAccount) {
        if (transaction.debitAccountId === pettyCashAccount.id) {
          setPettyCashSide('debit');
          setOtherAccountId(transaction.creditAccountId);
        } else {
          setPettyCashSide('credit');
          setOtherAccountId(transaction.debitAccountId);
        }
      }
    }
  };

  const handleFirst = () => {
    if (transactions.length > 0) {
      loadTransaction(transactions[0], 1);
      toast.info('First transaction loaded');
    }
  };

  const handlePrevious = () => {
    if (currentPosition > 1 && transactions.length > 0) {
      loadTransaction(transactions[currentPosition - 2], currentPosition - 1);
      toast.info(`Transaction ${currentPosition - 1} loaded`);
    }
  };

  const handleNext = () => {
    if (currentPosition < transactions.length) {
      loadTransaction(transactions[currentPosition], currentPosition + 1);
      toast.info(`Transaction ${currentPosition + 1} loaded`);
    }
  };

  const handleLast = () => {
    if (transactions.length > 0) {
      loadTransaction(transactions[transactions.length - 1], transactions.length);
      toast.info('Last transaction loaded');
    }
  };

  if (loadingPettyCash || loadingTransaction) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pettyCashAccount) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Petty Cash account not found. Please create a holder account with "Petty Cash" in the name.
        </AlertDescription>
      </Alert>
    );
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Petty Cash Transaction' : 'New Petty Cash Transaction'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Update petty cash transaction details' : 'Create a new petty cash transaction'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Date Navigation Controls */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dateSearch"
                  checked={dateSearch}
                  onCheckedChange={(checked) => setDateSearch(checked as boolean)}
                />
                <Label htmlFor="dateSearch" className="cursor-pointer">
                  Enable date search
                </Label>
              </div>
              {dateSearch && (
                <span className="text-sm text-muted-foreground">
                  {currentPosition} of {totalCount}
                </span>
              )}
            </div>

            {dateSearch && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFirst}
                  disabled={currentPosition <= 1 || totalCount === 0}
                >
                  First
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentPosition <= 1 || totalCount === 0}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentPosition >= totalCount || totalCount === 0}
                >
                  Next
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLast}
                  disabled={currentPosition >= totalCount || totalCount === 0}
                >
                  Last
                </Button>
              </div>
            )}
          </div>

          {/* Transaction Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  disabled={isLoading}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Transaction Number</Label>
              <Input
                id="number"
                value={transactionNumber}
                disabled
                className="bg-muted font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isLoading}
                  className="pl-8 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter transaction description"
              rows={2}
              required
              disabled={isLoading}
            />
          </div>

          {/* Petty Cash Account (Fixed) */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold">Petty Cash Account (Fixed)</Label>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pettyCashDebit"
                    checked={pettyCashSide === 'debit'}
                    onCheckedChange={(checked) => setPettyCashSide(checked ? 'debit' : 'credit')}
                    disabled={isLoading}
                  />
                  <Label htmlFor="pettyCashDebit" className="cursor-pointer">
                    Money In (Debit Petty Cash)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pettyCashCredit"
                    checked={pettyCashSide === 'credit'}
                    onCheckedChange={(checked) => setPettyCashSide(checked ? 'credit' : 'debit')}
                    disabled={isLoading}
                  />
                  <Label htmlFor="pettyCashCredit" className="cursor-pointer">
                    Money Out (Credit Petty Cash)
                  </Label>
                </div>
              </div>
              <div className="mt-3">
                <Input
                  value={`${pettyCashAccount.code} - ${pettyCashAccount.name}`}
                  disabled
                  className="bg-background"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Balance: GH₵ {Number(pettyCashAccount.balance).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Other Account */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold">
              {pettyCashSide === 'debit' ? 'Credit Account' : 'Debit Account'}
            </Label>
            <AccountSelector
              label={pettyCashSide === 'debit' ? 'Credit Account' : 'Debit Account'}
              value={otherAccountId}
              onChange={setOtherAccountId}
              disabled={isLoading}
              showBalance={true}
              excludeAccountId={pettyCashAccount.id}
            />
          </div>

          {/* Reconciled */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reconciled"
              checked={reconciled}
              onCheckedChange={(checked) => setReconciled(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="reconciled" className="cursor-pointer">
              Mark as reconciled
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!isEditMode && (
              <Button type="button" variant="outline" onClick={handleNew} disabled={isLoading}>
                New
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !otherAccountId || !amount || !description}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update' : 'Submit'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


