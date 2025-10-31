'use client';

/**
 * Petty Cash Split Entry Component
 * 
 * Individual split entry with cascading dropdowns
 * Secondary Account → Holder Account
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Trash2, DollarSign, Loader2 } from 'lucide-react';
import { useHolderAccounts } from '@/hooks/useAccounts';
import { SecondaryAccount } from '@/types';
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

interface PettyCashSplitEntryProps {
  split: SplitEntry;
  index: number;
  secondaryAccounts: SecondaryAccount[];
  loadingSecondary: boolean;
  isSubmitting: boolean;
  canRemove: boolean;
  onUpdate: (id: string, field: keyof SplitEntry, value: string) => void;
  onRemove: (id: string) => void;
}

export function PettyCashSplitEntry({
  split,
  index,
  secondaryAccounts,
  loadingSecondary,
  isSubmitting,
  canRemove,
  onUpdate,
  onRemove,
}: PettyCashSplitEntryProps) {
  // Get holder accounts for this split's selected secondary account
  const { data: holderAccounts = [], isLoading: loadingHolders } = useHolderAccounts(
    split.secondaryAccountId || undefined
  );

  return (
    <Card className="p-4 bg-muted/30">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Expense Entry {index + 1}</Label>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(split.id)}
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Secondary Account Dropdown */}
          <div className="space-y-2">
            <Label>Secondary Account (Expense Category)</Label>
            <Select
              value={split.secondaryAccountId}
              onValueChange={(value) => onUpdate(split.id, 'secondaryAccountId', value)}
              disabled={isSubmitting || loadingSecondary}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {loadingSecondary ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : secondaryAccounts.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No expense categories found
                  </div>
                ) : (
                  secondaryAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Holder Account Dropdown (cascading) */}
          <div className="space-y-2">
            <Label>Holder Account (Specific Expense)</Label>
            <Select
              value={split.holderAccountId}
              onValueChange={(value) => onUpdate(split.id, 'holderAccountId', value)}
              disabled={isSubmitting || !split.secondaryAccountId || loadingHolders}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expense account" />
              </SelectTrigger>
              <SelectContent>
                {!split.secondaryAccountId ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Select category first
                  </div>
                ) : loadingHolders ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Loading...
                  </div>
                ) : holderAccounts.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No accounts found
                  </div>
                ) : (
                  holderAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={split.amount}
                onChange={(e) => onUpdate(split.id, 'amount', e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
                className="pl-8 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={split.description}
              onChange={(e) => onUpdate(split.id, 'description', e.target.value)}
              placeholder="Enter description"
              rows={2}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
