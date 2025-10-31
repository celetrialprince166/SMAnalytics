'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calculator, DollarSign } from 'lucide-react';
import { salesService } from '@/lib/services/SalesService';
import { productService } from '@/lib/services/ProductService';
import { toast } from 'sonner';
import { ProductSelector } from '@/components/products/ProductSelector';
import { AccountSelector } from '@/components/accounts/AccountSelector';
import { Product } from '@/types';

interface SalesFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SalesForm({ onSuccess, onCancel }: SalesFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [productId, setProductId] = useState('');
  const [description, setDescription] = useState('');
  const [salesValue, setSalesValue] = useState('');
  const [costValue, setCostValue] = useState('');
  const [customerAccountId, setCustomerAccountId] = useState('');
  const [applyVat, setApplyVat] = useState(false);
  const [vatRate, setVatRate] = useState('15');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    }
  }, [productId]);

  const loadProduct = async (id: string) => {
    try {
      const product = await productService.getProductById(id);
      if (product) {
        setSelectedProduct(product);
        // Auto-fill cost and sales values based on product
        setCostValue(product.costPrice.toString());
        setSalesValue(product.unitPrice.toString());
      }
    } catch (err) {
      console.error('Failed to load product:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await salesService.createSalesEntry({
        date: new Date(date),
        productId,
        description: description.trim(),
        salesValue: parseFloat(salesValue),
        costValue: parseFloat(costValue),
        customerAccountId,
        applyVat,
        vatRate: applyVat ? parseFloat(vatRate) : undefined,
      });

      toast.success('Sales entry created successfully');
      handleNew();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create sales entry');
      toast.error(err.message || 'Failed to create sales entry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setProductId('');
    setDescription('');
    setSalesValue('');
    setCostValue('');
    setCustomerAccountId('');
    setApplyVat(false);
    setVatRate('15');
    setSelectedProduct(null);
    setError('');
  };

  const calculateProfit = () => {
    const sales = parseFloat(salesValue) || 0;
    const cost = parseFloat(costValue) || 0;
    return sales - cost;
  };

  const calculateProfitMargin = () => {
    const sales = parseFloat(salesValue) || 0;
    const cost = parseFloat(costValue) || 0;
    if (cost === 0) return 0;
    return ((sales - cost) / cost) * 100;
  };

  const calculateVat = () => {
    if (!applyVat) return 0;
    const sales = parseFloat(salesValue) || 0;
    const rate = parseFloat(vatRate) || 0;
    return (sales * rate) / 100;
  };

  const calculateTotal = () => {
    const sales = parseFloat(salesValue) || 0;
    const vat = calculateVat();
    return sales + vat;
  };

  const profit = calculateProfit();
  const profitMargin = calculateProfitMargin();
  const vatAmount = calculateVat();
  const totalWithVat = calculateTotal();

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>New Sales Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Product Selection */}
          <ProductSelector
            label="Product *"
            value={productId}
            onChange={(id) => {
              setProductId(id);
            }}
          />

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter sales description"
              rows={2}
              required
            />
          </div>

          {/* Customer Account */}
          <AccountSelector
            label="Customer Account *"
            value={customerAccountId}
            onChange={setCustomerAccountId}
            placeholder="Select customer account"
          />

          {/* Values */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costValue">Cost Value *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="costValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={costValue}
                    onChange={(e) => setCostValue(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salesValue">Sales Value *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="salesValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={salesValue}
                    onChange={(e) => setSalesValue(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </div>

            {/* VAT Section */}
            <Card className="p-4 border-2">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="applyVat"
                    checked={applyVat}
                    onCheckedChange={(checked) => setApplyVat(checked as boolean)}
                  />
                  <Label htmlFor="applyVat" className="cursor-pointer font-semibold">
                    Apply VAT
                  </Label>
                </div>

                {applyVat && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vatRate">VAT Rate (%)</Label>
                      <Input
                        id="vatRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={vatRate}
                        onChange={(e) => setVatRate(e.target.value)}
                        placeholder="15.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>VAT Amount</Label>
                      <Input
                        readOnly
                        value={`GHS ${vatAmount.toFixed(2)}`}
                        className="bg-muted font-mono"
                      />
                    </div>
                  </div>
                )}

                {applyVat && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total with VAT:</span>
                      <span className="text-lg font-bold text-primary">
                        GHS {totalWithVat.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Profit Calculations */}
            {(salesValue || costValue) && (
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4" />
                  <span className="font-semibold">Profit Analysis</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Gross Profit:</span>
                    <span className={`ml-2 font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      GHS {profit.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Profit Margin:</span>
                    <span className={`ml-2 font-medium ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitMargin.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Transaction Info */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20">
            <div className="text-sm">
              <div className="font-semibold mb-2">Automatic Transactions</div>
              <div className="text-muted-foreground space-y-1">
                <p>This sales entry will automatically create:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Cost of Sales transaction (Debit: Cost of Sales, Credit: Inventory)</li>
                  <li>Sales Revenue transaction (Debit: Customer, Credit: Sales)</li>
                  <li>Inventory movement record</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleNew}>
              New
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Sales Entry'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
