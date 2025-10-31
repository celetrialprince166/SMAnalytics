'use client';

/**
 * Account Selector Component
 * 
 * Hierarchical account selector with balance display
 */

import { useState, useEffect } from 'react';
import { apiAccountService } from '@/lib/services/ApiAccountService';
import { PrimaryAccount, SecondaryAccount, HolderAccount } from '@/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

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
    if (selectedHolder) {
      loadBalance(selectedHolder);
      onChange(selectedHolder);
    }
  }, [selectedHolder]);

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
      setHolderAccounts(accounts);
    } catch (err) {
      console.error('Error loading holder accounts:', err);
    }
  };

  const loadBalance = async (holderId: string) => {
    try {
      const bal = await apiAccountService.getAccountBalance(holderId);
      setBalance(bal);
    } catch (err) {
      console.error('Error loading balance:', err);
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
          <Label>{label}</Label>
          <Select
            value={selectedHolder}
            onValueChange={setSelectedHolder}
            disabled={!selectedSecondary || disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {holderAccounts
                .filter(account => !excludeAccountId || account.id !== excludeAccountId)
                .map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.code})
                  </SelectItem>
                ))}
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
    </div>
  );
}
