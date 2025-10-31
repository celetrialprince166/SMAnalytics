# AI Agent Instructions: Optimizing the `/manage` Section

This document provides a series of precise, sequential instructions for an AI software engineer to optimize the performance of the pages and components strictly within the `/manage` section of the application.

**Primary Goal:** Transition all data lists within the `/manage` pages from client-side processing to server-side processing to ensure the app remains fast and scalable.

---

### **Task 1: Optimize the Products Management Page (`/manage/products`)**

**Context:** The product list currently loads all products at once and performs filtering on the client. This needs to be moved to the server.

#### **Instruction 1.1: Enhance the Products API (`/api/products`)**

1.  **Read the file:** `app/api/products/route.ts`.
2.  **Modify the `GET` function** to accept `page` (string, defaults to '1'), `limit` (string, defaults to '10'), and `search` (string, optional) as URL query parameters.
3.  **Implement Server-Side Logic:**
    *   Build a dynamic `where` clause for the Prisma query. It should always filter by `organizationId`. If a `search` term is provided, add a filter to match the term against the `name` and `code` fields (case-insensitive).
    *   Execute two queries in parallel using `prisma.$transaction`:
        1.  A query to get the `total` count of records matching the `where` clause.
        2.  A `findMany` query to fetch the `data` for the current page, using the `where` clause and applying `take: limit` and `skip: (page - 1) * limit`.
4.  **Update the Response:** Modify the `successResponse` to return a JSON object with `data` (the array of products) and `meta` (an object containing `total`, `page`, and `limit`).

**Example Final API Response:**
```json
{
  "success": true,
  "data": {
    "data": [ { "id": "...", "name": "Product A", "code": "P001" } ],
    "meta": { "total": 150, "page": 1, "limit": 10 }
  }
}
```

---

#### **Instruction 1.2: Refactor the Product List Component**

1.  **Read the file:** `components/products/ProductList.tsx`.
2.  **Manage State:** Introduce state variables for `currentPage`, `pageSize`, `searchTerm`, `products` (for page data), and `totalProducts`.
3.  **Fetch Data:** Create a `useEffect` hook that calls a service function to fetch products whenever `currentPage`, `pageSize`, or `searchTerm` changes. This service function must pass the state variables as query parameters to the `/api/products` endpoint.
4.  **Remove Client-Side Logic:** Delete all client-side filtering and pagination logic (e.g., `applyFilters` function, `.slice()`). The component should render the `products` state directly.
5.  **Update UI Controls:** Connect the search input and pagination controls to the new state variables to trigger the `useEffect` hook.

---

### **Task 2: Optimize Other Management Lists**

The same performance anti-pattern exists across other management pages. You are to apply the exact same optimization strategy to the following areas:

*   **Accounts List (`/manage/accounts`):**
    *   **APIs to Modify:** `app/api/accounts/primary/route.ts`, `app/api/accounts/secondary/route.ts`, `app/api/accounts/holder/route.ts`.
    *   **Component to Refactor:** `components/accounts/AccountList.tsx` (and any related sub-components for each account type).
*   **Employees List (`/manage/employees`):**
    *   **API to Modify:** `app/api/employees/route.ts`.
    *   **Component to Refactor:** `components/employees/EmployeeManagement.tsx`.
*   **Fixed Assets List (`/manage/fixed-assets`):**
    *   **API to Modify:** `app/api/fixed-assets/route.ts`.
    *   **Component to Refactor:** `components/fixed-assets/FixedAssetsManagement.tsx`.

For each of the above, follow the two-step process:
1.  **Enhance the API:** Add full support for server-side pagination, filtering, and searching. Return data and metadata.
2.  **Refactor the Component:** Remove client-side logic and drive the component state from the enhanced API.

---

### **Task 3: Implement Component Lazy Loading on Management Pages**

**Context:** The main management pages may contain multiple tabs or sections, each with a heavy component. Loading all of this code upfront is inefficient.

#### **Instruction 3.1: Lazy Load Tab Content**

1.  **Identify Target Page:** Start with `app/manage/accounts/page.tsx`. This page has tabs for Primary, Secondary, and Holder accounts.
2.  **Analyze Component Usage:** Inside the `TabsContent` for each tab, you will find a component being rendered directly (e.g., `<AccountList type="primary" />`).
3.  **Implement Dynamic Import:**
    *   Use `next/dynamic` to lazy-load the list component for each tab.
    *   Provide a simple loading skeleton component to the `loading` property of the `dynamic()` call to prevent layout shift and provide user feedback.

**Example:**
```typescript
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const DynamicAccountList = dynamic(
  () => import('@/components/accounts/AccountList').then(mod => mod.AccountList),
  { loading: () => <Skeleton className="h-[400px] w-full" /> }
);

// Later, in the JSX for the Primary Accounts tab:
<TabsContent value="primary">
  <DynamicAccountList type="primary" />
</TabsContent>
```

4.  **Apply Broadly:** Apply this lazy-loading pattern to all major components that are rendered inside tabs across the entire `/manage` section.