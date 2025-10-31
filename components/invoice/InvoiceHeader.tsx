'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InvoiceData } from '@/types/products';

interface InvoiceHeaderProps {
  invoiceData: InvoiceData;
  onContactChange: (field: string, value: string) => void;
  onClose: () => void;
  onPrint: () => void;
  onSave: () => void;
}

export function InvoiceHeader({ invoiceData, onContactChange, onClose, onPrint, onSave }: InvoiceHeaderProps) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Invoice Header - {invoiceData.invoiceNumber}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Information Form */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact">Contact</Label>
            <Input 
              id="contact"
              value={invoiceData.customer.name}
              onChange={(e) => onContactChange('contact', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea 
              id="address"
              value={invoiceData.customer.address || ''}
              onChange={(e) => onContactChange('address', e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              type="email"
              value={invoiceData.customer.email || ''}
              onChange={(e) => onContactChange('email', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone"
              value={invoiceData.customer.phone || ''}
              onChange={(e) => onContactChange('phone', e.target.value)}
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={onPrint}>Print Report</Button>
          <Button onClick={onSave}>Save Report</Button>
          <Button variant="outline" onClick={onClose}>Return</Button>
        </div>
      </CardContent>
    </Card>
  );
}











