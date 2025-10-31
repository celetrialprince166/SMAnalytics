# Project Structure

## Directory Organization

### `/app` - Next.js App Router Pages
Route-based file structure using Next.js 14 App Router conventions:
- `api/` - API route handlers (REST endpoints)
- `dashboard/` - Main dashboard page
- `manage/` - Management pages (accounts, products, employees, payroll, fixed-assets)
- `transactions/` - Transaction entry pages (accounts, sales, payroll, fixed-assets)
- `reports/` - Report pages (accounts, sales, payroll, fixed-assets)
- `setup/`, `login/`, `signup/`, `change-password/`, `profile/` - Auth/user pages
- `invoice/` - Invoice generation page
- `debug/` - Development data viewer
- `seed-data/` - Data seeding utilities

### `/components` - React Components
Organized by feature domain:
- `accounts/` - Account management UI (AccountForm, AccountList, AccountSelector)
- `transactions/` - Transaction forms and lists (TransactionForm, SplitTransactionForm, PettyCashSplitForm)
- `reports/` - Report components (TrialBalance, IncomeStatement, BalanceSheet, CashFlow, etc.)
- `sales/` - Sales management (SalesForm, SalesList)
- `products/` - Product management (ProductForm, ProductList, ProductSelector)
- `clients/` - Client management
- `employees/` - Employee management
- `payroll/` - Payroll processing UI
- `fixed-assets/` - Fixed asset management
- `services/` - Service management
- `taxation/` - Tax configuration UI
- `invoice/` - Invoice templates
- `auth/` - Authentication components (LoginForm, SignupForm, ProtectedRoute, SessionTimeoutWarning)
- `ui/` - Shadcn/ui base components (button, input, dialog, etc.)
- `AppSidebar.tsx`, `DashboardLayout.tsx`, `SectionBreadcrumb.tsx` - Layout components

### `/lib` - Core Business Logic
Layered architecture:
- `services/` - Business logic layer (AccountService, TransactionService, SalesService, PayrollService, etc.)
  - `__tests__/` - Service unit tests
- `repositories/` - Data access layer (AccountRepository, TransactionRepository, etc.)
  - Abstracts Prisma/LocalStorage implementations
- `api/` - API client utilities for frontend
- `contexts/` - React contexts (AuthContext)
- `storage/` - LocalStorage service for demo mode
- `validation/` - Business validation rules (accountValidation, etc.)
- `utils/` - Utility functions (seedData, sessionTimeout, etc.)
- `prisma/` - Prisma client singleton
- `auth/` - Authentication utilities
- `config/` - Configuration files

### `/types` - TypeScript Type Definitions
Domain-specific type definitions:
- `accounts.ts` - Account hierarchy types
- `transactions.ts` - Transaction types
- `products.ts` - Product/inventory types
- `clients.ts` - Client types
- `services.ts` - Service types
- `payroll.ts` - Payroll/employee types
- `fixedAssets.ts` - Fixed asset types
- `taxation.ts` - Tax configuration types
- `reports.ts` - Report types
- `users.ts` - User/auth types
- `index.ts` - Shared/common types

### `/hooks` - Custom React Hooks
- `useAuth.ts` - Authentication state and operations
- `useAccounts.ts` - Account data fetching with TanStack Query
- `useTransactions.ts` - Transaction operations
- `usePettyCash.ts` - Petty cash operations
- `useAccountNameValidation.ts` - Real-time account name validation
- `useDebounce.ts` - Debounce utility
- `usePermissions.ts` - Permission checking
- `use-toast.ts`, `use-mobile.tsx` - UI utilities

### `/prisma` - Database Schema & Migrations
- `schema.prisma` - Prisma schema definition (single source of truth for DB structure)
- `migrations/` - Database migration history
- `seed-accounts.ts` - Account hierarchy seeding script

### `/scripts` - Utility Scripts
Testing and setup scripts:
- `seed-database.js` - Full database seeding
- `test-*.js/ts` - Various API and functionality tests
- `validate-account-structure.ts` - Account hierarchy validation
- `createAccessCode.ts` - Access code generation

### `/public` - Static Assets
- `clear-storage.html` - Utility page to clear browser storage
- `favicon.ico`, `robots.txt` - Standard web files

### `/docs` - Documentation
- `API.md` - API documentation

### `/deployable-version-plan` - Migration Documentation
Migration guides and planning documents for transitioning from localStorage to Supabase

## Architecture Patterns

### Layered Architecture
```
Presentation (Components/Pages)
    ↓
Business Logic (Services)
    ↓
Data Access (Repositories)
    ↓
Storage (Prisma/LocalStorage)
```

### Key Conventions
- **Services** contain business logic, validation, and orchestration
- **Repositories** handle data persistence (abstract Prisma vs LocalStorage)
- **Components** are feature-organized, not by type
- **API routes** follow REST conventions: `/api/[resource]/route.ts` or `/api/[resource]/[id]/route.ts`
- **Tests** are co-located with services in `__tests__/` directories
- **Types** are centralized in `/types` directory, not scattered
- **Hooks** use TanStack Query for server state, Context for client state

### File Naming
- Components: PascalCase (e.g., `AccountForm.tsx`)
- Services/Repositories: PascalCase (e.g., `AccountService.ts`)
- Utilities: camelCase (e.g., `sessionTimeout.ts`)
- Types: camelCase (e.g., `accounts.ts`)
- API routes: lowercase (e.g., `route.ts`)

### Import Aliases
- `@/` - Root directory alias (configured in tsconfig.json)
- Example: `import { AccountService } from '@/lib/services/AccountService'`
