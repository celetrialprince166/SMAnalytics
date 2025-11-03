/**
 * Account Node Component
 * 
 * Visual representation of an account in the transaction flow graph
 */

'use client';

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { AccountDebugInfo } from '@/types/debug';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AccountNodeProps {
  data: {
    account: AccountDebugInfo;
    showBalances: boolean;
    showAccountCodes: boolean;
    colorScheme: 'account-type' | 'balance-change' | 'combined';
  };
}

const ACCOUNT_TYPE_COLORS = {
  ASSETS: 'bg-blue-100 border-blue-500 text-blue-900',
  LIABILITIES: 'bg-red-100 border-red-500 text-red-900',
  EQUITY: 'bg-purple-100 border-purple-500 text-purple-900',
  REVENUE: 'bg-green-100 border-green-500 text-green-900',
  EXPENSES: 'bg-orange-100 border-orange-500 text-orange-900',
};

export const AccountNode = memo(({ data }: AccountNodeProps) => {
  const { account, showBalances, showAccountCodes, colorScheme } = data;
  
  // Determine node color
  let nodeColor = ACCOUNT_TYPE_COLORS[account.type] || 'bg-gray-100 border-gray-500 text-gray-900';
  
  if (colorScheme === 'balance-change') {
    if (account.balanceChange > 0) {
      nodeColor = 'bg-green-100 border-green-500 text-green-900';
    } else if (account.balanceChange < 0) {
      nodeColor = 'bg-red-100 border-red-500 text-red-900';
    } else {
      nodeColor = 'bg-gray-100 border-gray-500 text-gray-900';
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getBalanceChangeIcon = () => {
    if (account.balanceChange > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (account.balanceChange < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className={`px-4 py-3 rounded-lg border-2 shadow-md min-w-[200px] ${nodeColor}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      
      <div className="space-y-2">
        {/* Account Name */}
        <div className="font-semibold text-sm">
          {account.name}
        </div>
        
        {/* Account Code */}
        {showAccountCodes && (
          <div className="text-xs opacity-75">
            Code: {account.code}
          </div>
        )}
        
        {/* Account Type Badge */}
        <div className="text-xs font-medium opacity-75">
          {account.type}
        </div>
        
        {/* Balances */}
        {showBalances && (
          <div className="space-y-1 text-xs border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="opacity-75">Before:</span>
              <span className="font-mono">{formatCurrency(account.balanceBefore)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-75">Change:</span>
              <span className="font-mono flex items-center gap-1">
                {getBalanceChangeIcon()}
                {formatCurrency(Math.abs(account.balanceChange))}
              </span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>After:</span>
              <span className="font-mono">{formatCurrency(account.balanceAfter)}</span>
            </div>
          </div>
        )}
        
        {/* Hierarchy Info (Tooltip) */}
        <div className="text-xs opacity-50 truncate" title={`${account.hierarchy.primary} → ${account.hierarchy.secondary}`}>
          {account.hierarchy.secondary}
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});

AccountNode.displayName = 'AccountNode';
