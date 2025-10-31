/**
 * Clients Types
 * 
 * Types for client management
 */

export interface Client {
  id: string;
  clientId: string; // Auto-generated client ID
  registrationDate: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  companyName: string;
  companyRegNo?: string;
  address?: string;
  contactPerson: string;
  emailAddress: string;
  phoneNumbers: string;
  remarks?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CreateClientRequest {
  registrationDate: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  companyName: string;
  companyRegNo?: string;
  address?: string;
  contactPerson: string;
  emailAddress: string;
  phoneNumbers: string;
  remarks?: string;
}

export interface UpdateClientRequest {
  registrationDate?: Date;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  companyName?: string;
  companyRegNo?: string;
  address?: string;
  contactPerson?: string;
  emailAddress?: string;
  phoneNumbers?: string;
  remarks?: string;
  isActive?: boolean;
}

export interface ClientSummary {
  id: string;
  clientId: string;
  companyName: string;
  contactPerson: string;
  emailAddress: string;
  status: string;
}

export interface ClientFilters {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  registrationDateFrom?: Date;
  registrationDateTo?: Date;
}
