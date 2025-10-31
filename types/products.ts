/**
 * Product and Sales Management Domain Models
 * 
 * This file contains all TypeScript interfaces related to products, sales entries,
 * and inventory management
 */

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  unitPrice: number;
  costPrice: number;
  quantityOnHand: number;
  reorderLevel: number;
  isActive: boolean;
  // Automatically created accounts
  inventoryAccountId: string;
  salesAccountId: string;
  costOfSalesAccountId: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface SalesEntry {
  id: string;
  date: Date;
  salesCode: string;
  productId: string;
  description: string;
  salesValue: number;
  costValue: number;
  customerAccountId: string;
  costTransactionNumber: string;
  salesTransactionNumber: string;
  invoiceNumber?: string;
  // VAT fields
  applyVat?: boolean;
  vatRate?: number;
  vatAmount?: number;
  totalWithVat?: number;
  // Additional fields
  orderNumber?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  product?: {
    id: string;
    name: string;
    code: string;
    salesAccountId: string;
    costOfSalesAccountId: string;
    inventoryAccountId: string;
  };
  customerAccount?: {
    secondaryAccount?: {
      id: string;
      name: string;
      code: string;
    };
    holderAccount?: {
      id: string;
      name: string;
      code: string;
    };
  };
}

// Request/Response types for product operations
export interface CreateProductRequest {
  name: string;
  description?: string;
  category?: string;
  unitPrice: number;
  costPrice: number;
  quantityOnHand?: number;
  reorderLevel?: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  unitPrice?: number;
  costPrice?: number;
  quantityOnHand?: number;
  reorderLevel?: number;
  isActive?: boolean;
}

// Request/Response types for sales operations
export interface CreateSalesEntryRequest {
  date: Date;
  productId?: string;
  serviceId?: string;
  description: string;
  salesValue: number;
  costValue: number;
  customerAccountId: string;
  applyVat?: boolean;
  vatRate?: number;
}

export interface UpdateSalesEntryRequest {
  date?: Date;
  description?: string;
  salesValue?: number;
  costValue?: number;
  customerAccountId?: string;
}

// Sales filters for queries
export interface SalesFilters {
  startDate?: Date;
  endDate?: Date;
  productId?: string;
  customerAccountId?: string;
  searchTerm?: string;
  minValue?: number;
  maxValue?: number;
}

// Sales summary for display
export interface SalesSummary {
  id: string;
  date: Date;
  salesCode: string;
  productName: string;
  description: string;
  salesValue: number;
  costValue: number;
  customerAccount: string;
}

// Invoice data structure
export interface Invoice {
  invoiceNumber: string;
  salesEntry: SalesEntry;
  product: Product;
  customer: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  date: Date;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  salesEntry: SalesEntry;
  product: Product;
  customer: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  company: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    logo?: string;
  };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  date: Date;
  dueDate?: Date;
  terms?: string;
}

// Inventory tracking
export interface InventoryMovement {
  id: string;
  date: Date;
  productId: string;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT';
  quantity: number;
  unitCost: number;
  totalCost: number;
  referenceNumber: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryLevel {
  productId: string;
  productName: string;
  currentQuantity: number;
  currentValue: number;
  averageCost: number;
  lastMovementDate: Date;
}
