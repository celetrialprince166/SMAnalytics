'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productService } from '@/lib/services/ProductService';
import { Product } from '@/types';

interface ProductSelectorProps {
  value?: string;
  onChange: (productId: string) => void;
  label?: string;
  disabled?: boolean;
}

export function ProductSelector({
  value,
  onChange,
  label = 'Product',
  disabled = false,
}: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getActiveProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select product" />
        </SelectTrigger>
        <SelectContent>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.name} ({product.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
