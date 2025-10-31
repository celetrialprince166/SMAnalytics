# Performance Optimization and Scalability Plan

## 1. Executive Summary

A detailed analysis of the application's backend and frontend has identified several critical performance bottlenecks that contribute to slow data loading. The primary issues stem from inefficient database queries, widespread client-side handling of large datasets, large bundle sizes, and suboptimal component loading strategies.

This document outlines a comprehensive strategy to address these issues:
1.  **Backend Query Optimization:** Refactor inefficient queries to reduce database load and the number of round-trips.
2.  **Database Indexing:** Enhance the database schema with appropriate indexes to accelerate data retrieval.
3.  **Frontend Architecture:** Shift from client-side to server-side data processing for filtering and pagination.
4.  **Bundle Size and Component Loading:** Reduce the initial JavaScript payload by lazy-loading large components and dependencies.
5.  **API and Caching Strategy:** Implement robust pagination and caching to reduce payload sizes and avoid re-computing expensive results.

Executing this plan will significantly improve API response times, enhance user experience, and ensure the application can scale as the data volume grows.

---

## 2. High-Impact Issue Analysis and Remediation

### Issue 2.1: N+1 Query Problem in Sales API (`GET /api/sales`)

-   **Problem:** The current implementation fetches a list of `salesEntries` and then, within a `Promise.all` loop, executes a separate database query for *each* sales entry to retrieve its associated `customerAccount`. This is highly inefficient.

-   **Solution:** Refactor the logic to fetch all necessary customer accounts in a single, separate query and map the data in memory. This reduces N+1 queries to just 2.

### Issue 2.2: Inefficient Balance Sheet Report Generation (`GET /api/reports/balance-sheet`)

-   **Problem:** The endpoint executes three separate, complex `prisma.$queryRaw` statements. This is redundant and puts unnecessary strain on the database.

-   **Solution:** Consolidate the three queries into a single, unified raw query that groups results by the `PrimaryAccount` type.

---

## 3. Frontend Performance Overhaul

### Issue 3.1: Widespread Client-Side Data Processing

-   **Problem:** A critical and repeated anti-pattern was found in `SalesList.tsx`, `TransactionList.tsx`, and `ProductList.tsx`. These components fetch an entire dataset from their respective APIs and then perform all pagination, filtering, and searching on the client side. This is not scalable and is a primary cause of UI slowdowns.

-   **Solution:** Shift all data processing to the backend. The frontend should only be responsible for displaying the data it receives. The APIs must be enhanced to handle pagination, filtering, and sorting parameters.

-   **Implementation Steps:**

    1.  **Modify List APIs (`GET /api/sales`, `/api/transactions`, `/api/products`, etc.):**
        *   Accept query parameters for `page`, `limit`, `searchTerm`, `startDate`, `endDate`, etc.
        *   Pass these parameters to the Prisma query (`findMany`) using `take`, `skip` (or a cursor), and a dynamic `where` clause.
        *   The API should return both the paginated data and the total record count for the UI.

    2.  **Refactor Frontend List Components:**
        *   Use state variables to manage the current page, filters, and search term.
        *   Create a `useEffect` hook that triggers a new API call whenever these state variables change.
        *   Remove all client-side filtering and pagination logic. The component should simply render the data returned by the API for the current page.

### Issue 3.2: Lack of UI Feedback and Optimistic Updates

-   **Problem:** Actions like deleting a sale can feel slow as the user must wait for the API call to complete before the UI updates.

-   **Solution:** Implement optimistic updates for actions like deletion. When a user deletes an item, immediately remove it from the UI state. If the subsequent API call fails, revert the change and show an error message.

---

## 4. Bundle Size and Component Loading (New Findings)

### Issue 4.1: Large Dependencies and Client-Side PDF Generation

-   **Problem:** The `package.json` reveals large dependencies like `jspdf` and `html2canvas`. If PDF generation is performed on the client, it is a computationally expensive task that can block the browser's main thread, causing the UI to freeze, especially for large reports.

-   **Solution:** Offload PDF generation to the server.
    1.  Create a new API endpoint (e.g., `/api/reports/download`).
    2.  This endpoint should take the report data or parameters, generate the PDF on the server (using a library like `puppeteer` or a server-side PDF library), and return the generated file to the user for download.
    3.  This prevents blocking the client UI and moves heavy processing to the backend.

### Issue 4.2: Eager Loading of Heavy Components

-   **Problem:** The application uses a tab-based interface (e.g., in `ReportsAccountsPage`) where many complex components (`FinancialAccountsTab`, `SalesReportsTab`, etc.) are likely included in the initial page load, even if they are not visible. Libraries like `recharts` also add to the bundle size.

-   **Solution:** Implement component-level code splitting using dynamic imports.

-   **Implementation (`next/dynamic`):**
    *   Wrap heavy components or components in inactive tabs with `next/dynamic`. This will ensure the component's JavaScript is only downloaded and rendered when it's actually needed (e.g., when a user clicks on its tab).

    ```typescript
    import dynamic from 'next/dynamic'

    // Lazy-load the report component. Show a loading skeleton while it loads.
    const SalesReportsTab = dynamic(() => import('@/components/reports/SalesReportsTab'), {
      loading: () => <p>Loading...</p>,
    })

    // In the main page component
    <TabsContent value="sales">
      <SalesReportsTab />
    </TabsContent>
    ```

---

## 5. Database Indexing Strategy

To support the query optimizations, the following indexes should be added to `prisma/schema.prisma`.

-   **Proposed `schema.prisma` Additions:**

    ```prisma
    model Transaction {
      @@index([organizationId, reconciled, date])
    }
    model SalesEntry {
      @@index([organizationId, customerAccountId])
    }
    model HolderAccount {
      @@index([organizationId, name])
    }
    ```

---

## 6. API Pagination and Caching

### 6.1. Implement Cursor-Based Pagination

-   **Solution:** For high-volume tables like `transactions`, implement **cursor-based pagination**. This is more performant than `skip`/`offset` for deep pagination.

### 6.2. Introduce a Caching Layer for Reports

-   **Solution:** Introduce a server-side caching layer for expensive, non-real-time reports. Cache the result for a short period (e.g., 5-15 minutes) using an in-memory cache or Redis.

---

## 7. Final Action Checklist

1.  [ ] **Refactor List APIs:** Enhance `GET` endpoints for sales, transactions, products, etc., to accept pagination and filter parameters.
2.  [ ] **Refactor List Components:** Remove client-side data processing from `SalesList`, `TransactionList`, etc., and fetch data from the enhanced APIs.
3.  [ ] **Refactor Report Generation:** Move PDF generation to a dedicated server-side API endpoint.
4.  [ ] **Implement Lazy Loading:** Use `next/dynamic` to lazy-load heavy components, especially those within tabs.
5.  [ ] **Refactor DB Queries:** Fix the N+1 problem in the sales API and consolidate the balance sheet queries.
6.  [ ] **Update `prisma/schema.prisma`:** Add the recommended `@@index` attributes.
7.  [ ] **Apply Database Migrations:** Run `npx prisma migrate dev`.
8.  [ ] **(Recommended)** Implement optimistic UI updates for delete operations.
