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
} from 'lucide-react';
import { apiTransactionService } from '@/lib/services/ApiTransactionService';
import { accountService } from '@/lib/services/AccountService';
import { TransactionSummary, TransactionFilters, AccountOption } from '@/types';
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

interface TransactionListProps {
  refreshTrigger?: number;
  onEdit?: (transactionId: string) => void;
}

export function TransactionList({ refreshTrigger, onEdit }: TransactionListProps) {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedTransactionForAudit, setSelectedTransactionForAudit] = useState<string | null>(null);
  
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
    loadTransactions();
    loadAccountOptions();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, startDate, endDate, selectedAccount, reconciledFilter]);

  const loadAccountOptions = async () => {
    try {
      const options = await accountService.getAccountOptions();
      setAccountOptions(options);
    } catch (error) {
      console.error('Failed to load account options:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const transactionData = await apiTransactionService.getTransactions();
      // Convert to TransactionSummary format for compatibility
      const summaries: TransactionSummary[] = transactionData.map(t => ({
        id: t.id,
        date: t.date,
        number: t.number,
        description: t.description,
        amount: t.amount,
        debitAccount: t.debitAccount?.name || `Account ${t.debitAccountId}`, // Use actual account name
        creditAccount: t.creditAccount?.name || `Account ${t.creditAccountId}`, // Use actual account name
        reconciled: t.reconciled,
      }));
      // Sort by date descending (newest first)
      summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(summaries);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(term) ||
          t.number.toLowerCase().includes(term) ||
          t.debitAccount.toLowerCase().includes(term) ||
          t.creditAccount.toLowerCase().includes(term)
      );
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter((t) => new Date(t.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter((t) => new Date(t.date) <= new Date(endDate));
    }

    // Account filter
    if (selectedAccount) {
      const account = accountOptions.find((a) => a.id === selectedAccount);
      if (account) {
        filtered = filtered.filter(
          (t) => t.debitAccount === account.name || t.creditAccount === account.name
        );
      }
    }

    // Reconciled filter
    if (reconciledFilter !== 'all') {
      filtered = filtered.filter((t) => t.reconciled === (reconciledFilter === 'reconciled'));
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;

    try {
      await apiTransactionService.deleteTransaction(transactionToDelete);
      toast.success('Transaction deleted successfully');
      loadTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete transaction');
    } finally {
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleToggleReconciled = async (transactionId: string) => {
    try {
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        await apiTransactionService.reconcileTransaction(transactionId, !transaction.reconciled);
        toast.success('Reconciliation status updated');
        loadTransactions();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update reconciliation status');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedAccount('');
    setReconciledFilter('all');
  };

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading transactions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Register</CardTitle>
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
                      placeholder="Search description, number, accounts..."
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
                      <SelectItem value="100">100 per page</SelectItem>
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
              Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of{' '}
              {filteredTransactions.length} transactions
              {filteredTransactions.length !== transactions.length && (
                <span> (filtered from {transactions.length} total)</span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[100px]">Number</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Debit Account</TableHead>
                    <TableHead>Credit Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[150px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {formatDate(transaction.date)}
                        </TableCell>
                        <TableCell>{transaction.number}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="text-sm">{transaction.debitAccount}</TableCell>
                        <TableCell className="text-sm">{transaction.creditAccount}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleReconciled(transaction.id)}
                            className="h-8 px-2"
                          >
                            {transaction.reconciled ? (
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
                                setSelectedTransactionForAudit(transaction.id);
                                setAuditDialogOpen(true);
                              }}
                              title="View audit trail"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit?.(transaction.id)}
                              title="Edit transaction"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setTransactionToDelete(transaction.id);
                                setDeleteDialogOpen(true);
                              }}
                              title="Delete transaction"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
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
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action will reverse the
              account balances and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Audit Trail Dialog */}
      <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Audit Trail</DialogTitle>
          </DialogHeader>
          {selectedTransactionForAudit && (
            <TransactionAuditLog transactionId={selectedTransactionForAudit} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
