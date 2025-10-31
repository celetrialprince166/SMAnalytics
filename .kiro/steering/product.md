# SNM Accounts Management System

A comprehensive accounting management system for small-to-medium businesses. The system handles:

- **Core Accounting**: 3-tier account hierarchy (Primary → Secondary → Holder), double-entry bookkeeping, transaction management with audit trails
- **Financial Operations**: Split transactions, petty cash management, reconciliation tracking
- **Sales & Inventory**: Product/service management, sales entries, inventory tracking, invoicing with VAT
- **Payroll**: Employee management, salary processing, tax calculations (Ghana tax system), pension contributions (Tier 1/2/3), commission tracking
- **Fixed Assets**: Asset tracking, depreciation calculations (straight-line, declining balance), disposal management
- **Reporting**: Trial balance, income statement, balance sheet, cash flow, comparative reports, aging analysis
- **Multi-tenancy**: Organization-based data isolation with role-based access control

The system uses PostgreSQL (via Supabase) for production data storage with Prisma ORM, and supports local browser storage for development/demo mode.
