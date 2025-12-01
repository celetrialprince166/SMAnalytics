# Reports Migration Refined Plan

**Status**: Ready for Implementation  
**Date**: November 2025  
**Objective**: Fully migrate the Reports section from `localStorage` services to `Supabase` API services, ensuring performance, security, and data integrity.

---

## 1. Current State Analysis

### 1.1 Architecture
- **Legacy**: `ReportService.ts` (localStorage) aggregates data from `AccountService`, `TransactionService`, etc., performing heavy calculations on the client side (looping through all transactions).
- **New**: `ApiReportService.ts` exists as a shell. `ApiAccountService`, `ApiTransactionService`, `ApiSalesService`, and `ApiPayrollService` are implemented and functional.
- **API Endpoints**: Several optimized endpoints exist (`/api/reports/profit-loss`, `/api/reports/account-balance`), utilizing raw SQL/Prisma for server-side aggregation.

### 1.2 Gap Analysis
| Component | Status | Gap |
|-----------|--------|-----|
| `ApiReportService` | 🚧 Partial | Most methods throw "Not implemented". `generateTrialBalance` is implemented but uses N+1 query pattern (fetching balance for each account individually). |
| `Trial Balance` | ⚠️ Risk | `generateTrialBalance` needs to use a batch API endpoint instead of iterating. |
| `Income Statement` | ✅ Ready | Backend `/api/reports/profit-loss` exists and is optimized. Service method needs to call this. |
| `Balance Sheet` | ❌ Missing | `/api/reports/balance-sheet` exists (need to verify logic). Service method missing. |
| `Cash Flow` | ❌ Missing | No API endpoint or service method. |
| `UI Components` | 🔄 Legacy | All report components import `ReportService` (legacy). |
| `Data Fetching` | ⚠️ Risk | No standardized React Query hooks. Potential for prop drilling and lack of caching. |

---

## 2. Migration Strategy

### 2.1 Service Layer (`ApiReportService.ts`)
The `ApiReportService` will become a thin client wrapper around specialized API endpoints. It should **NOT** replicate the heavy client-side logic of the legacy service.

**Pattern:**
```typescript
// OLD (Legacy)
async generateTrialBalance() {
  const accounts = await accountService.getAll();
  for (const account of accounts) {
    account.balance = await calculateBalance(account.id); // N+1 issue
  }
}

// NEW (Target)
async generateTrialBalance(date: Date) {
  // Single API call that does the heavy lifting in DB
  return await this.request('/reports/trial-balance', { params: { date } }); 
}
```

### 2.2 API Layer (New & Updated Endpoints)
We need to ensure these endpoints exist and return data in the format expected by the UI (or update UI to match).

1.  **Trial Balance**: Create `/api/reports/trial-balance` (or optimize usage of `/api/reports/account-balance`).
    *   *Requirement*: Return all accounts with Debit/Credit sums or Net Balance, grouped by hierarchy.
2.  **Income Statement**: Use existing `/api/reports/profit-loss`.
3.  **Balance Sheet**: Verify/Update `/api/reports/balance-sheet`.
4.  **Cash Flow**: Create `/api/reports/cash-flow`.
5.  **Sales Reports**: Use `/api/reports/sales` and `ApiSalesService`.

### 2.3 Data Fetching (React Query)
Create a custom hook file `hooks/useReports.ts` to standardize fetching.

```typescript
export const useTrialBalance = (date: Date) => {
  return useQuery({
    queryKey: ['reports', 'trial-balance', date],
    queryFn: () => apiReportService.generateTrialBalance(date),
  });
};
```

---

## 3. Step-by-Step Execution Plan

### Phase 1: Foundation (Service & Hooks)
1.  **Update `ApiReportService.ts`**: 
    *   Implement methods to call API endpoints.
    *   Remove any client-side calculation logic where possible.
2.  **Create `hooks/useReports.ts`**: Implement `useTrialBalance`, `useIncomeStatement`, `useBalanceSheet`.
3.  **Verify API Endpoints**: Check `balance-sheet` and create `trial-balance` logic (can likely reuse `account-balance` logic but formatted strictly for Trial Balance).

### Phase 2: Financial Reports Migration
1.  **Trial Balance UI (`TrialBalanceReport.tsx`)**:
    *   Replace `ReportService` with `useTrialBalance`.
    *   Update interface to match API response.
2.  **Income Statement UI (`IncomeStatementReport.tsx`)**:
    *   Replace `ReportService` with `useIncomeStatement`.
    *   Map API `profit-loss` response to UI expectations.
3.  **Balance Sheet UI (`BalanceSheetReport.tsx`)**:
    *   Replace `ReportService` with `useBalanceSheet`.

### Phase 3: Detailed & Sales Reports
1.  **Account Reports**: Migrate `AccountTransactionsReportComponent` to use `ApiTransactionService.getTransactions`.
2.  **Sales Reports**: Migrate `SalesMovementReportComponent` to use `ApiSalesService` or `ApiReportService.generateSalesMovement`.

---

## 4. Technical Specifications

### 4.1 Recommended Trial Balance API Response
To match existing UI needs while being efficient:
```json
{
  "asOfDate": "2024-01-01",
  "accounts": [
    {
      "accountId": "uuid",
      "code": "1001",
      "name": "Cash",
      "debitBalance": 1500.00,
      "creditBalance": 0,
      "type": "ASSET"
    }
  ],
  "totalDebits": 1500.00,
  "totalCredits": 1500.00
}
```

### 4.2 Security & Multi-tenancy
*   **Crucial**: All API endpoints **MUST** derive `organizationId` from the authenticated user's session (or validate it if passed).
*   **RLS**: Ensure RLS policies are active on `transactions` and `accounts` tables.

---

## 5. Immediate Next Steps for Developer
1.  **Refactor `ApiReportService.ts`**: Replace the loop in `generateTrialBalance` with a call to a backend endpoint.
2.  **Create/Verify Endpoint**: Ensure an endpoint exists that returns the efficient trial balance data.
3.  **Create Hook**: `useTrialBalance`.
4.  **Update UI**: `TrialBalanceReport.tsx`.



