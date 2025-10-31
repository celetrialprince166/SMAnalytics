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
  Users,
} from 'lucide-react';
import { apiSalesService } from '@/lib/services/ApiSalesService';
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

interface SalesListDesktopProps {
  refreshTrigger?: number;
  onGenerateInvoice?: (salesId: string) => void;
  onSelectForRepresentatives?: (salesId: string) => void;
}

export function SalesListDesktop({ refreshTrigger, onGenerateInvoice, onSelectForRepresentatives }: SalesListDesktopProps) {
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
      const summaries = await apiSalesService.getSalesSummaries();
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
      await apiSalesService.deleteSalesEntry(saleToDelete);
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
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-100">
        <div className="bg-white border-b px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Sales Register</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">Loading sales entries...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-gray-100">
        {/* Top Navigation */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Sales Register</h1>
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
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white border-b p-4">
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Summary */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredSales.length)} of{' '}
            {filteredSales.length} sales entries
            {filteredSales.length !== sales.length && (
              <span> (filtered from {sales.length} total)</span>
            )}
          </div>

          {/* Sales Register Table */}
          <Card className="border-2">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-12 font-semibold">TN</TableHead>
                      <TableHead className="font-semibold">Service</TableHead>
                      <TableHead className="font-semibold">Service line</TableHead>
                      <TableHead className="text-right font-semibold">Average fee</TableHead>
                      <TableHead className="text-right font-semibold">Service fee</TableHead>
                      <TableHead className="text-right font-semibold">Disc. value</TableHead>
                      <TableHead className="text-right font-semibold">Sales value</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                          No sales entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {currentSales.map((sale, index) => {
                          const profit = sale.salesValue - sale.costValue;
                          return (
                            <TableRow key={sale.id} className="hover:bg-gray-50">
                              <TableCell className="text-center font-medium">
                                {startIndex + index + 1}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{sale.productName || 'N/A'}</div>
                                  <div className="text-sm text-gray-500">
                                    {sale.salesCode}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600">
                                  {sale.description || 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatAmount(sale.costValue)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatAmount(sale.salesValue)}
                              </TableCell>
                              <TableCell className="text-right">
                                0.00
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {formatAmount(profit)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {onSelectForRepresentatives && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onSelectForRepresentatives(sale.id)}
                                      title="Assign representatives"
                                      className="h-6 w-6 p-0"
                                    >
                                      <Users className="h-4 w-4 text-blue-500" />
                                    </Button>
                                  )}
                                  {onGenerateInvoice && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onGenerateInvoice(sale.id)}
                                      title="Generate invoice"
                                      className="h-6 w-6 p-0"
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
                                    className="h-6 w-6 p-0"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        
                        {/* Fill remaining rows to match the 5-row layout from the image */}
                        {Array.from({ length: Math.max(0, 5 - currentSales.length) }).map((_, index) => (
                          <TableRow key={`empty-${index}`} className="hover:bg-gray-50">
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-1 ml-4">
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
            </div>
          )}
        </div>
      </div>

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
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
