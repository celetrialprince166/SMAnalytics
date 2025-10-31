# Authentication UI Integration Plan

**Date**: October 10, 2025  
**Phase**: 1.5 (Bridge between Phase 1 and Phase 2)  
**Duration**: 2-3 days  
**Priority**: Critical

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Integration Strategy](#integration-strategy)
4. [Implementation Tasks](#implementation-tasks)
5. [Testing Plan](#testing-plan)
6. [Success Criteria](#success-criteria)
7. [Rollback Plan](#rollback-plan)

---

## Overview

This plan details how to integrate the Supabase authentication (implemented in Phase 1) with the existing UI components. The goal is to replace the localStorage-based `AuthService` with Supabase authentication while maintaining the existing UI/UX.

### What We're Doing

- ✅ **Keep**: Existing UI components (LoginForm, SignupForm, etc.)
- ✅ **Keep**: Existing user experience and flows
- 🔄 **Replace**: localStorage-based AuthService with Supabase Auth
- 🔄 **Update**: Authentication hooks and utilities
- ✅ **Add**: Real authentication with database integration

### What We're NOT Changing

- ❌ UI components design and layout
- ❌ User flows and navigation
- ❌ Form validation logic
- ❌ Component structure

---

## Current State Analysis

### Phase 1 Implementation (✅ Complete)

**What's Already Built:**

1. **Supabase Auth Configuration** (`lib/auth/supabase.ts`)
   - Client-side Supabase client
   - Server-side admin client
   - Auth types defined

2. **Session Management** (`lib/auth/session.ts`)
   - `getCurrentSession()` - Get current Supabase session
   - `getCurrentUser()` - Get user with organization info
   - `signIn()` - Sign in with Supabase
   - `signUp()` - Sign up with Supabase
   - `signOut()` - Sign out
   - `resetPassword()` - Password reset

3. **Server-side Auth** (`lib/auth/server.ts`)
   - `createServerSupabaseClient()` - Server component auth
   - `getServerUser()` - Get user in server components
   - `requireAuth()` - Protect server components
   - `requireOrganization()` - Require org context

4. **Middleware** (`middleware.ts`)
   - Route protection
   - Session refresh
   - User context in headers
   - Redirect logic

5. **Prisma Schema** - User model exists with:
   - `id`, `email`, `username`, `passwordHash`
   - `organizationId`, `role`, `isActive`
   - `lastLoginAt`, `createdAt`, `updatedAt`

### Current UI Implementation

**What Exists:**

1. **Login Form** (`components/auth/LoginForm.tsx`)
   - Uses `authService` (localStorage-based)
   - Username/password login
   - User level detection
   - Error handling
   - Navigation to dashboard on success

2. **Signup Form** (`components/auth/SignupForm.tsx`)
   - Uses `authService` and `accessCodeRepository`
   - Access code validation
   - User level from access code
   - Username availability check
   - Password confirmation

3. **Other Auth Components**
   - `ChangePasswordForm.tsx`
   - `LogoutDialog.tsx`
   - `ProtectedRoute.tsx`
   - `SessionTimeoutWarning.tsx`

4. **AuthService** (`lib/services/AuthService.ts`)
   - localStorage-based session management
   - Simple password hashing (demo only)
   - User permissions management
   - Session expiration handling

### The Gap

**What Needs to Be Connected:**

1. **Login Flow**
   - Replace `authService.login()` with Supabase Auth
   - Map username to email (Supabase uses email)
   - Store Supabase session instead of localStorage
   - Get user data from Prisma database

2. **Signup Flow**
   - Replace `authService.signup()` with Supabase Auth
   - Create Supabase auth user
   - Create corresponding Prisma user record
   - Handle access code validation
   - Map user levels to roles

3. **Session Management**
   - Replace localStorage session with Supabase session
   - Use Supabase session tokens
   - Leverage middleware for route protection
   - Handle session refresh automatically

4. **User Data**
   - Sync Supabase auth user with Prisma user
   - Store organization context
   - Manage user roles/permissions
   - Handle user metadata

---

## Integration Strategy

### Approach: Gradual Replacement

We'll follow a gradual replacement strategy to minimize risk:

1. **Step 1**: Create new Supabase-based auth hooks
2. **Step 2**: Create backward-compatible auth service
3. **Step 3**: Update UI components to use new hooks
4. **Step 4**: Test thoroughly
5. **Step 5**: Remove old AuthService (optional)

### Key Design Decisions

1. **Username vs Email**
   - **Problem**: Supabase uses email, app uses username
   - **Solution**: Use email for Supabase, store username in Prisma user table
   - **Implementation**: User enters username, we look up email, then sign in

2. **User Roles vs Levels**
   - **Problem**: App uses "USER_ADMIN", "MANAGER", etc.
   - **Solution**: Map to Prisma UserRole enum (ADMIN, MANAGER, ACCOUNTANT, USER)
   - **Implementation**: Store mapping in database, sync on signup

3. **Access Codes**
   - **Problem**: Access code system not in Supabase
   - **Solution**: Keep access code validation in Prisma, use for signup
   - **Implementation**: Validate access code before creating Supabase user

4. **Session Storage**
   - **Problem**: App uses localStorage
   - **Solution**: Use Supabase session (stored in cookies by middleware)
   - **Implementation**: Let Supabase handle session storage automatically

---

## Implementation Tasks

### Task 1: Create Authentication Hook (1-2 hours)

**File**: `hooks/useAuth.ts`

Create a custom React hook that wraps Supabase auth and provides the same interface as the old AuthService.

**Implementation**:

```typescript
/**
 * Authentication Hook
 * 
 * Wraps Supabase authentication with app-specific logic
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

export interface AppUser {
  id: string;
  email: string;
  username: string;
  organizationId: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  supabaseUser: SupabaseUser | null;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    supabaseUser: null,
  });

  // Load user on mount
  useEffect(() => {
    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await loadUser();
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            loading: false,
            error: null,
            supabaseUser: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Load user data from Supabase and database
   */
  async function loadUser() {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Get Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session) {
        setState({
          user: null,
          loading: false,
          error: null,
          supabaseUser: null,
        });
        return;
      }

      // Get user data from our database
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load user data');
      }

      const userData: AppUser = await response.json();

      setState({
        user: userData,
        loading: false,
        error: null,
        supabaseUser: session.user,
      });
    } catch (error: any) {
      console.error('Error loading user:', error);
      setState({
        user: null,
        loading: false,
        error: error.message,
        supabaseUser: null,
      });
    }
  }

  /**
   * Sign in with username and password
   */
  async function signIn(username: string, password: string) {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Look up user email from username
      const response = await fetch('/api/auth/lookup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error('Invalid username or password');
      }

      const { email } = await response.json();

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Load user data
      await loadUser();

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Sign up with username, email, and password
   */
  async function signUp(data: {
    userId: string;
    accessCode: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Call signup API endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      const result = await response.json();

      setState(prev => ({ ...prev, loading: false }));

      return { success: true, data: result };
    } catch (error: any) {
      const errorMessage = error.message || 'Signup failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Sign out
   */
  async function signOut() {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setState({
        user: null,
        loading: false,
        error: null,
        supabaseUser: null,
      });

      router.push('/login');

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Logout failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Change password
   */
  async function changePassword(currentPassword: string, newPassword: string) {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Verify current password by trying to sign in
      if (!state.user?.email) {
        throw new Error('User not authenticated');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: state.user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setState(prev => ({ ...prev, loading: false }));

      return { success: true, message: 'Password changed successfully' };
    } catch (error: any) {
      const errorMessage = error.message || 'Password change failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Reset password
   */
  async function resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { success: true, message: 'Password reset email sent' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Password reset failed' };
    }
  }

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    changePassword,
    resetPassword,
    isAuthenticated: !!state.user,
  };
}
```

**Success Criteria**:
- [ ] Hook created and exports all necessary functions
- [ ] TypeScript types defined
- [ ] Supabase auth integrated
- [ ] Error handling implemented
- [ ] Loading states managed

---

### Task 2: Create API Routes for Auth (2-3 hours)

Create Next.js API routes to handle authentication operations that require server-side logic.

#### 2.1: User Lookup Endpoint

**File**: `app/api/auth/lookup-email/route.ts`

```typescript
/**
 * Email Lookup API
 * 
 * Looks up user email from username for authentication
 * POST /api/auth/lookup-email
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Look up user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: { email: true, isActive: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      );
    }

    return NextResponse.json({ email: user.email });
  } catch (error) {
    console.error('Email lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 2.2: User Data Endpoint

**File**: `app/api/auth/user/route.ts`

```typescript
/**
 * Current User API
 * 
 * Returns current authenticated user data
 * GET /api/auth/user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get Supabase user
    const supabase = createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user data from database
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        organizationId: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 2.3: Signup Endpoint

**File**: `app/api/auth/signup/route.ts`

```typescript
/**
 * Signup API
 * 
 * Handles user registration with Supabase and database
 * POST /api/auth/signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth/supabase';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId, accessCode, username, email, password, confirmPassword } = await request.json();

    // Validate inputs
    if (!userId || !accessCode || !username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Validate access code
    const accessCodeRecord = await prisma.accessCode.findFirst({
      where: {
        code: accessCode,
        userId,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!accessCodeRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired access code' },
        { status: 400 }
      );
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        organizationId: accessCodeRecord.organizationId,
      },
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        username,
        passwordHash: 'managed_by_supabase', // Placeholder
        organizationId: accessCodeRecord.organizationId,
        role: accessCodeRecord.level as any, // Map level to role
        firstName: accessCodeRecord.name.split(' ')[0],
        lastName: accessCodeRecord.name.split(' ').slice(1).join(' '),
        isActive: true,
      },
    });

    // Mark access code as used
    await prisma.accessCode.update({
      where: { id: accessCodeRecord.id },
      data: { isUsed: true },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Success Criteria**:
- [ ] All API routes created
- [ ] Proper error handling
- [ ] Validation implemented
- [ ] Database operations work
- [ ] Supabase integration works

---

### Task 3: Update Login Form (1 hour)

Update `LoginForm.tsx` to use the new `useAuth` hook instead of `authService`.

**File**: `components/auth/LoginForm.tsx`

**Changes**:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'; // NEW
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth(); // NEW
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await signIn(username, password); // UPDATED

      if (response.success) {
        router.push('/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>

          <div className="text-sm text-center space-y-2">
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="text-primary hover:underline"
              disabled={isLoading}
            >
              Click here to sign up
            </button>
            <br />
            <button
              type="button"
              onClick={() => router.push('/change-password')}
              className="text-primary hover:underline"
              disabled={isLoading}
            >
              Change password
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
```

**Success Criteria**:
- [ ] Login form uses `useAuth` hook
- [ ] Username/password validation works
- [ ] Error messages display correctly
- [ ] Successful login redirects to dashboard
- [ ] Loading states work

---

### Task 4: Update Signup Form (1-2 hours)

Update `SignupForm.tsx` to integrate with Supabase signup.

**File**: `components/auth/SignupForm.tsx`

**Changes**:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'; // NEW
import { accessCodeRepository } from '@/lib/repositories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';

export function SignupForm() {
  const router = useRouter();
  const { signUp } = useAuth(); // NEW
  const [userId, setUserId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [userLevel, setUserLevel] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // NEW
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const handleSearch = async () => {
    if (!userId || !accessCode) {
      setError('Please enter User ID and Access Code');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const code = await accessCodeRepository.validateAccessCode(accessCode, userId);

      if (code) {
        setUserLevel(code.level.replace('_', ' '));
        setName(code.name);
      } else {
        setError('Invalid User ID or Access Code');
        setUserLevel('');
        setName('');
      }
    } catch (err) {
      setError('An error occurred while verifying access code');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    setUsernameError('');

    if (value.trim()) {
      // Check if username already exists
      const { userRepository } = await import('@/lib/repositories');
      const exists = await userRepository.usernameExists(value);
      if (exists) {
        setUsernameError('Username already exists. Please choose a different username.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (usernameError) {
      return;
    }

    if (!email) {
      setError('Email is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await signUp({
        userId,
        accessCode,
        username,
        email, // NEW
        password,
        confirmPassword,
      });

      if (response.success) {
        router.push('/login?registered=true');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/login')}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create a new account</CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              type="text"
              placeholder="Enter your user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              disabled={isLoading || isSearching}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessCode">Access Code</Label>
            <div className="flex gap-2">
              <Input
                id="accessCode"
                type="text"
                placeholder="Enter access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
                disabled={isLoading || isSearching}
              />
              <Button
                type="button"
                onClick={handleSearch}
                disabled={isLoading || isSearching}
              >
                {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Contact your system administrator for your access code
            </p>
          </div>

          {userLevel && (
            <>
              <div className="space-y-2">
                <Label>User Level</Label>
                <Input
                  type="text"
                  value={userLevel}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  value={name}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* NEW: Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  required
                  disabled={isLoading}
                />
                {usernameError && (
                  <p className="text-xs text-destructive">{usernameError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
            </>
          )}
        </CardContent>

        {userLevel && (
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || !!usernameError}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
```

**Success Criteria**:
- [ ] Signup form uses `useAuth` hook
- [ ] Access code validation works
- [ ] Email field added
- [ ] Username uniqueness check works
- [ ] User created in both Supabase and database
- [ ] Success redirects to login

---

### Task 5: Update Other Auth Components (1-2 hours)

Update remaining auth components to use Supabase.

#### 5.1: Change Password Form

**File**: `components/auth/ChangePasswordForm.tsx`

**Changes**: Use `useAuth` hook's `changePassword` function

#### 5.2: Logout Dialog

**File**: `components/auth/LogoutDialog.tsx`

**Changes**: Use `useAuth` hook's `signOut` function

#### 5.3: Protected Route

**File**: `components/auth/ProtectedRoute.tsx`

**Changes**: Use `useAuth` hook to check authentication

#### 5.4: Session Timeout Warning

**File**: `components/auth/SessionTimeoutWarning.tsx`

**Changes**: Monitor Supabase session expiration

**Success Criteria**:
- [ ] All auth components updated
- [ ] Logout works correctly
- [ ] Password change works
- [ ] Protected routes work
- [ ] Session timeout handled

---

### Task 6: Update Dashboard Layout (30 mins)

Update the dashboard layout to use the new auth hook for user display.

**File**: `components/DashboardLayout.tsx` or `app/layout.tsx`

**Changes**: Replace `authService` calls with `useAuth` hook

**Success Criteria**:
- [ ] User info displays correctly
- [ ] Organization context available
- [ ] Logout button works

---

### Task 7: Create Access Code Migration (1 hour)

Create a Prisma model for AccessCode if it doesn't exist.

**File**: `prisma/schema.prisma`

**Add**:

```prisma
model AccessCode {
  id             String   @id @default(uuid())
  code           String   @unique
  userId         String
  name           String
  level          String   // USER_ADMIN, MANAGER, etc.
  organizationId String
  isUsed         Boolean  @default(false)
  expiresAt      DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([code])
  @@index([userId])
  @@index([organizationId])
  @@map("access_codes")
}
```

**Run Migration**:
```bash
npx prisma migrate dev --name add_access_codes
```

**Success Criteria**:
- [ ] AccessCode model added
- [ ] Migration created and applied
- [ ] Indexes created
- [ ] Access codes can be created and validated

---

### Task 8: Testing & Validation (2-3 hours)

Comprehensive testing of the authentication flow.

#### 8.1: Manual Testing

**Login Flow**:
- [ ] Test with valid username/password
- [ ] Test with invalid username
- [ ] Test with invalid password
- [ ] Test with inactive user
- [ ] Verify redirect to dashboard
- [ ] Verify session persists on page refresh

**Signup Flow**:
- [ ] Test with valid access code
- [ ] Test with invalid access code
- [ ] Test with expired access code
- [ ] Test with used access code
- [ ] Test username uniqueness
- [ ] Test email validation
- [ ] Test password validation
- [ ] Verify user created in Supabase
- [ ] Verify user created in database
- [ ] Verify redirect to login

**Logout Flow**:
- [ ] Test logout from dashboard
- [ ] Verify session cleared
- [ ] Verify redirect to login
- [ ] Verify cannot access protected routes

**Password Change**:
- [ ] Test with correct current password
- [ ] Test with incorrect current password
- [ ] Test password validation
- [ ] Verify password updated in Supabase

**Session Management**:
- [ ] Test session persistence
- [ ] Test session refresh
- [ ] Test session expiration
- [ ] Test middleware redirects

#### 8.2: Integration Testing

Create test scripts to automate testing:

**File**: `tests/auth/integration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabaseAdmin } from '@/lib/auth/supabase';
import { prisma } from '@/lib/prisma';

describe('Authentication Integration Tests', () => {
  let testOrganization: any;
  let testAccessCode: any;

  beforeAll(async () => {
    // Create test organization
    testOrganization = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        slug: 'test-org-' + Date.now(),
      },
    });

    // Create test access code
    testAccessCode = await prisma.accessCode.create({
      data: {
        code: 'TEST-CODE-' + Date.now(),
        userId: 'TEST-USER-001',
        name: 'Test User',
        level: 'USER',
        organizationId: testOrganization.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.accessCode.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    await prisma.organization.delete({
      where: { id: testOrganization.id },
    });
  });

  it('should signup new user', async () => {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'TEST-USER-001',
        accessCode: testAccessCode.code,
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should login with username', async () => {
    // Test implementation
  });

  it('should reject invalid credentials', async () => {
    // Test implementation
  });

  // More tests...
});
```

**Success Criteria**:
- [ ] All manual tests pass
- [ ] Integration tests created
- [ ] All integration tests pass
- [ ] Edge cases handled
- [ ] Error messages clear and helpful

---

## Testing Plan

### Test Scenarios

1. **New User Registration**
   - Access code validation
   - Account creation in Supabase
   - User record creation in database
   - Email verification (if enabled)

2. **Existing User Login**
   - Username lookup
   - Password verification
   - Session creation
   - Dashboard access

3. **Session Management**
   - Session persistence across page reloads
   - Automatic session refresh
   - Session expiration handling
   - Logout and session clearing

4. **Password Operations**
   - Password change
   - Password reset request
   - Password reset completion

5. **Protected Routes**
   - Authenticated user access
   - Unauthenticated user redirect
   - Middleware protection
   - Role-based access (future)

### Test Data Requirements

- Test organization
- Test access codes (valid, expired, used)
- Test users (admin, manager, regular)
- Test credentials

---

## Success Criteria

### Functional Requirements

- [ ] Users can sign up with access code
- [ ] Users can log in with username/password
- [ ] Users can log out
- [ ] Users can change password
- [ ] Users can reset password
- [ ] Sessions persist correctly
- [ ] Protected routes work
- [ ] Middleware redirects work

### Technical Requirements

- [ ] Supabase auth integrated
- [ ] Database sync works
- [ ] No localStorage usage (except Supabase cookies)
- [ ] Type safety maintained
- [ ] Error handling comprehensive
- [ ] Loading states proper

### User Experience

- [ ] No change in UI/UX
- [ ] Error messages clear
- [ ] Loading indicators work
- [ ] Smooth transitions
- [ ] No breaking changes

---

## Rollback Plan

If integration fails or causes issues:

### Immediate Rollback (< 5 minutes)

1. **Revert Git Commits**
   ```bash
   git revert HEAD~5..HEAD
   git push
   ```

2. **Restore Old AuthService**
   - Uncomment old AuthService code
   - Update components to use old service
   - Remove new API routes

### Partial Rollback

If only specific components fail:

1. Keep successful integrations
2. Revert failed components
3. Add feature flags for new auth
4. Gradual migration per component

### Data Rollback

If database issues occur:

1. Run backup migration
2. Restore previous state
3. Revert Prisma schema changes

---

## Timeline

### Day 1 (4-6 hours)
- ✅ Morning: Create `useAuth` hook (Task 1)
- ✅ Afternoon: Create API routes (Task 2)
- ✅ Late: Update Login Form (Task 3)

### Day 2 (4-6 hours)
- ✅ Morning: Update Signup Form (Task 4)
- ✅ Midday: Update other auth components (Task 5)
- ✅ Afternoon: Update dashboard layout (Task 6)
- ✅ Late: Create access code migration (Task 7)

### Day 3 (4-6 hours)
- ✅ All Day: Testing & validation (Task 8)
- ✅ Bug fixes and polish
- ✅ Documentation updates

**Total**: 2-3 days (12-18 hours)

---

## Dependencies

### Required

- ✅ Phase 1 complete (Supabase configured, Prisma setup)
- [ ] Supabase project accessible
- [ ] Database connection working
- [ ] Environment variables set

### Optional

- [ ] Email verification setup (can be added later)
- [ ] SMS authentication (future)
- [ ] Social login (future)

---

## Notes

### Important Considerations

1. **Username vs Email**
   - Supabase requires email for authentication
   - We store username separately in database
   - Lookup email from username before sign in

2. **Password Management**
   - Supabase handles password hashing
   - Remove custom password hashing
   - Use Supabase's password policies

3. **Session Storage**
   - Supabase uses cookies (via middleware)
   - Remove localStorage session management
   - Trust Supabase session handling

4. **User Roles**
   - Map old "levels" to Prisma roles
   - Store in database, not Supabase metadata
   - Fetch from database on authentication

5. **Access Codes**
   - Keep access code system
   - Validate before Supabase signup
   - Mark as used after successful signup

### Security Considerations

- Never expose service role key to client
- Use server-side API routes for sensitive operations
- Validate all inputs on server side
- Use HTTPS in production
- Enable email verification
- Implement rate limiting

---

## Next Steps After Completion

1. **Phase 2**: Proceed with API Layer Development
2. **Enhancements**:
   - Add email verification
   - Add password reset flow
   - Add social login options
   - Add two-factor authentication
   - Add role-based access control

3. **Monitoring**:
   - Set up error tracking
   - Monitor authentication metrics
   - Track failed login attempts
   - Monitor session duration

---

**Document Version**: 1.0  
**Last Updated**: October 10, 2025  
**Status**: Ready for Implementation  
**Estimated Effort**: 2-3 days




