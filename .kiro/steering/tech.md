# Technology Stack

## Core Framework
- **Next.js 14** (App Router) - React framework with server/client components
- **TypeScript** - Strict typing disabled for rapid development
- **React 18** - UI library

## UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Component library built on Radix UI primitives
- **Lucide React** - Icon library
- **Recharts** - Chart/visualization library

## Data & State Management
- **Prisma** - ORM for PostgreSQL database
- **TanStack Query (React Query)** - Server state management, caching, data fetching
- **React Context API** - Client-side state (auth, settings)
- **LocalStorage** - Browser storage for demo/development mode

## Backend & Database
- **Supabase** - PostgreSQL hosting, authentication, real-time subscriptions
- **PostgreSQL** - Primary database
- **Prisma Client** - Type-safe database access

## Forms & Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

## Testing
- **Vitest** - Unit/integration testing framework
- **@testing-library/react** - Component testing utilities
- **Happy DOM** - Lightweight DOM implementation for tests

## Additional Libraries
- **date-fns** - Date manipulation
- **jsPDF** - PDF generation for invoices/reports
- **bcryptjs** - Password hashing

## Common Commands

### Development
```bash
npm run dev              # Start development server (localhost:3000)
npm run build            # Production build
npm start                # Run production build
npm run lint             # Run ESLint
```

### Database
```bash
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations (dev)
npm run db:migrate:deploy # Deploy migrations (production)
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database with initial data
npm run db:reset         # Reset database (WARNING: deletes all data)
```

### Accounts Setup
```bash
npm run accounts:seed    # Seed account hierarchy
npm run accounts:validate # Validate account structure
npm run accounts:test    # Test accounts API
npm run accounts:setup   # Run all account setup steps
```

### Testing
```bash
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:run         # Run tests once (CI mode)
```

## Build System
- **Next.js compiler** - Built-in Rust-based compiler (no webpack config needed)
- **PostCSS** - CSS processing with Tailwind
- **TypeScript compiler** - Type checking (strict mode disabled)

## Environment Variables Required
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `DIRECT_URL` - Direct database connection (for migrations)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
