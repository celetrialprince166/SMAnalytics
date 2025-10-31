# Migration Gaps and Implementation Details

This document addresses the gaps identified in the original migration plan and provides a more detailed implementation strategy. This is a plan of action, not an implementation.

## Phase 1: Foundation Setup

**Gap:** The plan lacks a detailed Prisma schema and a clear setup process.

**Proposed Actions:**

1.  **Define Prisma Schema:** Based on `types/index.ts`, the `prisma/schema.prisma` file will be created with the following models: `User`, `Company`, `PrimaryAccount`, `SecondaryAccount`, `HolderAccount`, `Transaction`, `SplitTransaction`, `Client`, `Employee`, `Product`, `Service`, `FixedAsset`, `Payroll`, and `Tax`.
2.  **Environment Setup:** An `.env` file will be created with a placeholder for the `DATABASE_URL`. This will allow for local development and testing of the Prisma setup.
3.  **Generate Migrations:** The `prisma migrate dev --create-only` command will be used to generate the initial SQL migration files. These files will be committed to the repository for later use in the deployment phase.

## Phase 2: API Layer Development

**Gap:** The plan does not specify the API endpoints to be created.

**Proposed Actions:**

1.  **API Route Specification:** A new file, `04-API-ROUTES.md`, will be created in the `deployable-version-plan` directory. This file will define the API endpoints for each service, including the HTTP method, URL, request body, and response format. The following is a summary of the proposed routes:

    *   **Authentication:** `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/logout`, `GET /api/auth/session`
    *   **Accounts:** `GET /api/accounts/hierarchy`, `GET /api/accounts/primary`, `GET /api/accounts/secondary`, `GET /api/accounts/holder`, `POST /api/accounts/holder`, `PUT /api/accounts/holder/{id}`, `DELETE /api/accounts/holder/{id}`
    *   **Transactions:** `GET /api/transactions`, `POST /api/transactions`, `GET /api/transactions/{id}`, `PUT /api/transactions/{id}`, `DELETE /api/transactions/{id}`
    *   **Reports:** `GET /api/reports/balance-sheet`, `GET /api/reports/income-statement`, `GET /api/reports/trial-balance`

## Phase 3: Repository Migration

**Gap:** The plan lacks a detailed strategy for migrating the repositories.

**Proposed Actions:**

1.  **Prisma Client:** A new file, `lib/prisma.ts`, will be created to instantiate and export a singleton `PrismaClient` instance. This will ensure that only one instance of `PrismaClient` is used throughout the application.
2.  **Prisma Base Repository:** A new `PrismaBaseRepository` will be created. This repository will implement the same `Repository` interface as the existing `BaseRepository`, but will use the `PrismaClient` for data access.
3.  **Repository Refactoring:** Each existing repository in `lib/repositories` will be refactored to extend the new `PrismaBaseRepository` and use Prisma for data access.

## Phase 6: Deployment

**Gap:** The plan does not provide a detailed data migration strategy.

**Proposed Actions:**

1.  **Data Migration Script:** A new script, `scripts/migrate-localstorage-to-db.ts`, will be created. This script will:
    1.  Read all data from `LocalStorage` using the existing `LocalStorageService`.
    2.  Transform the data to match the new Prisma schema.
    3.  Use the new Prisma repositories to insert the data into the Supabase database.
2.  **Deployment Guide:** A new file, `07-DEPLOYMENT.md`, will be created in the `deployable-version-plan` directory. This file will provide a step-by-step guide for deploying the application to Vercel, including how to set up the database and run the data migration script.