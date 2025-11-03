/**
 * Transaction Debug Modal Component
 * 
 * Main modal container for transaction debug visualization
 */

'use client';

import { useDebugMode } from '@/lib/contexts/DebugModeContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TransactionFlowGraph } from './TransactionFlowGraph';
import { Download, FileJson, Printer, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TransactionDebugModal() {
  const { currentDebugData, isModalOpen, closeModal } = useDebugMode();

  if (!currentDebugData) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      single: 'Single Transaction',
      split: 'Split Transaction',
      petty: 'Petty Cash',
      sales: 'Sales Transaction',
      payroll: 'Payroll',
      'fixed-asset-depreciation': 'Asset Depreciation',
      'fixed-asset-disposal': 'Asset Disposal',
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      single: 'bg-blue-100 text-blue-800',
      split: 'bg-purple-100 text-purple-800',
      petty: 'bg-yellow-100 text-yellow-800',
      sales: 'bg-green-100 text-green-800',
      payroll: 'bg-indigo-100 text-indigo-800',
      'fixed-asset-depreciation': 'bg-orange-100 text-orange-800',
      'fixed-asset-disposal': 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleExportPNG = async () => {
    // TODO: Implement PNG export using html2canvas or similar
    console.log('Export PNG not yet implemented');
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(currentDebugData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transaction-debug-${currentDebugData.transactionId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>Transaction Debug Visualization</DialogTitle>
              <Badge className={getTransactionTypeColor(currentDebugData.transactionType)}>
                {getTransactionTypeLabel(currentDebugData.transactionType)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                title="Export as JSON"
              >
                <FileJson className="h-4 w-4 mr-1" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPNG}
                title="Export as PNG"
              >
                <Download className="h-4 w-4 mr-1" />
                PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                title="Print"
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </div>
          <DialogDescription>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>
                <div className="font-medium">{formatDate(currentDebugData.metadata.date)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Amount:</span>
                <div className="font-medium">{formatCurrency(currentDebugData.metadata.totalAmount)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Accounts:</span>
                <div className="font-medium">{currentDebugData.accounts.length}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Flows:</span>
                <div className="font-medium">{currentDebugData.flows.length}</div>
              </div>
            </div>
            {currentDebugData.metadata.description && (
              <div className="mt-3">
                <span className="text-muted-foreground">Description:</span>
                <div className="font-medium">{currentDebugData.metadata.description}</div>
              </div>
            )}
            
            {/* Additional metadata for specific transaction types */}
            {currentDebugData.transactionType === 'sales' && (
              <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                {currentDebugData.metadata.salesValue && (
                  <div>
                    <span className="text-muted-foreground">Sales Value:</span>
                    <div className="font-medium">{formatCurrency(currentDebugData.metadata.salesValue)}</div>
                  </div>
                )}
                {currentDebugData.metadata.costValue && (
                  <div>
                    <span className="text-muted-foreground">Cost Value:</span>
                    <div className="font-medium">{formatCurrency(currentDebugData.metadata.costValue)}</div>
                  </div>
                )}
                {currentDebugData.metadata.grossProfit !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Gross Profit:</span>
                    <div className="font-medium text-green-600">{formatCurrency(currentDebugData.metadata.grossProfit)}</div>
                  </div>
                )}
              </div>
            )}
            
            {currentDebugData.transactionType === 'payroll' && (
              <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                {currentDebugData.metadata.grossSalary && (
                  <div>
                    <span className="text-muted-foreground">Gross Salary:</span>
                    <div className="font-medium">{formatCurrency(currentDebugData.metadata.grossSalary)}</div>
                  </div>
                )}
                {currentDebugData.metadata.totalDeductions && (
                  <div>
                    <span className="text-muted-foreground">Deductions:</span>
                    <div className="font-medium text-red-600">{formatCurrency(currentDebugData.metadata.totalDeductions)}</div>
                  </div>
                )}
                {currentDebugData.metadata.netSalary && (
                  <div>
                    <span className="text-muted-foreground">Net Salary:</span>
                    <div className="font-medium text-green-600">{formatCurrency(currentDebugData.metadata.netSalary)}</div>
                  </div>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Graph Visualization */}
        <div className="flex-1 border rounded-lg overflow-hidden bg-gray-50">
          <TransactionFlowGraph debugData={currentDebugData} />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Assets</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Liabilities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Equity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Expenses</span>
            </div>
          </div>
          <div className="text-xs">
            Tip: Use mouse wheel to zoom, drag to pan
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
