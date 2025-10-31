# SNM Accounts Management System

A comprehensive, client-side accounting management system built with Next.js, TypeScript, and local storage.

## 🚀 Quick Start

### 1. Clear Any Existing Data (Important!)

If you've run this before, clear your browser storage first:

**Visit:** `http://localhost:3000/clear-storage.html`

Or open browser console (F12) and run:
```javascript
localStorage.clear();
location.href = '/';
```

### 2. Start the Application

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Initial Setup

The app will automatically redirect you to `/setup`.

1. Click **"Create Access Codes"**
2. Save the generated codes (you'll need them for signup)
3. Click **"Go to Sign Up"**

### 4. Create Your Account

1. Enter User ID: `U001`
2. Enter the Access Code from setup
3. Click **"Search"**
4. Fill in your username and password
5. Click **"Submit"**

### 5. Login

Use your username and password to login.

**🎉 You're ready to use the system!**

---

## 📚 Documentation

- **[START_HERE.md](START_HERE.md)** - Complete getting started guide
- **[FIX_CORRUPTED_DATA.md](FIX_CORRUPTED_DATA.md)** - Fix data corruption issues
- **[README_LOGIN.md](README_LOGIN.md)** - Detailed login instructions
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md)** - Technical details

---

## ✨ Features

### ✅ Implemented

- **User Management**
  - Registration with access codes
  - Login/logout with session management
  - Password change
  - Role-based access control (4 levels)
  - Session timeout (30 minutes)

- **Account Management**
  - 3-tier account hierarchy (Primary → Secondary → Holder)
  - Create, edit, delete accounts
  - Account search and filtering
  - Balance tracking
  - Validation and business rules

- **Transaction System**
  - Double-entry bookkeeping
  - Create, edit, delete transactions
  - Automatic balance updates
  - Transaction list with pagination
  - Advanced filtering and search
  - Reconciliation tracking
  - Complete audit trail logging

- **Split Transaction System**
  - Split one account across multiple accounts
  - Dynamic split entry management
  - Real-time validation and totals
  - Split transaction list with expandable details
  - Edit and delete split transactions
  - Reconciliation for all splits
  - Audit trail for split operations

- **Data Persistence**
  - Browser local storage
  - Automatic data initialization
  - Data export/import (coming soon)

### 🚧 Coming Soon

- Split transaction system
- Sales and invoicing
- Financial reports (Income Statement, Balance Sheet, Cash Flow)
- Dashboard analytics
- Inventory management
- Data backup and restore

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Next.js Pages, Components, UI)        │
├─────────────────────────────────────────┤
│           Business Logic Layer          │
│  (Services, Validators, Calculators)    │
├─────────────────────────────────────────┤
│           Data Access Layer             │
│  (Repositories, Local Storage)          │
├─────────────────────────────────────────┤
│           Data Storage Layer            │
│  (Browser Local Storage)                │
└─────────────────────────────────────────┘
```

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** React + Shadcn/ui + Tailwind CSS
- **State:** React Context API
- **Storage:** Browser LocalStorage
- **Validation:** Custom validation layer

---

## 📁 Project Structure

```
├── app/                    # Next.js app router pages
│   ├── setup/             # Initial setup page
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── dashboard/         # Main dashboard
│   ├── manage/            # Management pages
│   │   └── accounts/      # Account management
│   └── debug/             # Debug data viewer
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── accounts/         # Account management components
│   └── ui/               # Shadcn UI components
├── lib/                  # Core business logic
│   ├── services/         # Business services
│   ├── repositories/     # Data access layer
│   ├── storage/          # Local storage service
│   ├── validation/       # Validation logic
│   ├── contexts/         # React contexts
│   └── utils/            # Utility functions
├── types/                # TypeScript type definitions
├── hooks/                # Custom React hooks
└── public/               # Static files
```

---

## 🔐 User Levels & Permissions

| Level | Permissions |
|-------|------------|
| **SUPER_USER** | Full system access including user management |
| **ADMIN** | Manage accounts, products, transactions, reports, settings |
| **USER_2** | Create/edit transactions, view reports, export data |
| **USER_1** | Create transactions, view reports (limited) |

---

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Run Production Build

```bash
npm start
```

---

## 🔍 Debug Tools

### View Stored Data

Visit: `http://localhost:3000/debug`

Shows all data including:
- Users
- Access codes
- Accounts
- Transactions
- Metadata

### Clear All Data

Visit: `http://localhost:3000/clear-storage.html`

Or use browser console:
```javascript
localStorage.clear();
```

---

## 🆘 Troubleshooting

### "Invalid User ID or Access Code"

1. Clear storage: Visit `/clear-storage.html`
2. Go to `/setup` and create new codes
3. Verify codes at `/debug`

### JSON Parse Errors

1. Clear storage (corrupted data)
2. Restart from setup

### Can't Access Pages

- Check user level at `/debug`
- Ensure you have proper permissions

### Session Expired

- Sessions expire after 30 minutes
- Just login again

---

## 📊 Current Status

**Build Status:** ✅ Passing

**Completed Tasks:** 16/44 (36%)

**Phase 1:** ✅ Core data models and storage  
**Phase 2:** ✅ Authentication system  
**Phase 3:** ✅ Account management  
**Phase 4:** ✅ Transaction system  
**Phase 5:** ✅ Split transaction system (complete!)  
**Phase 6:** 🚧 Product & Sales (next)

---

## 🤝 Contributing

This is a learning/demonstration project. Feel free to:
- Report issues
- Suggest features
- Submit pull requests

---

## 📝 License

MIT License - feel free to use this project for learning or as a starting point for your own accounting system.

---

## 🎯 Next Steps

After logging in:

1. **Create Accounts** - Go to `/manage/accounts`
2. **View Debug Data** - Go to `/debug`
3. **Explore Dashboard** - Go to `/dashboard`

---

**Need Help?** Check the documentation files or visit `/debug` to inspect your data.

**Ready to Start?** Follow the Quick Start guide above! 🚀
