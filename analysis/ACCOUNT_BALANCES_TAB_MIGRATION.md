# Account Balances Tab Migration Plan

## Overview
Migrate the Account Balances Tab from localStorage-based services to API-based services.

## Current Implementation Analysis

### File: `components/reports/AccountBalancesTab.tsx`

### Current Service Imports (Lines 19-20):
```typescript
import { reportService } from '@/lib/services/ReportService';
import { accountService } from '@/lib/services/AccountService';
```

### Target Service Imports:
```typescript
import { apiReportService } from '@/lib/services/ApiReportService';
import { apiAccountService } from '@/lib/services/ApiAccountService';
```

---

## UI Components to Migrate

### Section 1: Statement of Account
| Component | Type | Current Service | API Method | Status |
|-----------|------|-----------------|------------|--------|
| From Date | Input (date) | N/A | N/A | UI Only |
| To Date | Input (date) | N/A | N/A | UI Only |
| Primary Account Dropdown | Select | `accountService.getAccountHierarchy()` | `apiAccountService.getAccountHierarchy()` | ⬜ Pending |
| Secondary Account Dropdown | Select | `accountService.getSecondaryAccounts()` | `apiAccountService.getSecondaryAccounts()` | ⬜ Pending |
| Holder Account Dropdown | Select | `accountService.getHolderAccounts()` | `apiAccountService.getHolderAccounts()` | ⬜ Pending |
| Run Button | Button | `reportService.generateStatementOfAccounts()` | `apiReportService.generateStatementOfAccounts()` | ⬜ Pending |

### Section 2: Ageing Analysis
| Component | Type | Current Service | API Method | Status |
|-----------|------|-----------------|------------|--------|
| Current Date | Input (date) | N/A | N/A | UI Only |
| Run Button | Button | `reportService.generateAgeingAnalysis()` | `apiReportService.generateAgeingAnalysis()` | ⬜ Pending |

### Section 3: Trial Balance
| Component | Type | Current Service | API Method | Status |
|-----------|------|-----------------|------------|--------|
| Secondary Accounts Radio | RadioGroup | N/A | N/A | UI Only |
| Holder Accounts Radio | RadioGroup | N/A | N/A | UI Only |
| Mode Dropdown | Select | N/A | N/A | UI Only |
| As at Date | Input (date) | N/A | N/A | UI Only |
| Run Button | Button | `reportService.generateTrialBalance()` | `apiReportService.generateTrialBalance()` | ⬜ Pending |

---

## Service Method Mapping

### AccountService → ApiAccountService
| Method | Current | API Equivalent | Line |
|--------|---------|----------------|------|
| Load Primary Accounts | `accountService.getAccountHierarchy()` | `apiAccountService.getAccountHierarchy()` | 77 |
| Load Secondary Accounts | `accountService.getSecondaryAccounts(primaryId)` | `apiAccountService.getSecondaryAccounts(primaryId)` | 87 |
| Load Holder Accounts | `accountService.getHolderAccounts(secondaryId)` | `apiAccountService.getHolderAccounts(secondaryId)` | 97 |

### ReportService → ApiReportService
| Method | Current | API Equivalent | Line |
|--------|---------|----------------|------|
| Generate Trial Balance | `reportService.generateTrialBalance(date, type)` | `apiReportService.generateTrialBalance(date, type)` | 111 |
| Generate Statement of Accounts | `reportService.generateStatementOfAccounts(id, start, end)` | `apiReportService.generateStatementOfAccounts(id, start, end)` | 135 |
| Generate Ageing Analysis | `reportService.generateAgeingAnalysis(date, type)` | `apiReportService.generateAgeingAnalysis(date, type)` | 154 |

---

## Migration Checklist

### Phase 1: Update Imports
- [ ] Change `accountService` → `apiAccountService`
- [ ] Change `reportService` → `apiReportService`

### Phase 2: Update Service Calls
- [ ] Update `loadAccounts()` (Line 75-83)
- [ ] Update `loadSecondaryAccounts()` (Line 85-93)
- [ ] Update `loadHolderAccounts()` (Line 95-103)
- [ ] Update `handleRunTrialBalance()` (Line 105-122)
- [ ] Update `handleRunStatementOfAccounts()` (Line 124-147)
- [ ] Update `handleRunAgeingAnalysis()` (Line 149-166)

### Phase 3: Browser Testing
- [ ] Test Primary Account dropdown loads
- [ ] Test Secondary Account dropdown cascades
- [ ] Test Holder Account dropdown cascades
- [ ] Test Statement of Account Run button
- [ ] Test Ageing Analysis Run button
- [ ] Test Trial Balance Run button

---

## Success Criteria

- [ ] Primary Account dropdown loads from API
- [ ] Secondary Account dropdown cascades and loads filtered data
- [ ] Holder Account dropdown cascades and loads filtered data
- [ ] Statement of Account report generates correctly
- [ ] Ageing Analysis report generates correctly
- [ ] Trial Balance report generates correctly (Secondary and Holder modes)
- [ ] Error handling shows proper toast messages
- [ ] Loading states work correctly
- [ ] Browser testing confirms all functionality

