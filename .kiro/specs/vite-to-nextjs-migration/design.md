# Design Document: Vite to Next.js Migration

## Overview

This design document outlines the technical approach for migrating a Vite + React application to Next.js 14+ with App Router. The application is a comprehensive accounting/financial management system with 20 pages, shadcn/ui components, React Router navigation, TanStack Query for data fetching, and Tailwind CSS for styling.

The migration strategy prioritizes:
- **Zero functionality loss**: All features must work identically after migration
- **Minimal code changes**: Leverage Next.js compatibility with React patterns
- **Incremental approach**: Migrate in logical phases to reduce risk
- **Performance gains**: Utilize Next.js optimizations where beneficial

## Architecture

### High-Level Architecture Changes

**Before (Vite + React):**
```
index.html
└── src/main.tsx
    └── App.tsx (BrowserRouter)
        └── Routes
            └── Page Components
```

**After (Next.js App Router):**
```
app/
├── layout.tsx (Root Layout with Providers)
├── page.tsx (Root redirect)
├── login/page.tsx
├── dashboard/page.tsx
├── manage/
│   ├── page.tsx
│   ├── accounts/page.tsx
│   ├── fixed-assets/page.tsx
│   └── payroll/page.tsx
└── [other routes]/page.tsx
```

### Directory Structure

```
project-root/
├── app/                          # Next.js App Router directory
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Root page (redirect to /login)
│   ├── globals.css              # Global styles (from src/index.css)
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── change-password/page.tsx
│   ├── dashboard/page.tsx
│   ├── manage/
│   │   ├── page.tsx
│   │   ├── accounts/page.tsx
│   │   ├── fixed-assets/page.tsx
│   │   └── payroll/page.tsx
│   ├── transactions/
│   │   ├── page.tsx
│   │   ├── accounts/page.tsx
│   │   ├── fixed-assets/page.tsx
│   │   └── payroll/page.tsx
│   ├── reports/
│   │   ├── page.tsx
│   │   ├── accounts/page.tsx
│   │   ├── fixed-assets/page.tsx
│   │   └── payroll/page.tsx
│   ├── profile/page.tsx
│   ├── invoice/page.tsx
│   └── not-found.tsx            # 404 page
├── components/                   # Shared components (preserved from src/components)
│   ├── ui/                      # shadcn/ui components
│   ├── AppSidebar.tsx
│   ├── DashboardLayout.tsx
│   └── SectionBreadcrumb.tsx
├── lib/                         # Utility functions (preserved from src/lib)
├── hooks/                       # Custom hooks (preserved from src/hooks)
├── public/                      # Static assets (preserved)
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind configuration (preserved)
└── package.json                # Updated dependencies
```

## Components and Interfaces

### 1. Root Layout (`app/layout.tsx`)

**Purpose**: Provide global providers and HTML structure for all pages.

**Key Responsibilities**:
- Wrap application with `QueryClientProvider` for TanStack Query
- Wrap application with `TooltipProvider` for shadcn/ui tooltips
- Include `Toaster` and `Sonner` components for notifications
- Apply global CSS
- Set up HTML metadata

**Implementation Pattern**:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { Sonner } from '@/components/ui/sonner'
import './globals.css'

// Create QueryClient outside component to avoid recreation
const queryClient = new QueryClient()

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

**Design Decision**: Use a single root layout to maintain the same provider structure as the original App.tsx.

### 2. Page Components

**Migration Strategy**: Convert each page from `src/pages/*.tsx` to `app/*/page.tsx`

**Client Component Pattern**:
Most pages will need the `'use client'` directive because they:
- Use React hooks (useState, useEffect, etc.)
- Handle user interactions
- Use TanStack Query hooks
- Use React Router hooks (which need to be replaced)

**Example Migration**:
```typescript
// Before: src/pages/Dashboard.tsx
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  // ...
}

// After: app/dashboard/page.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  // Replace navigate() with router.push()
  // ...
}
```

### 3. Layout Components

**DashboardLayout Component**:
- Remains largely unchanged
- Update navigation imports from `react-router-dom` to `next/navigation`
- Replace `useNavigate` with `useRouter`
- Add `'use client'` directive

**Pattern for Shared Layouts**:
```typescript
// components/DashboardLayout.tsx
'use client'

import { useRouter } from 'next/navigation'
// ... other imports

export function DashboardLayout({ children }) {
  const router = useRouter()
  
  const handleLogout = () => {
    router.push('/login')
  }
  
  // ... rest of component
}
```

### 4. UI Components (shadcn/ui)

**Migration Approach**: No changes required for most UI components

**Components Requiring `'use client'`**:
- All interactive components (buttons, dialogs, dropdowns, etc.)
- Components using React hooks
- Most shadcn/ui components already follow this pattern

**Verification Strategy**:
- Test each component type in Next.js environment
- Add `'use client'` directive if hydration errors occur
- Ensure Radix UI primitives work correctly

### 5. Navigation Replacement

**React Router → Next.js Navigation Mapping**:

| React Router | Next.js | Usage |
|--------------|---------|-------|
| `useNavigate()` | `useRouter()` from `next/navigation` | Programmatic navigation |
| `navigate('/path')` | `router.push('/path')` | Navigate to route |
| `<Link to="/path">` | `<Link href="/path">` from `next/link` | Declarative navigation |
| `<Navigate to="/path" />` | `redirect('/path')` from `next/navigation` | Server-side redirect |
| `useLocation()` | `usePathname()` from `next/navigation` | Get current path |
| `useParams()` | `useParams()` from `next/navigation` | Get route parameters |

**Implementation Notes**:
- `useRouter` must be used in Client Components
- `redirect()` can be used in Server Components or Server Actions
- Next.js `<Link>` provides automatic prefetching

## Data Models

### QueryClient Configuration

**Current Setup** (Vite):
```typescript
const queryClient = new QueryClient()
```

**Next.js Setup**:
```typescript
// app/layout.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // Optional: configure defaults
    },
  },
})
```

**Design Decision**: Keep QueryClient configuration simple initially, matching the current setup. Optimize later if needed.

### Data Fetching Patterns

**Client-Side Fetching** (Current Pattern):
- Continue using TanStack Query hooks in Client Components
- No changes required to existing query hooks
- Maintain current caching and refetching behavior

**Future Optimization Opportunities**:
- Server Components for initial data loading
- Server Actions for mutations
- Streaming for large datasets

**Design Decision**: Maintain client-side fetching initially to minimize migration complexity. Optimize incrementally after migration is complete.

## Error Handling

### 404 Not Found Page

**Implementation**:
```typescript
// app/not-found.tsx
import { NotFound } from '@/components/NotFound'

export default function NotFoundPage() {
  return <NotFound />
}
```

**Design Decision**: Reuse existing NotFound component, just wrap it in Next.js not-found.tsx convention.

### Error Boundaries

**Next.js Error Handling**:
```typescript
// app/error.tsx (optional)
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

**Design Decision**: Add basic error boundary for production resilience, but keep it simple initially.

## Configuration Files

### 1. Next.js Configuration (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Configure image domains if needed
  images: {
    domains: [],
  },
}

module.exports = nextConfig
```

### 2. TypeScript Configuration

**Update `tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Key Changes**:
- Add Next.js plugin
- Update include/exclude patterns
- Preserve `@/*` path alias

### 3. Tailwind Configuration

**Minimal Changes Required**:
```typescript
// tailwind.config.ts
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",  // Add app directory
    "./src/**/*.{ts,tsx}",   // Keep for any remaining src files
  ],
  // ... rest of config remains the same
}
```

### 4. ESLint Configuration

**Update for Next.js**:
```javascript
// eslint.config.js or .eslintrc.json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  // ... existing rules
}
```

### 5. PostCSS Configuration

**No Changes Required**: Next.js supports the existing PostCSS configuration.

## Package Dependencies

### Dependencies to Remove

```json
{
  "devDependencies": {
    "vite": "^5.4.19",                    // Remove
    "@vitejs/plugin-react-swc": "^3.11.0", // Remove
    "lovable-tagger": "^1.1.10"           // Remove (Vite-specific)
  },
  "dependencies": {
    "react-router-dom": "^6.30.1"         // Remove
  }
}
```

### Dependencies to Add

```json
{
  "dependencies": {
    "next": "^14.2.0"                     // Add Next.js
  },
  "devDependencies": {
    "@next/eslint-plugin-next": "^14.2.0" // Add Next.js ESLint
  }
}
```

### Dependencies to Keep

All other dependencies remain:
- React 18.3.1
- All Radix UI packages
- TanStack Query
- shadcn/ui dependencies
- Tailwind CSS and plugins
- TypeScript
- Form libraries (react-hook-form, zod)
- All other UI libraries

## Testing Strategy

### Phase 1: Setup Verification
1. Install Next.js dependencies
2. Create basic app structure
3. Verify dev server starts
4. Verify build completes

### Phase 2: Component Migration Testing
1. Migrate and test authentication pages (login, signup, change-password)
2. Migrate and test dashboard page
3. Migrate and test one section completely (e.g., manage pages)
4. Verify navigation works between migrated pages
5. Test UI components render correctly

### Phase 3: Full Migration Testing
1. Migrate remaining pages
2. Test all routes and navigation
3. Verify forms and data fetching work
4. Test dark/light mode switching
5. Verify responsive design
6. Test all interactive components

### Phase 4: Production Readiness
1. Run production build
2. Test production bundle
3. Verify all assets load correctly
4. Performance testing
5. Cross-browser testing

### Testing Checklist

**Functional Testing**:
- [ ] All 20 pages render correctly
- [ ] Navigation between pages works
- [ ] Forms submit correctly
- [ ] Data fetching and caching works
- [ ] Authentication flow works
- [ ] Logout functionality works
- [ ] 404 page displays for invalid routes
- [ ] Root path redirects to /login

**UI/UX Testing**:
- [ ] All shadcn/ui components render correctly
- [ ] Dark/light mode switching works
- [ ] Toasts and notifications display
- [ ] Tooltips work
- [ ] Dialogs and modals function
- [ ] Sidebar navigation works
- [ ] Responsive design maintained
- [ ] All icons display correctly

**Technical Testing**:
- [ ] No hydration errors
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Build completes successfully
- [ ] Hot reload works in development
- [ ] Path aliases (@/) work correctly
- [ ] Public assets load correctly

## Migration Phases

### Phase 1: Project Setup (Foundation)
- Install Next.js and remove Vite
- Create app directory structure
- Set up root layout with providers
- Configure TypeScript, Tailwind, ESLint
- Move global CSS
- Verify basic setup works

### Phase 2: Core Pages Migration
- Migrate authentication pages (login, signup, change-password)
- Migrate dashboard page
- Migrate profile page
- Migrate invoice page
- Migrate 404 page
- Test navigation between these pages

### Phase 3: Feature Sections Migration
- Migrate /manage section (4 pages)
- Migrate /transactions section (4 pages)
- Migrate /reports section (4 pages)
- Test nested routing

### Phase 4: Components and Layouts
- Update DashboardLayout component
- Update AppSidebar component
- Update SectionBreadcrumb component
- Verify all UI components work
- Test all interactive features

### Phase 5: Cleanup and Optimization
- Remove old Vite files (index.html, vite.config.ts)
- Remove src directory structure
- Update package.json scripts
- Clean up unused dependencies
- Final testing and verification

## Design Decisions and Rationales

### 1. App Router vs Pages Router
**Decision**: Use App Router
**Rationale**: 
- App Router is the future of Next.js
- Better performance with Server Components
- More intuitive file-based routing
- Better TypeScript support

### 2. Client Components by Default
**Decision**: Mark most components as Client Components initially
**Rationale**:
- Minimizes migration complexity
- Preserves existing React patterns
- Can optimize to Server Components later
- Reduces risk of hydration errors

### 3. Preserve Existing Component Structure
**Decision**: Keep components in `/components` directory
**Rationale**:
- Minimal code changes required
- Familiar structure for developers
- Easy to maintain
- Follows Next.js best practices

### 4. Maintain Client-Side Data Fetching
**Decision**: Continue using TanStack Query for data fetching
**Rationale**:
- Zero changes to existing data fetching logic
- Proven pattern that works
- Can optimize later with Server Components
- Reduces migration risk

### 5. Single Root Layout
**Decision**: Use one root layout for all providers
**Rationale**:
- Matches current App.tsx structure
- Simpler mental model
- Easier to maintain
- Sufficient for current needs

### 6. Incremental Migration Approach
**Decision**: Migrate in phases (auth → dashboard → sections)
**Rationale**:
- Reduces risk
- Allows testing at each phase
- Easier to debug issues
- Can roll back if needed

### 7. Preserve All Dependencies
**Decision**: Keep all non-Vite/Router dependencies
**Rationale**:
- Minimizes breaking changes
- Proven libraries that work
- No need to rewrite working code
- Faster migration

## Performance Considerations

### Build Optimization
- Next.js automatically optimizes bundles
- Code splitting by route
- Automatic image optimization (if images added)
- CSS optimization

### Runtime Optimization
- Automatic prefetching of linked pages
- Optimized hydration
- Efficient client-side navigation
- Better caching strategies

### Future Optimization Opportunities
- Convert static pages to Server Components
- Use Server Actions for mutations
- Implement ISR for semi-static content
- Add image optimization
- Implement route groups for better organization

## Security Considerations

### Headers and Security
- Next.js provides better default security headers
- Can configure CSP, HSTS, etc. in next.config.js
- Automatic XSS protection

### Environment Variables
- Use Next.js environment variable conventions
- `NEXT_PUBLIC_` prefix for client-side variables
- Server-side variables remain private

## Accessibility

### Maintained Standards
- All existing accessibility features preserved
- shadcn/ui components maintain ARIA attributes
- Keyboard navigation continues to work
- Screen reader compatibility maintained

### Next.js Benefits
- Better semantic HTML structure
- Improved focus management
- Better routing announcements

## Browser Compatibility

### Target Browsers
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Same compatibility as current Vite setup
- Next.js handles polyfills automatically

## Deployment Considerations

### Build Output
- Next.js generates optimized static and server files
- Can deploy to Vercel, Netlify, or any Node.js host
- Supports static export if needed

### Environment Setup
- Node.js 18+ required
- Same environment variables as current setup
- May need to update deployment scripts

## Rollback Strategy

### If Migration Fails
1. Keep Vite branch in version control
2. Document all changes made
3. Can revert to Vite setup if critical issues arise
4. Test thoroughly before removing Vite code

### Risk Mitigation
- Migrate in phases
- Test each phase thoroughly
- Keep old code until migration is complete
- Document any issues encountered
