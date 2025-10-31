/**
 * API Client Library
 * 
 * Type-safe API client for frontend applications
 */

import { 
  CreateOrganizationInput,
  UpdateOrganizationInput,
  GetOrganizationsInput,
  CreateUserInput,
  UpdateUserInput,
  GetUsersInput,
  CreatePrimaryAccountInput,
  UpdatePrimaryAccountInput,
  GetPrimaryAccountsInput,
  CreateSecondaryAccountInput,
  UpdateSecondaryAccountInput,
  GetSecondaryAccountsInput,
  CreateHolderAccountInput,
  UpdateHolderAccountInput,
  GetHolderAccountsInput,
  CreateTransactionInput,
  UpdateTransactionInput,
  GetTransactionsInput,
  CreateProductInput,
  UpdateProductInput,
  GetProductsInput,
  CreateSalesEntryInput,
  UpdateSalesEntryInput,
  GetSalesEntriesInput,
  CreateClientInput,
  UpdateClientInput,
  GetClientsInput,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  GetEmployeesInput,
  CreateFixedAssetInput,
  UpdateFixedAssetInput,
  GetFixedAssetsInput,
  CreateCompanySettingsInput,
  UpdateCompanySettingsInput,
  GetCompanySettingsInput,
  GetAccountBalanceReportInput,
  GetBalanceSheetInput,
  GetProfitLossInput,
  GetCashFlowInput,
  GetSalesReportInput,
  GetPayrollReportInput
} from '@/lib/validation/schemas';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

// API Client Configuration
export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// API Client Class
export class ApiClient {
  private config: ApiClientConfig;
  private authToken: string | null = null;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  // Set authentication token
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Make HTTP request with retry logic
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout!),
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retries!; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ApiError(
            response.status,
            errorData.message || `HTTP ${response.status}`,
            errorData.errors
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retries!) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay!));
        }
      }
    }

    throw lastError;
  }

  // Generic CRUD operations
  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  // Organizations API
  async getOrganizations(params?: GetOrganizationsInput) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.get<PaginatedResponse>(`/api/organizations${queryString ? `?${queryString}` : ''}`);
  }

  async getOrganization(id: string) {
    return this.get<ApiResponse>(`/api/organizations/${id}`);
  }

  async createOrganization(data: CreateOrganizationInput) {
    return this.post<ApiResponse>('/api/organizations', data);
  }

  async updateOrganization(id: string, data: UpdateOrganizationInput) {
    return this.put<ApiResponse>(`/api/organizations/${id}`, data);
  }

  async deleteOrganization(id: string) {
    return this.delete<ApiResponse>(`/api/organizations/${id}`);
  }

  // Users API
  async getUsers(params?: GetUsersInput) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.get<PaginatedResponse>(`/api/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUser(id: string) {
    return this.get<ApiResponse>(`/api/users/${id}`);
  }

  async createUser(data: CreateUserInput) {
    return this.post<ApiResponse>('/api/users', data);
  }

  async updateUser(id: string, data: UpdateUserInput) {
    return this.put<ApiResponse>(`/api/users/${id}`, data);
  }

  async deleteUser(id: string) {
    return this.delete<ApiResponse>(`/api/users/${id}`);
  }

  // Primary Accounts API
  async getPrimaryAccounts(params?: GetPrimaryAccountsInput) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.get<PaginatedResponse>(`/api/accounts/primary${queryString ? `?${queryString}` : ''}`);
  }

  async getPrimaryAccount(id: string) {
    return this.get<ApiResponse>(`/api/accounts/primary/${id}`);
  }

  async createPrimaryAccount(data: CreatePrimaryAccountInput) {
    return this.post<ApiResponse>('/api/accounts/primary', data);
  }

  async updatePrimaryAccount(id: string, data: UpdatePrimaryAccountInput) {
    return this.put<ApiResponse>(`/api/accounts/primary/${id}`, data);
  }

  async deletePrimaryAccount(id: string) {
    return this.delete<ApiResponse>(`/api/accounts/primary/${id}`);
  }

  // Secondary Accounts API
  async getSecondaryAccounts(params?: GetSecondaryAccountsInput) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.get<PaginatedResponse>(`/api/accounts/secondary${queryString ? `?${queryString}` : ''}`);
  }

  async getSecondaryAccount(id: string) {
    return this.get<ApiResponse>(`/api/accounts/secondary/${id}`);
  }

  async createSecondaryAccount(data: CreateSecondaryAccountInput) {
    return this.post<ApiResponse>('/api/accounts/secondary', data);
  }

  async updateSecondaryAccount(id: string, data: UpdateSecondaryAccountInput) {
    return this.put<ApiResponse>(`/api/accounts/secondary/${id}`, data);
  }

  async deleteSecondaryAccount(id: string) {
    return this.delete<ApiResponse>(`/api/accounts/secondary/${id}`);
  }

  // Holder Accounts API
  async getHolderAccounts(params?: GetHolderAccountsInput) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.get<PaginatedResponse>(`/api/accounts/holder${queryString ? `?${queryString}` : ''}`);
  }

  async getHolderAccount(id: string) {
    return this.get<ApiResponse>(`/api/accounts/holder/${id}`);
  }

  async createHolderAccount(data: CreateHolderAccountInput) {
    return this.post<ApiResponse>('/api/accounts/holder', data);
  }

  async updateHolderAccount(id: string, data: UpdateHolderAccountInput) {
    return this.put<ApiResponse>(`/api/accounts/holder/${id}`, data);
  }

  async deleteHolderAccount(id: string) {
    return this.delete<ApiResponse>(`/api/accounts/holder/${id}`);
  }

  // Transactions API
  async getTransactions(params?: GetTransactionsInput) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.get<PaginatedResponse>(`/api/transactions${queryString ? `?${queryString}` : ''}`);
  }

  async getTransaction(id: string) {
    return this.get<ApiResponse>(`/api/transactions/${id}`);
  }

  async createTransaction(data: CreateTransactionInput) {
    return this.post<ApiResponse>('/api/transactions', data);
  }

  async updateTransaction(id: string, data: UpdateTransactionInput) {
    return this.put<ApiResponse>(`/api/transactions/${id}`, data);
  }

  async deleteTransaction(id: string) {
    return this.delete<ApiResponse>(`/api/transactions/${id}`);
  }

  // Transaction Reconciliation API
  async reconcileTransaction(transactionId: string, reconciled: boolean) {
    return this.post<ApiResponse>('/api/transactions/reconcile', { transactionId, reconciled });
  }

  async reconcileMultipleTransactions(transactionIds: string[], reconciled: boolean) {
    return this.put<ApiResponse>('/api/transactions/reconcile', { transactionIds, reconciled });
  }

  // Products API
  async getProducts(params?: GetProductsInput) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.get<PaginatedResponse>(`/api/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProduct(id: string) {
    return this.get<ApiResponse>(`/api/products/${id}`);
  }

  async createProduct(data: CreateProductInput) {
    return this.post<ApiResponse>('/api/products', data);
  }

  async updateProduct(id: string, data: UpdateProductInput) {
    return this.put<ApiResponse>(`/api/products/${id}`, data);
  }

  async deleteProduct(id: string) {
    return this.delete<ApiResponse>(`/api/products/${id}`);
  }

  // Sales Entries API
  async getSalesEntries(params?: GetSalesEntriesInput) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.get<PaginatedResponse>(`/api/sales${queryString ? `?${queryString}` : ''}`);
  }

  async getSalesEntry(id: string) {
    return this.get<ApiResponse>(`/api/sales/${id}`);
  }

  async createSalesEntry(data: CreateSalesEntryInput) {
    return this.post<ApiResponse>('/api/sales', data);
  }

  async updateSalesEntry(id: string, data: UpdateSalesEntryInput) {
    return this.put<ApiResponse>(`/api/sales/${id}`, data);
  }

  async deleteSalesEntry(id: string) {
    return this.delete<ApiResponse>(`/api/sales/${id}`);
  }

  // Clients API
  async getClients(params?: GetClientsInput) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.get<PaginatedResponse>(`/api/clients${queryString ? `?${queryString}` : ''}`);
  }

  async getClient(id: string) {
    return this.get<ApiResponse>(`/api/clients/${id}`);
  }

  async createClient(data: CreateClientInput) {
    return this.post<ApiResponse>('/api/clients', data);
  }

  async updateClient(id: string, data: UpdateClientInput) {
    return this.put<ApiResponse>(`/api/clients/${id}`, data);
  }

  async deleteClient(id: string) {
    return this.delete<ApiResponse>(`/api/clients/${id}`);
  }

  // Employees API
  async getEmployees(params?: GetEmployeesInput) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.get<PaginatedResponse>(`/api/employees${queryString ? `?${queryString}` : ''}`);
  }

  async getEmployee(id: string) {
    return this.get<ApiResponse>(`/api/employees/${id}`);
  }

  async createEmployee(data: CreateEmployeeInput) {
    return this.post<ApiResponse>('/api/employees', data);
  }

  async updateEmployee(id: string, data: UpdateEmployeeInput) {
    return this.put<ApiResponse>(`/api/employees/${id}`, data);
  }

  async deleteEmployee(id: string) {
    return this.delete<ApiResponse>(`/api/employees/${id}`);
  }

  // Fixed Assets API
  async getFixedAssets(params?: GetFixedAssetsInput) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.get<PaginatedResponse>(`/api/fixed-assets${queryString ? `?${queryString}` : ''}`);
  }

  async getFixedAsset(id: string) {
    return this.get<ApiResponse>(`/api/fixed-assets/${id}`);
  }

  async createFixedAsset(data: CreateFixedAssetInput) {
    return this.post<ApiResponse>('/api/fixed-assets', data);
  }

  async updateFixedAsset(id: string, data: UpdateFixedAssetInput) {
    return this.put<ApiResponse>(`/api/fixed-assets/${id}`, data);
  }

  async deleteFixedAsset(id: string) {
    return this.delete<ApiResponse>(`/api/fixed-assets/${id}`);
  }

  // Fixed Asset Depreciation API
  async getDepreciationEntries(assetId: string) {
    return this.get<ApiResponse>(`/api/fixed-assets/${assetId}/depreciation`);
  }

  async calculateDepreciation(assetId: string, date: Date) {
    return this.post<ApiResponse>(`/api/fixed-assets/${assetId}/depreciation`, { date });
  }

  async recordDepreciation(assetId: string, date: Date, amount: number) {
    return this.put<ApiResponse>(`/api/fixed-assets/${assetId}/depreciation`, { date, amount });
  }

  // Company Settings API
  async getCompanySettings(params?: GetCompanySettingsInput) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.get<ApiResponse>(`/api/company-settings${queryString ? `?${queryString}` : ''}`);
  }

  async createCompanySettings(data: CreateCompanySettingsInput) {
    return this.post<ApiResponse>('/api/company-settings', data);
  }

  async updateCompanySettings(id: string, data: UpdateCompanySettingsInput) {
    return this.put<ApiResponse>(`/api/company-settings/${id}`, data);
  }

  // Reports API
  async getAccountBalanceReport(params: GetAccountBalanceReportInput) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    return this.get<ApiResponse>(`/api/reports/account-balance?${queryString}`);
  }

  async getBalanceSheet(params: GetBalanceSheetInput) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    return this.get<ApiResponse>(`/api/reports/balance-sheet?${queryString}`);
  }

  async getProfitLossReport(params: GetProfitLossInput) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    return this.get<ApiResponse>(`/api/reports/profit-loss?${queryString}`);
  }

  async getSalesReport(params: GetSalesReportInput) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    return this.get<ApiResponse>(`/api/reports/sales?${queryString}`);
  }
}

// Custom Error Class
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Array<{
      field: string;
      message: string;
      code: string;
    }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Default API Client Instance
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
});

// Types are already exported above















