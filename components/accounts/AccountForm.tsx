'use client';

/**
 * Account Form Component
 * 
 * Form for creating and editing holder accounts
 * Now optimized with TanStack Query for cached data
 */

import { useState, useEffect } from 'react';
import { apiAccountService } from '@/lib/services/ApiAccountService';
import {
  usePrimaryAccounts,
  useSecondaryAccounts,
  useHolderAccount,
  useSecondaryAccount,
  useCreateHolderAccount,
  useUpdateHolderAccount,
} from '@/hooks/useAccounts';
import { useAccountNameValidation } from '@/hooks/useAccountNameValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AccountFormProps {
  accountId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AccountForm({ accountId, onSuccess, onCancel }: AccountFormProps) {
  const [selectedPrimary, setSelectedPrimary] = useState('');
  const [selectedSecondary, setSelectedSecondary] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // React Query hooks for cached data
  const { data: primaryAccounts = [], isLoading: loadingPrimary } = usePrimaryAccounts();
  const { data: secondaryAccounts = [] } = useSecondaryAccounts(selectedPrimary || undefined);
  const { data: editingAccount, isLoading: loadingAccount } = useHolderAccount(accountId);
  const { data: editingSecondary } = useSecondaryAccount(editingAccount?.secondaryAccountId);

  // Mutations with automatic cache updates
  const createMutation = useCreateHolderAccount();
  const updateMutation = useUpdateHolderAccount();

  // Real-time name validation
  const nameValidation = useAccountNameValidation(
    accountName,
    selectedSecondary || undefined,
    accountId // Exclude current account when editing
  );

  // Load account for editing
  useEffect(() => {
    if (accountId && editingAccount && editingSecondary) {
      // Set edit mode FIRST to prevent code regeneration
      setIsEditMode(true);
      setSelectedPrimary(editingSecondary.primaryAccountId);
      setSelectedSecondary(editingAccount.secondaryAccountId);
      setAccountCode(editingAccount.code);
      setAccountName(editingAccount.name);
      setDescription(editingAccount.description || '');
    }
  }, [accountId, editingAccount, editingSecondary]);

  // Generate account code when secondary account changes (only in create mode)
  useEffect(() => {
    // Only generate code if we're NOT in edit mode AND secondary account is selected
    if (selectedSecondary && !isEditMode && !accountId) {
      generateAccountCode(selectedSecondary);
    }
  }, [selectedSecondary, isEditMode, accountId]);

  const generateAccountCode = async (secondaryId: string) => {
    try {
      const code = await apiAccountService.generateHolderAccountCode(secondaryId);
      setAccountCode(code);
    } catch (err) {
      console.error('Error generating account code:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPrimary || !selectedSecondary || !accountName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    // Check real-time validation before submitting
    if (nameValidation.isValid === false) {
      setError(nameValidation.error || 'Account name is not available');
      return;
    }

    // If still validating, wait a moment
    if (nameValidation.isValidating) {
      setError('Please wait while we validate the account name...');
      return;
    }

    try {
      if (isEditMode && accountId) {
        await updateMutation.mutateAsync({
          accountId,
          data: {
            name: accountName,
            description: description || '',
          },
        });
      } else {
        await createMutation.mutateAsync({
          secondaryAccountId: selectedSecondary,
          name: accountName,
          description: description || '',
        });
      }

      // Reset form
      setSelectedPrimary('');
      setSelectedSecondary('');
      setAccountCode('');
      setAccountName('');
      setDescription('');
      setIsEditMode(false);

      onSuccess?.();
    } catch (err: any) {
      console.error('Error saving account:', err);
      
      // Handle validation errors from API
      if (err.message && err.message.includes('already exists')) {
        setError('An account with this name already exists under the selected secondary account');
      } else {
        setError(err.message || 'Failed to save account');
      }
    }
  };

  const handleNew = () => {
    setSelectedPrimary('');
    setSelectedSecondary('');
    setAccountCode('');
    setAccountName('');
    setDescription('');
    setError('');
    setIsEditMode(false);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (loadingAccount && accountId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading account...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Account' : 'Create New Account'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Update account details' : 'Add a new holder account to the chart of accounts'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="primaryAccount">Primary Account *</Label>
            <Select
              value={selectedPrimary}
              onValueChange={setSelectedPrimary}
              disabled={isEditMode || isSubmitting || loadingPrimary}
            >
              <SelectTrigger id="primaryAccount">
                <SelectValue placeholder="Select primary account" />
              </SelectTrigger>
              <SelectContent>
                {primaryAccounts.filter(a => a.isActive).map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryAccount">Secondary Account *</Label>
            <Select
              value={selectedSecondary}
              onValueChange={setSelectedSecondary}
              disabled={!selectedPrimary || isSubmitting}
            >
              <SelectTrigger id="secondaryAccount">
                <SelectValue placeholder="Select secondary account" />
              </SelectTrigger>
              <SelectContent>
                {secondaryAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountCode">Account Code</Label>
            <Input
              id="accountCode"
              value={accountCode}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name *</Label>
            <div className="relative">
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter account name"
                required
                disabled={isSubmitting}
                className={`pr-10 ${
                  nameValidation.isValid === false 
                    ? 'border-red-500 focus:border-red-500' 
                    : nameValidation.isValid === true 
                    ? 'border-green-500 focus:border-green-500'
                    : ''
                }`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {nameValidation.isValidating && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
                {nameValidation.isValid === true && !nameValidation.isValidating && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {nameValidation.isValid === false && !nameValidation.isValidating && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            {nameValidation.isValid === false && nameValidation.error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {nameValidation.error}
              </p>
            )}
            {nameValidation.isValid === true && !nameValidation.isValidating && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Name is available
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter account description (optional)"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-2 pt-4">
            {!isEditMode && (
              <Button type="button" variant="outline" onClick={handleNew} disabled={isSubmitting}>
                New
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={
                isSubmitting || 
                !selectedSecondary || 
                !accountName.trim() || 
                nameValidation.isValid === false ||
                nameValidation.isValidating
              }
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {nameValidation.isValidating ? 'Validating...' : isEditMode ? 'Update Account' : 'Create Account'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
