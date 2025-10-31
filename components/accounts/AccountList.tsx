'use client';

/**
 * Account List Component
 * 
 * Displays list of accounts with search and filtering
 * Now optimized with TanStack Query for lightning-fast loading and caching
 */

import { useState, useMemo } from 'react';
import { useAccountHierarchyWithPaths, useDeleteHolderAccount } from '@/hooks/useAccounts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit, Trash2, Loader2, RefreshCw } from 'lucide-react';

interface AccountListProps {
  onEdit?: (accountId: string) => void;
  onDelete?: (accountId: string) => void;
  refreshTrigger?: number;
}

export function AccountList({ onEdit, onDelete }: AccountListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use React Query hook - data is cached and shared across components!
  const { data: hierarchy, isLoading, error, refetch, isFetching } = useAccountHierarchyWithPaths();
  
  // Use delete mutation with automatic cache invalidation
  const deleteMutation = useDeleteHolderAccount();

  // Memoized filtering for performance
  const filteredAccounts = useMemo(() => {
    if (!hierarchy?.holder) return [];
    
    if (!searchQuery.trim()) {
      return hierarchy.holder;
    }

    const query = searchQuery.toLowerCase();
    return hierarchy.holder.filter(account => {
      const path = account.path?.toLowerCase() || '';
      return (
        account.name.toLowerCase().includes(query) ||
        account.code.toLowerCase().includes(query) ||
        account.description?.toLowerCase().includes(query) ||
        path.includes(query)
      );
    });
  }, [hierarchy, searchQuery]);

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) {
      return;
    }

    deleteMutation.mutate(accountId, {
      onSuccess: () => {
        onDelete?.(accountId);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading accounts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <p className="text-destructive mb-4">Failed to load accounts</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalAccounts = hierarchy?.holder.length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Chart of Accounts</CardTitle>
            <CardDescription>Manage your holder accounts</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts by name, code, or path..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {searchQuery ? 'No accounts found matching your search' : 'No accounts created yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map(account => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono text-sm">{account.code}</TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {account.path}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(account.balance ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(account.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(account.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredAccounts.length} of {totalAccounts} accounts
            </span>
            {isFetching && (
              <span className="flex items-center text-primary">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Updating...
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
