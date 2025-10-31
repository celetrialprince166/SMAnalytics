'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { productService } from '@/lib/services/ProductService';
import { toast } from 'sonner';

interface ProductFormProps {
  productId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ productId, onSuccess, onCancel }: ProductFormProps) {
  const [name, setName] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [profitMargin, setProfitMargin] = useState('20');
  const [inventoryDescription, setInventoryDescription] = useState('');
  const [salesDescription, setSalesDescription] = useState('');
  const [costDescription, setCostDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    }
  }, [productId]);

  const loadProduct = async (id: string) => {
    try {
      const product = await productService.getProductById(id);
      if (product) {
        setName(product.name);
        setBatchCode('');
        const margin = product.unitPrice > 0 ? ((product.unitPrice - product.costPrice) / product.costPrice * 100) : 0;
        setProfitMargin(margin.toFixed(2));
        setInventoryDescription(product.description || '');
        setSalesDescription(product.description || '');
        setCostDescription(product.description || '');
      }
    } catch (err) {
      setError('Failed to load product');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const margin = parseFloat(profitMargin);
      if (isNaN(margin) || margin < 0 || margin >= 100) {
        throw new Error('Profit margin must be between 0 and 100');
      }

      if (productId) {
        await productService.updateProduct(productId, {
          name,
          description: inventoryDescription || salesDescription || costDescription,
        });
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct({
          name,
          description: inventoryDescription || salesDescription || costDescription,
          unitPrice: 0,
          costPrice: 0,
          quantityOnHand: 0,
          reorderLevel: 10,
        });
        toast.success('Product created successfully with accounts');
        handleNew();
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
      toast.error(err.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setName('');
    setBatchCode('');
    setProfitMargin('20');
    setInventoryDescription('');
    setSalesDescription('');
    setCostDescription('');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{productId ? 'Edit Product' : 'New Product'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchCode">Batch Code *</Label>
              <Input
                id="batchCode"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profitMargin">Profit Margin (%) *</Label>
            <Input
              id="profitMargin"
              type="number"
              step="0.01"
              min="0"
              max="99.99"
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inventoryDescription">Inventory Account Description</Label>
            <Textarea
              id="inventoryDescription"
              value={inventoryDescription}
              onChange={(e) => setInventoryDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salesDescription">Sales Account Description</Label>
            <Textarea
              id="salesDescription"
              value={salesDescription}
              onChange={(e) => setSalesDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="costDescription">Cost Account Description</Label>
            <Textarea
              id="costDescription"
              value={costDescription}
              onChange={(e) => setCostDescription(e.target.value)}
              rows={2}
            />
          </div>

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
              {isLoading ? 'Saving...' : productId ? 'Update' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
