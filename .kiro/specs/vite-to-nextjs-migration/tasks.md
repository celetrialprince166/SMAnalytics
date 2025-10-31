# Implementation Plan: Vite to Next.js Migration

- [ ] 1. Set up Next.js project foundation
  - Install Next.js and remove Vite dependencies from package.json
  - Create next.config.js with basic configuration
  - Update TypeScript configuration for Next.js compatibility
  - Update ESLint configuration to use Next.js rules
  - _Requirements: 1.1, 1.2, 1.5, 6.1, 6.4, 9.1, 9.2_

- [ ] 2. Create app directory structure and root layout
  - Create app directory with layout.tsx containing QueryClientProvider, TooltipProvider, Toaster, and Sonner
  - Move src/index.css to app/globals.css and import in layout.tsx
  - Update Tailwind config to include app directory in content paths
  - Create app/page.tsx with redirect to /login
  - _Requirements: 1.3, 1.4, 5.1, 5.3, 5.4_

- [ ] 3. Migrate authentication pages
  - Create app/login/page.tsx from src/pages/Login.tsx with 'use client' directive
  - Create app/signup/page.tsx from src/pages/SignUp.tsx with 'use client' directive
  - Create app/change-password/page.tsx from src/pages/ChangePassword.tsx with 'use client' directive
  - Replace React Router hooks with Next.js navigation (useNavigate → useRouter)
  - _Requirements: 2.1, 2.2, 2.5, 3.5, 8.1, 8.2_

- [ ] 4. Migrate core application pages
  - Create app/dashboard/page.tsx from src/pages/Dashboard.tsx with 'use client' directive
  - Create app/profile/page.tsx from src/pages/Profile.tsx with 'use client' directive
  - Create app/invoice/page.tsx from src/pages/Invoice.tsx with 'use client' directive
  - Update navigation hooks from React Router to Next.js in all pages
  - _Requirements: 2.1, 2.2, 3.5, 4.2, 4.3_

- [ ] 5. Migrate manage section pages
  - Create app/manage/page.tsx from src/pages/Manage.tsx with 'use client' directive
  - Create app/manage/accounts/page.tsx from src/pages/ManageAccounts.tsx with 'use client' directive
  - Create app/manage/fixed-assets/page.tsx from src/pages/ManageFixedAssets.tsx with 'use client' directive
  - Create app/manage/payroll/page.tsx from src/pages/ManagePayroll.tsx with 'use client' directive
  - Verify nested routing works correctly for /manage/* routes
  - _Requirements: 2.1, 2.2, 2.5, 3.5_

- [ ] 6. Migrate transactions section pages
  - Create app/transactions/page.tsx from src/pages/Transactions.tsx with 'use client' directive
  - Create app/transactions/accounts/page.tsx from src/pages/TransactionsAccounts.tsx with 'use client' directive
  - Create app/transactions/fixed-assets/page.tsx from src/pages/TransactionsFixedAssets.tsx with 'use client' directive
  - Create app/transactions/payroll/page.tsx from src/pages/TransactionsPayroll.tsx with 'use client' directive
  - Verify nested routing works correctly for /transactions/* routes
  - _Requirements: 2.1, 2.2, 2.5, 3.5_

- [ ] 7. Migrate reports section pages
  - Create app/reports/page.tsx from src/pages/Reports.tsx with 'use client' directive
  - Create app/reports/accounts/page.tsx from src/pages/ReportsAccounts.tsx with 'use client' directive
  - Create app/reports/fixed-assets/page.tsx from src/pages/ReportsFixedAssets.tsx with 'use client' directive
  - Create app/reports/payroll/page.tsx from src/pages/ReportsPayroll.tsx with 'use client' directive
  - Verify nested routing works correctly for /reports/* routes
  - _Requirements: 2.1, 2.2, 2.5, 3.5_

- [ ] 8. Create 404 not found page
  - Create app/not-found.tsx using the existing NotFound component from src/pages/NotFound.tsx
  - Verify 404 page displays for invalid routes
  - _Requirements: 2.4_

- [ ] 9. Update layout and navigation components
  - Move components directory to project root (outside app)
  - Update components/DashboardLayout.tsx to use Next.js navigation (useNavigate → useRouter from next/navigation)
  - Add 'use client' directive to DashboardLayout.tsx
  - Update components/AppSidebar.tsx to use Next.js Link component instead of React Router Link
  - Add 'use client' directive to AppSidebar.tsx
  - Update components/SectionBreadcrumb.tsx if it uses React Router hooks
  - _Requirements: 2.1, 2.6, 3.1, 3.2, 3.5_

- [ ] 10. Verify and update UI components
  - Ensure all components in components/ui/ have 'use client' directive where needed
  - Test interactive components (dialogs, dropdowns, forms) work correctly
  - Verify Toaster and Sonner notifications display properly
  - Verify Tooltip functionality works
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 11. Update package.json scripts and clean up
  - Update scripts in package.json: "dev": "next dev", "build": "next build", "start": "next start"
  - Remove react-router-dom from dependencies
  - Remove Vite and related packages from devDependencies
  - Delete index.html, vite.config.ts, and src directory
  - Delete old configuration files no longer needed
  - _Requirements: 1.5, 2.6, 6.1, 6.2, 9.1, 9.3, 9.4, 9.5_

- [ ] 12. Final testing and verification
  - Run development server and verify all pages load correctly
  - Test navigation between all pages works
  - Verify root path redirects to /login
  - Test all forms and interactive elements function correctly
  - Verify TanStack Query data fetching works
  - Test dark/light mode switching with next-themes
  - Run production build and verify it completes successfully
  - Test production build locally
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 5.2, 6.1, 6.2, 6.3, 10.1, 10.2, 10.3, 10.4_
