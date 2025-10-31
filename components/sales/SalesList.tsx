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
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  Filter,
  FileText,
} from 'lucide-react';
import { salesService } from '@/lib/services/SalesService';
import { SalesSummary } from '@/types';
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

interface SalesListProps {
  refreshTrigger?: number;
  onGenerateInvoice?: (salesId: string) => void;
}

export function SalesList({ refreshTrigger, onGenerateInvoice }: SalesListProps) {
  const [sales, setSales] = useState<SalesSummary[]>([]);
  const [filteredSales, setFilteredSales] = useState<SalesSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadSales();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [sales, searchTerm, startDate, endDate]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const summaries = await salesService.getSalesSummaries();
      setSales(summaries);
    } catch (error) {
      console.error('Failed to load sales:', error);
      toast.error('Failed to load sales entries');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sales];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.salesCode.toLowerCase().includes(term) ||
          s.productName.toLowerCase().includes(term) ||
          s.description.toLowerCase().includes(term) ||
          s.customerAccount.toLowerCase().includes(term)
      );
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter((s) => new Date(s.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter((s) => new Date(s.date) <= new Date(endDate));
    }

    setFilteredSales(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!saleToDelete) return;

    try {
      await salesService.deleteSalesEntry(saleToDelete);
      toast.success('Sales entry deleted successfully');
      loadSales();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete sales entry');
    } finally {
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentSales = filteredSales.slice(startIndex, endIndex);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate totals for current page
  const pageTotals = currentSales.reduce(
    (acc, sale) => ({
      sales: acc.sales + sale.salesValue,
      cost: acc.cost + sale.costValue,
      profit: acc.profit + (sale.salesValue - sale.costValue),
    }),
    { sales: 0, cost: 0, profit: 0 }
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading sales entries...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sales Register</CardTitle>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search sales..."
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
              Showing {startIndex + 1} to {Math.min(endIndex, filteredSales.length)} of{' '}
              {filteredSales.length} sales entries
              {filteredSales.length !== sales.length && (
                <span> (filtered from {sales.length} total)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label>Page Size:</Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Sales Code</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No sales entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {currentSales.map((sale) => {
                        const profit = sale.salesValue - sale.costValue;
                        return (
                          <TableRow key={sale.id}>
                            <TableCell>{formatDate(sale.date)}</TableCell>
                            <TableCell className="font-medium">{sale.salesCode}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{sale.productName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {sale.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{sale.customerAccount}</TableCell>
                            <TableCell className="text-right">
                              {formatAmount(sale.costValue)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatAmount(sale.salesValue)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatAmount(profit)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {onGenerateInvoice && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onGenerateInvoice(sale.id)}
                                    title="Generate invoice"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSaleToDelete(sale.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                  title="Delete sales entry"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Totals Row */}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={4} className="text-right">
                          Page Totals:
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(pageTotals.cost)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(pageTotals.sales)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={pageTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatAmount(pageTotals.profit)}
                          </span>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </>
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
            <AlertDialogTitle>Delete Sales Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sales entry? This will also delete the
              associated transactions and cannot be undone.
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
    </>
  );
}
