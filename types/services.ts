/**
 * Services Types
 * 
 * Types for service line management
 */

export interface ServiceLine {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  serviceLineId: string;
  code: string;
  name: string;
  description: string;
  averageFee: number;
  remarks?: string;
  teamLeaderId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface TeamLeader {
  id: string;
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceLineRequest {
  name: string;
  description?: string;
}

export interface UpdateServiceLineRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateServiceRequest {
  serviceLineId: string;
  name: string;
  description: string;
  averageFee: number;
  remarks?: string;
  teamLeaderId?: string;
}

export interface UpdateServiceRequest {
  serviceLineId?: string;
  name?: string;
  description?: string;
  averageFee?: number;
  remarks?: string;
  teamLeaderId?: string;
  isActive?: boolean;
}

export interface ServiceSummary {
  id: string;
  code: string;
  name: string;
  serviceLineName: string;
  averageFee: number;
  teamLeaderName?: string;
}
