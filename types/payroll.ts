/**
 * Payroll Types
 * 
 * Types for payroll, employee management, and salary processing
 */

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type Gender = 'MALE' | 'FEMALE';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
export type Nationality = 'GHANAIAN' | 'OTHER';

export interface Employee {
  id: string;
  employeeId: string; // Auto-generated (EMP-0001, EMP-0002, etc.)
  entryDate: Date;
  status: EmployeeStatus;
  
  // Personal Information
  surname: string;
  firstName: string;
  otherNames?: string;
  dateOfBirth: Date;
  placeOfBirth?: string;
  nationality: Nationality;
  gender: Gender;
  maritalStatus: MaritalStatus;
  numberOfChildren: number;
  
  // Contact Information
  residentialAddress?: string;
  emailAddress: string;
  phoneNumber: string;
  
  // Employment Details
  position?: string;
  department?: string;
  basicSalary: number;
  supervisor?: string;
  entryLevel?: string;
  currentLevel?: string;
  entryBasicSalary?: number;
  
  // Bank Details
  holdingBank?: string;
  bankBranch?: string;
  bankAccountNo?: string;
  
  // Tax & Pension
  taxNumber?: string;
  ssnitNumber?: string;
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CreateEmployeeRequest {
  entryDate: Date;
  status: EmployeeStatus;
  surname: string;
  firstName: string;
  otherNames?: string;
  dateOfBirth: Date;
  placeOfBirth?: string;
  nationality: Nationality;
  gender: Gender;
  maritalStatus: MaritalStatus;
  numberOfChildren?: number;
  residentialAddress?: string;
  emailAddress: string;
  phoneNumber: string;
  position?: string;
  department?: string;
  basicSalary: number;
  taxNumber?: string;
  ssnitNumber?: string;
}

export interface UpdateEmployeeRequest {
  entryDate?: Date;
  status?: EmployeeStatus;
  surname?: string;
  firstName?: string;
  otherNames?: string;
  dateOfBirth?: Date;
  placeOfBirth?: string;
  nationality?: Nationality;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  numberOfChildren?: number;
  residentialAddress?: string;
  emailAddress?: string;
  phoneNumber?: string;
  position?: string;
  department?: string;
  basicSalary?: number;
  taxNumber?: string;
  ssnitNumber?: string;
  isActive?: boolean;
}

export interface EmployeeSummary {
  id: string;
  employeeId: string;
  fullName: string;
  position?: string;
  department?: string;
  basicSalary: number;
  status: string;
  emailAddress: string;
  phoneNumber: string;
}

export interface EmployeeFilters {
  search?: string;
  status?: EmployeeStatus;
  department?: string;
  entryDateFrom?: Date;
  entryDateTo?: Date;
}

// Tax Configuration Types
export interface TaxBracket {
  id: string;
  order: number;
  amount: number; // Amount in this bracket (0 for first and remainder)
  rate: number; // Tax rate as percentage
}

export interface TaxConfiguration {
  id: string;
  effectiveDate: Date;
  brackets: TaxBracket[];
  nonResidentRate: number;
  personalRelief: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Pension Configuration Types
export interface PensionConfiguration {
  id: string;
  effectiveDate: Date;
  
  // Tier 1
  tier1EmployerRate: number;
  tier1EmployeeRate: number;
  tier1PensionRate: number;
  tier1NHISRate: number;
  
  // Tier 2
  tier2Rate: number;
  
  // Tier 3
  tier3EmployerRate: number;
  tier3EmployeeRate: number;
  tier3MaxAmount?: number;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Salary Entry Types
export interface SalaryEntry {
  id: string;
  employeeId: string;
  salaryDate: Date;
  processedDate: Date;
  
  // Earnings
  basicSalary: number;
  allowances: number;
  commission: number;
  grossSalary: number;
  
  // Deductions
  incomeTax: number;
  tier1Employee: number;
  tier2: number;
  tier3Employee: number;
  totalSSNIT: number;
  otherDeductions: number;
  totalDeductions: number;
  
  // Net
  netSalary: number;
  
  // References
  taxConfigId?: string;
  pensionConfigId?: string;
  
  // Metadata
  remarks?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface CreateSalaryEntryRequest {
  employeeId: string;
  salaryDate: Date;
  allowances?: number;
  commission?: number;
  otherDeductions?: number;
  remarks?: string;
}

// Commission Types
export interface Commission {
  id: string;
  employeeId: string;
  salesEntryId?: string;
  commissionDate: Date;
  amount: number;
  rate: number;
  salesAmount: number;
  remarks?: string;
  isPaid: boolean;
  paidDate?: Date;
  salaryEntryId?: string;
  createdAt: Date;
}

export interface CreateCommissionRequest {
  employeeId: string;
  salesEntryId?: string;
  commissionDate: Date;
  amount: number;
  rate: number;
  salesAmount: number;
  remarks?: string;
}
