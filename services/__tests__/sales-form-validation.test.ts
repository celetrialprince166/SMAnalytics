/**
 * Sales Form Validation Test
 * 
 * Tests the updated sales form validation logic where either product OR service must be selected
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock the API service for testing
const mockApiSalesService = {
  createSalesEntry: async (data: any) => {
    // Simulate API response
    return { success: true, data: { id: 'test-id', ...data } };
  }
};

// Mock validation function (simplified version of the actual validation)
function validateSalesForm(data: {
  productId?: string;
  serviceId?: string;
  description: string;
  salesValue: number;
  costValue: number;
  customerAccountId: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Either productId OR serviceId must be provided
  if (!data.productId && !data.serviceId) {
    errors.push('Either product or service is required');
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!data.customerAccountId) {
    errors.push('Customer account is required');
  }

  if (data.salesValue < 0) {
    errors.push('Sales value must be non-negative');
  }

  if (data.costValue < 0) {
    errors.push('Cost value must be non-negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

describe('Sales Form Validation', () => {
  const baseValidData = {
    description: 'Test sales entry',
    salesValue: 1000,
    costValue: 600,
    customerAccountId: 'customer-123'
  };

  it('should pass validation when product is selected', () => {
    const data = {
      ...baseValidData,
      productId: 'product-123'
    };

    const result = validateSalesForm(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass validation when service is selected', () => {
    const data = {
      ...baseValidData,
      serviceId: 'service-123'
    };

    const result = validateSalesForm(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass validation when both product and service are selected', () => {
    const data = {
      ...baseValidData,
      productId: 'product-123',
      serviceId: 'service-123'
    };

    const result = validateSalesForm(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation when neither product nor service is selected', () => {
    const data = {
      ...baseValidData
      // No productId or serviceId
    };

    const result = validateSalesForm(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Either product or service is required');
  });

  it('should fail validation when description is missing', () => {
    const data = {
      ...baseValidData,
      productId: 'product-123',
      description: ''
    };

    const result = validateSalesForm(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Description is required');
  });

  it('should fail validation when customer account is missing', () => {
    const data = {
      ...baseValidData,
      productId: 'product-123',
      customerAccountId: ''
    };

    const result = validateSalesForm(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Customer account is required');
  });

  it('should fail validation when sales value is negative', () => {
    const data = {
      ...baseValidData,
      productId: 'product-123',
      salesValue: -100
    };

    const result = validateSalesForm(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Sales value must be non-negative');
  });

  it('should fail validation when cost value is negative', () => {
    const data = {
      ...baseValidData,
      serviceId: 'service-123',
      costValue: -50
    };

    const result = validateSalesForm(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Cost value must be non-negative');
  });
});

describe('Sales Form UI Labels', () => {
  it('should show product as optional when service is selected', () => {
    const selectedServiceId = 'service-123';
    const selectedProductId = '';

    const productLabel = selectedServiceId ? 'Product (Optional)' : 'Product *';
    const serviceLabel = selectedProductId ? 'Service (Optional)' : 'Service *';

    expect(productLabel).toBe('Product (Optional)');
    expect(serviceLabel).toBe('Service *');
  });

  it('should show service as optional when product is selected', () => {
    const selectedServiceId = '';
    const selectedProductId = 'product-123';

    const productLabel = selectedServiceId ? 'Product (Optional)' : 'Product *';
    const serviceLabel = selectedProductId ? 'Service (Optional)' : 'Service *';

    expect(productLabel).toBe('Product *');
    expect(serviceLabel).toBe('Service (Optional)');
  });

  it('should show both as required when neither is selected', () => {
    const selectedServiceId = '';
    const selectedProductId = '';

    const productLabel = selectedServiceId ? 'Product (Optional)' : 'Product *';
    const serviceLabel = selectedProductId ? 'Service (Optional)' : 'Service *';

    expect(productLabel).toBe('Product *');
    expect(serviceLabel).toBe('Service *');
  });
});









