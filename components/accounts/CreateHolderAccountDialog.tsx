'use client';

/**
 * Create Holder Account Dialog
 * 
 * Modal dialog for quickly creating a new holder account
 * Used within AccountSelector for on-the-fly account creation
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiAccountService } from '@/lib/services/ApiAccountService';
import { toast } from 'sonner';

interface CreateHolderAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secondaryAccountId: string;
  secondaryAccountName: string;
  secondaryAccountCode: string;
  onSuccess: (newAccountId: string) => void;
}

export function CreateHolderAccountDialog({
  open,
  onOpenChange,
  secondaryAccountId,
  secondaryAccountName,
  secondaryAccountCode,
  onSuccess,
}: CreateHolderAccountDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!name.trim()) {
        throw new Error('Account name is required');
      }

      // Create the holder account
      const newAccount = await apiAccountService.createHolderAccount({
        secondaryAccountId,
        name: name.trim(),
        description: description.trim(),
      });

      toast.success(`Account "${name}" created successfully`);
      
      // Reset form
      setName('');
      setDescription('');
      
      // Close dialog and notify parent
      onOpenChange(false);
      onSuccess(newAccount.id);
    } catch (err: any) {
      console.error('Error creating holder account:', err);
      setError(err.message || 'Failed to create account');
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-width-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Holder Account</DialogTitle>
          <DialogDescription>
            Create a new holder account under <span className="font-semibold">{secondaryAccountName}</span> ({secondaryAccountCode})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="account-name">
                Account Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter account name"
                disabled={isSubmitting}
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground">
                A unique code will be automatically generated
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-description">Description (Optional)</Label>
              <Textarea
                id="account-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter account description"
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Account Hierarchy:</p>
              <p className="text-muted-foreground">
                {secondaryAccountName} → <span className="font-semibold">{name || '[New Account]'}</span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
