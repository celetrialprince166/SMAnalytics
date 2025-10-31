export type ResourceType = 'SALES' | 'SUPPORT';
export type RepresentativeStatus = 'ACTIVE' | 'INACTIVE';

export interface SalesRepresentative {
  id: string;
  organizationId: string;
  salesEntryId: string;
  employeeId: string;
  resourceType: ResourceType;
  salesStake: number;
  relevantSales: number;
  salesTarget: number;
  commissionRate: number;
  commissionAmount: number;
  status: RepresentativeStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  
  // Relations (populated by Prisma includes)
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    surname: string;
    department?: string;
    position?: string;
    status: string;
  };
  salesEntry?: {
    id: string;
    salesCode: string;
    salesValue: number;
    date: Date;
    description: string;
  };
}

export interface CreateSalesRepresentativeRequest {
  salesEntryId: string;
  employeeId: string;
  resourceType: ResourceType;
  salesStake: number;
  salesTarget: number;
  commissionRate: number;
  status?: RepresentativeStatus;
}

export interface UpdateSalesRepresentativeRequest {
  resourceType?: ResourceType;
  salesStake?: number;
  salesTarget?: number;
  commissionRate?: number;
  status?: RepresentativeStatus;
}

export interface SalesRepresentativeValidation {
  isValid: boolean;
  errors: string[];
  totalStake: number;
  missingStake: number;
}
