'use client';

/**
 * Account Selector Component
 * 
 * Hierarchical account selector with balance display and quick account creation
 */

import { useState, useEffect } from 'react';
import { apiAccountService } from '@/lib/services/ApiAccountService';
import { PrimaryAccount, SecondaryAccount, HolderAccount } from '@/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateHolderAccountDialog } from './CreateHolderAccountDialog';

interface AccountSelectorProps {
  label?: string;
  value?: string;
  onChange: (accountId: string) => void;
  disabled?: boolean;
  showBalance?: boolean;
  filterByType?: PrimaryAccount['type'];
  placeholder?: string;
  excludeAccountId?: string;
}

export function AccountSelector({
  label = 'Account',
  value,
  onChange,
  disabled = false,
  showBalance = true,
  filterByType,
  placeholder = 'Select account',
  excludeAccountId,
}: AccountSelectorProps) {
  const [primaryAccounts, setPrimaryAccounts] = useState<PrimaryAccount[]>([]);
  const [secondaryAccounts, setSecondaryAccounts] = useState<SecondaryAccount[]>([]);
  const [holderAccounts, setHolderAccounts] = useState<HolderAccount[]>([]);
  const [selectedPrimary, setSelectedPrimary] = useState('');
  const [selectedSecondary, setSelectedSecondary] = useState('');
  const [selectedHolder, setSelectedHolder] = useState('');
  const [balance, setBalance] = useState(0);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadPrimaryAccounts();
  }, [filterByType]);

  useEffect(() => {
    if (value) {
      loadAccountHierarchy(value);
    }
  }, [value]);

  useEffect(() => {
    if (!isLoadingHierarchy) {
      if (selectedPrimary) {
        loadSecondaryAccounts(selectedPrimary);
      } else {
        setSecondaryAccounts([]);
        setSelectedSecondary('');
      }
    }
  }, [selectedPrimary, isLoadingHierarchy]);

  useEffect(() => {
    if (!isLoadingHierarchy) {
      if (selectedSecondary) {
        loadHolderAccounts(selectedSecondary);
      } else {
        setHolderAccounts([]);
        setSelectedHolder('');
      }
    }
  }, [selectedSecondary, isLoadingHierarchy]);

  useEffect(() => {
    if (selectedHolder && !isLoadingHierarchy) {
      loadBalance(selectedHolder);
      onChange(selectedHolder);
    } else if (!selectedHolder) {
      setBalance(0);
    }
  }, [selectedHolder, isLoadingHierarchy]);

  const loadPrimaryAccounts = async () => {
    try {
      let accounts = await apiAccountService.getPrimaryAccounts();
      if (filterByType) {
        accounts = accounts.filter(a => a.type === filterByType);
      }
      setPrimaryAccounts(accounts.filter(a => a.isActive));
    } catch (err) {
      console.error('Error loading primary accounts:', err);
    }
  };

  const loadSecondaryAccounts = async (primaryId: string) => {
    try {
      const accounts = await apiAccountService.getSecondaryAccounts(primaryId);
      setSecondaryAccounts(accounts);
    } catch (err) {
      console.error('Error loading secondary accounts:', err);
    }
  };

  const loadHolderAccounts = async (secondaryId: string) => {
    try {
      const accounts = await apiAccountService.getHolderAccounts(secondaryId);
      // Ensure balance is properly converted to number
      const accountsWithBalance = accounts.map(acc => ({
        ...acc,
        balance: Number(acc.balance) || 0
      }));
      setHolderAccounts(accountsWithBalance);
    } catch (err) {
      console.error('Error loading holder accounts:', err);
    }
  };

  const loadBalance = async (holderId: string) => {
    try {
      // Fetch the holder account directly to get the most up-to-date balance
      const account = await apiAccountService.getHolderAccountById(holderId);
      if (account) {
        setBalance(Number(account.balance) || 0);
      } else {
        setBalance(0);
      }
    } catch (err) {
      console.error('Error loading balance:', err);
      setBalance(0);
    }
  };

  const loadAccountHierarchy = async (holderId: string) => {
    try {
      setIsLoadingHierarchy(true);
      const holder = await apiAccountService.getHolderAccountById(holderId);
      if (!holder) return;

      // Get the secondary account to find its primary account
      const secondary = await apiAccountService.getSecondaryAccountById(holder.secondaryAccountId);
      if (secondary) {
        // Load all account data first
        const [secondaryAccounts, holderAccounts] = await Promise.all([
          apiAccountService.getSecondaryAccounts(secondary.primaryAccountId),
          apiAccountService.getHolderAccounts(holder.secondaryAccountId)
        ]);
        
        // Set the account arrays first
        setSecondaryAccounts(secondaryAccounts);
        setHolderAccounts(holderAccounts);
        
        // Use a small delay to ensure the account arrays are set before selecting values
        setTimeout(() => {
          setSelectedPrimary(secondary.primaryAccountId);
          setSelectedSecondary(holder.secondaryAccountId);
          setSelectedHolder(holderId);
        }, 100);
      }
    } catch (err) {
      console.error('Error loading account hierarchy:', err);
    } finally {
      setIsLoadingHierarchy(false);
    }
  };

  const handleCreateAccount = () => {
    if (!selectedSecondary) {
      return;
    }
    setShowCreateDialog(true);
  };

  const handleAccountCreated = async (newAccountId: string) => {
    // Reload holder accounts for the selected secondary account
    if (selectedSecondary) {
      const accounts = await apiAccountService.getHolderAccounts(selectedSecondary);
      const accountsWithBalance = accounts.map(acc => ({
        ...acc,
        balance: Number(acc.balance) || 0
      }));
      setHolderAccounts(accountsWithBalance);
      
      // Auto-select the newly created account
      setSelectedHolder(newAccountId);
    }
  };


  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Primary Account</Label>
          <Select
            value={selectedPrimary}
            onValueChange={setSelectedPrimary}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select primary" />
            </SelectTrigger>
            <SelectContent>
              {primaryAccounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Secondary Account</Label>
          <Select
            value={selectedSecondary}
            onValueChange={setSelectedSecondary}
            disabled={!selectedPrimary || disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select secondary" />
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
          <div className="flex items-center justify-between">
            <Label>{label}</Label>
            {selectedSecondary && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCreateAccount}
                className="h-6 px-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
            )}
          </div>
          <Select
            value={selectedHolder}
            onValueChange={setSelectedHolder}
            disabled={!selectedSecondary || disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {holderAccounts.length === 0 && selectedSecondary ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No accounts found. Click "New" to create one.
                </div>
              ) : (
                holderAccounts
                  .filter(account => !excludeAccountId || account.id !== excludeAccountId)
                  .map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.code})
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showBalance && selectedHolder && (
        <div className="space-y-2">
          <Label>Balance</Label>
          <Input
            value={typeof balance === 'number' ? balance.toFixed(2) : '0.00'}
            disabled
            className="bg-muted font-mono"
          />
        </div>
      )}

      {/* Create Holder Account Dialog */}
      {selectedSecondary && (
        <CreateHolderAccountDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          secondaryAccountId={selectedSecondary}
          secondaryAccountName={
            secondaryAccounts.find(s => s.id === selectedSecondary)?.name || ''
          }
          secondaryAccountCode={
            secondaryAccounts.find(s => s.id === selectedSecondary)?.code || ''
          }
          onSuccess={handleAccountCreated}
        />
      )}
    </div>
  );
}
