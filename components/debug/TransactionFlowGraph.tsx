/**
 * Transaction Flow Graph Component
 * 
 * Main graph visualization using React Flow
 */

'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { TransactionDebugData } from '@/types/debug';
import { AccountNode } from './AccountNode';
import { useDebugMode } from '@/lib/contexts/DebugModeContext';

interface TransactionFlowGraphProps {
  debugData: TransactionDebugData;
}

const nodeTypes = {
  accountNode: AccountNode,
};

export function TransactionFlowGraph({ debugData }: TransactionFlowGraphProps) {
  const { settings } = useDebugMode();
  
  // Debug logging for visualization data
  console.log('[DEBUG VISUALIZATION] ═══════════════════════════════════════════════════════════');
  console.log('[DEBUG VISUALIZATION] TransactionFlowGraph received data:');
  console.log('[DEBUG VISUALIZATION] Transaction Type:', debugData.transactionType);
  console.log('[DEBUG VISUALIZATION] Transaction ID:', debugData.transactionId);
  console.log('[DEBUG VISUALIZATION] Account count:', debugData.accounts.length);
  console.log('[DEBUG VISUALIZATION] Flow count:', debugData.flows.length);
  console.log('[DEBUG VISUALIZATION] Accounts:');
  debugData.accounts.forEach((account, i) => {
    console.log(`[DEBUG VISUALIZATION]   ${i + 1}. ${account.name} (${account.code})`);
    console.log(`[DEBUG VISUALIZATION]      ID: ${account.id}`);
    console.log(`[DEBUG VISUALIZATION]      Type: ${account.type}`);
    console.log(`[DEBUG VISUALIZATION]      Before: ${account.balanceBefore}`);
    console.log(`[DEBUG VISUALIZATION]      Change: ${account.balanceChange}`);
    console.log(`[DEBUG VISUALIZATION]      After: ${account.balanceAfter}`);
  });
  console.log('[DEBUG VISUALIZATION] Flows:');
  debugData.flows.forEach((flow, i) => {
    console.log(`[DEBUG VISUALIZATION]   ${i + 1}. ${flow.label || flow.description}`);
    console.log(`[DEBUG VISUALIZATION]      From: ${flow.fromAccountId}`);
    console.log(`[DEBUG VISUALIZATION]      To: ${flow.toAccountId}`);
    console.log(`[DEBUG VISUALIZATION]      Amount: ${flow.amount}`);
  });
  console.log('[DEBUG VISUALIZATION] ═══════════════════════════════════════════════════════════');
  
  // Generate nodes from accounts
  const initialNodes: Node[] = useMemo(() => {
    const isHorizontal = settings.layout === 'horizontal';
    const spacing = 300;
    
    return debugData.accounts.map((account, index) => {
      // Calculate position based on layout
      let x = 0;
      let y = 0;
      
      if (isHorizontal) {
        // Horizontal layout: arrange in columns
        const column = index % 2; // Alternate between left and right
        const row = Math.floor(index / 2);
        x = column * spacing * 2;
        y = row * 150;
      } else {
        // Vertical layout: arrange in rows
        const row = index % 2;
        const column = Math.floor(index / 2);
        x = column * spacing;
        y = row * 200 * 2;
      }
      
      return {
        id: account.id,
        type: 'accountNode',
        position: { x, y },
        data: {
          account,
          showBalances: settings.showBalances,
          showAccountCodes: settings.showAccountCodes,
          colorScheme: settings.colorScheme,
        },
      };
    });
  }, [debugData.accounts, settings]);

  // Generate edges from flows
  const initialEdges: Edge[] = useMemo(() => {
    return debugData.flows.map((flow) => {
      const isDebit = flow.direction === 'debit';
      
      return {
        id: flow.id,
        source: flow.fromAccountId,
        target: flow.toAccountId,
        label: flow.label || `${new Intl.NumberFormat('en-GH', {
          style: 'currency',
          currency: 'GHS',
        }).format(flow.amount)}`,
        labelStyle: { 
          fill: isDebit ? '#dc2626' : '#16a34a',
          fontWeight: 600,
          fontSize: 12,
        },
        labelBgStyle: { 
          fill: '#ffffff',
          fillOpacity: 0.9,
        },
        style: { 
          stroke: isDebit ? '#dc2626' : '#16a34a',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isDebit ? '#dc2626' : '#16a34a',
        },
        animated: settings.animateFlows,
      };
    });
  }, [debugData.flows, settings.animateFlows]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
