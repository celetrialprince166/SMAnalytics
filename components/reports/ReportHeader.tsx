'use client';

import { Button } from '@/components/ui/button';
import { FileDown, Printer } from 'lucide-react';

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  onExport?: (format: 'PDF' | 'EXCEL') => void;
  onPrint?: () => void;
  children?: React.ReactNode;  // For additional controls like date pickers
}

export function ReportLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <div className="bg-gray-600 text-white px-2 py-1 text-sm font-bold">s</div>
        <div className="bg-yellow-600 text-white px-2 py-1 text-sm font-bold">&amp;</div>
        <div className="bg-gray-600 text-white px-2 py-1 text-sm font-bold">m</div>
      </div>
      <span className="text-yellow-600 font-semibold italic">analytics</span>
    </div>
  );
}

export function ReportHeader({ 
  title, 
  subtitle, 
  onExport, 
  onPrint,
  children 
}: ReportHeaderProps) {
  return (
    <div className="space-y-4 pb-4">
      {/* Company Logo/Name and Export Buttons */}
      <div className="flex items-center justify-between">
        <ReportLogo />

        {/* Export Buttons */}
        <div className="flex gap-2 print:hidden">
          {children}
          {onExport && (
            <>
              <Button variant="outline" size="sm" onClick={() => onExport('PDF')}>
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport('EXCEL')}>
                <FileDown className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </>
          )}
          {onPrint && (
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          )}
        </div>
      </div>

      {/* Report Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
      </div>
    </div>
  );
}



