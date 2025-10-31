'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  User,
} from 'lucide-react';
import { apiTransactionService } from '@/lib/services/ApiTransactionService';
import { TransactionAuditEntry } from '@/types';
import { toast } from 'sonner';

interface TransactionAuditLogProps {
  transactionId: string;
}

export function TransactionAuditLog({ transactionId }: TransactionAuditLogProps) {
  const [auditEntries, setAuditEntries] = useState<TransactionAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLog();
  }, [transactionId]);

  const loadAuditLog = async () => {
    try {
      setLoading(true);
      const entries = await apiTransactionService.getTransactionAuditEntries(transactionId);
      setAuditEntries(entries);
    } catch (error) {
      console.error('Failed to load audit log:', error);
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: TransactionAuditEntry['action']) => {
    switch (action) {
      case 'CREATE':
        return <FileText className="h-4 w-4" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4" />;
      case 'RECONCILE':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'UNRECONCILE':
        return <Circle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: TransactionAuditEntry['action']) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'DELETE':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'RECONCILE':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      case 'UNRECONCILE':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return formatDate(value);
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  const renderChanges = (entry: TransactionAuditEntry) => {
    if (!entry.previousValues && !entry.newValues) return null;

    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    if (entry.previousValues && entry.newValues) {
      // Compare previous and new values
      const allKeys = new Set([
        ...Object.keys(entry.previousValues),
        ...Object.keys(entry.newValues),
      ]);

      allKeys.forEach((key) => {
        const oldValue = (entry.previousValues as any)?.[key];
        const newValue = (entry.newValues as any)?.[key];
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({ field: key, oldValue, newValue });
        }
      });
    }

    if (changes.length === 0) return null;

    return (
      <div className="mt-2 space-y-1 text-xs">
        {changes.map((change, index) => (
          <div key={index} className="flex items-start gap-2 text-muted-foreground">
            <span className="font-medium capitalize">{change.field}:</span>
            <span className="line-through">{formatValue(change.oldValue)}</span>
            <span>→</span>
            <span className="font-medium">{formatValue(change.newValue)}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">Loading audit log...</div>
        </CardContent>
      </Card>
    );
  }

  if (auditEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            No audit entries found for this transaction
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audit Trail</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {auditEntries.map((entry, index) => (
              <div key={entry.id}>
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${getActionColor(entry.action)}`}
                  >
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-normal">
                        {entry.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    {entry.username && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{entry.username}</span>
                      </div>
                    )}
                    {renderChanges(entry)}
                  </div>
                </div>
                {index < auditEntries.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
