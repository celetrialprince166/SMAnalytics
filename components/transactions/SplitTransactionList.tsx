'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { apiSplitTransactionService } from '@/lib/services/ApiSplitTransactionService';
import { accountService } from '@/lib/services/AccountService';
import { SplitTransaction, AccountOption } from '@/types';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TransactionAuditLog } from './TransactionAuditLog';

interface SplitTransactionListProps {
  refreshTrigger?: number;
  onEdit?: (splitTransactionId: string) => void;
}

export function SplitTransactionList({ refreshTrigger, onEdit }: SplitTransactionListProps) {
  const [splitTransactions, setSplitTransactions] = useState<SplitTransaction[]>([]);
  const [filteredSplits, setFilteredSplits] = useState<SplitTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [splitToDelete, setSplitToDelete] = useState<string | null>(null);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedSplitForAudit, setSelectedSplitForAudit] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [reconciledFilter, setReconciledFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Account options for filter
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);

  useEffect(() => {
    loadSplitTransactions();
    loadAccountOptions();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [splitTransactions, searchTerm, startDate, endDate, selectedAccount, reconciledFilter]);

  const loadAccountOptions = async () => {
    try {
      const options = await accountService.getAccountOptions();
      setAccountOptions(options);
    } catch (error) {
      console.error('Failed to load account options:', error);
    }
  };

  const loadSplitTransactions = async () => {
    try {
      setLoading(true);
      const splits = await apiSplitTransactionService.getSplitTransactions();
      // Sort by date descending (newest first)
      splits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSplitTransactions(splits);
    } catch (error) {
      console.error('Failed to load split transactions:', error);
      toast.error('Failed to load split transactions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...splitTransactions];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((split) => {
        const baseAccount = accountOptions.find((a) => a.id === split.baseAccountId);
        const matchesCode = split.code.toLowerCase().includes(term);
        const matchesBase = baseAccount?.fullPath.toLowerCase().includes(term);
        const matchesSplits = split.splits.some((s) =>
          s.description.toLowerCase().includes(term)
        );
        return matchesCode || matchesBase || matchesSplits;
      });
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter((split) => new Date(split.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter((split) => new Date(split.date) <= new Date(endDate));
    }

    // Account filter
    if (selectedAccount) {
      filtered = filtered.filter(
        (split) =>
          split.baseAccountId === selectedAccount ||
          split.splits.some((s) => s.accountId === selectedAccount)
      );
    }

    // Reconciled filter
    if (reconciledFilter !== 'all') {
      filtered = filtered.filter((split) => split.reconciled === (reconciledFilter === 'reconciled'));
    }

    setFilteredSplits(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!splitToDelete) return;

    try {
      await apiSplitTransactionService.deleteSplitTransaction(splitToDelete);
      toast.success('Split transaction deleted successfully');
      loadSplitTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete split transaction');
    } finally {
      setDeleteDialogOpen(false);
      setSplitToDelete(null);
    }
  };

  const handleToggleReconciled = async (splitId: string) => {
    try {
      const split = splitTransactions.find(s => s.id === splitId);
      if (split) {
        await apiSplitTransactionService.reconcileSplitTransaction(splitId, !split.reconciled);
        toast.success('Reconciliation status updated');
        loadSplitTransactions();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update reconciliation status');
    }
  };

  const toggleRowExpansion = (splitId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(splitId)) {
      newExpanded.delete(splitId);
    } else {
      newExpanded.add(splitId);
    }
    setExpandedRows(newExpanded);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedAccount('');
    setReconciledFilter('all');
  };

  // Pagination
  const totalPages = Math.ceil(filteredSplits.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentSplits = filteredSplits.slice(startIndex, endIndex);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const getAccountName = (accountId: string) => {
    return accountOptions.find((a) => a.id === accountId)?.name || 'Unknown';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading split transactions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Split Transaction Register</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          {showFilters && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search code, accounts, descriptions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account</Label>
                  <Select value={selectedAccount || 'all'} onValueChange={(value) => setSelectedAccount(value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All accounts</SelectItem>
                      {accountOptions.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.fullPath}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={reconciledFilter} onValueChange={setReconciledFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="reconciled">Reconciled</SelectItem>
                      <SelectItem value="unreconciled">Unreconciled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Page Size</Label>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {startIndex + 1} to {Math.min(endIndex, filteredSplits.length)} of{' '}
              {filteredSplits.length} split transactions
              {filteredSplits.length !== splitTransactions.length && (
                <span> (filtered from {splitTransactions.length} total)</span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[120px]">Code</TableHead>
                    <TableHead>Base Account</TableHead>
                    <TableHead className="w-[80px]">Side</TableHead>
                    <TableHead className="w-[80px]">Splits</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[150px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentSplits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        No split transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentSplits.map((split) => (
                      <>
                        <TableRow key={split.id}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(split.id)}
                            >
                              {expandedRows.has(split.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">{formatDate(split.date)}</TableCell>
                          <TableCell>{split.code}</TableCell>
                          <TableCell className="text-sm">
                            {getAccountName(split.baseAccountId)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={split.baseAccountSide === 'DEBIT' ? 'default' : 'secondary'}>
                              {split.baseAccountSide}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{split.splits.length}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatAmount(split.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleReconciled(split.id)}
                              className="h-8 px-2"
                            >
                              {split.reconciled ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Reconciled
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <Circle className="h-3 w-3" />
                                  Pending
                                </Badge>
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSplitForAudit(split.id);
                                  setAuditDialogOpen(true);
                                }}
                                title="View audit trail"
                              >
                                <History className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit?.(split.id)}
                                title="Edit split transaction"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSplitToDelete(split.id);
                                  setDeleteDialogOpen(true);
                                }}
                                title="Delete split transaction"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(split.id) && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-muted/50">
                              <div className="p-4 space-y-2">
                                <div className="font-semibold text-sm mb-2">Split Details:</div>
                                {split.splits.map((s, index) => (
                                  <div key={s.id} className="flex items-center justify-between text-sm border-b pb-2">
                                    <div className="flex-1">
                                      <span className="font-medium">Split {index + 1}:</span>{' '}
                                      {getAccountName(s.accountId)}
                                    </div>
                                    <div className="flex-1 text-muted-foreground">{s.description}</div>
                                    <div className="font-medium">{formatAmount(s.amount)}</div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                >
                  <ChevronFirst className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronLast className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Split Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this split transaction? This will delete all
              associated transactions and reverse account balances. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Audit Trail Dialog */}
      <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Split Transaction Audit Trail</DialogTitle>
          </DialogHeader>
          {selectedSplitForAudit && (
            <TransactionAuditLog transactionId={selectedSplitForAudit} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
