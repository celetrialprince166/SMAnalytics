'use client';

/**
 * Signup Form Component
 * 
 * Handles user registration with access code verification
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';

export function SignupForm() {
  const router = useRouter();
  const { signUp } = useSupabaseAuth();
  const [userId, setUserId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [userLevel, setUserLevel] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
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
      const response = await fetch('/api/auth/validate-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accessCode }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserLevel(data.level.replace('_', ' '));
        setName(data.name);
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
        email,
        password,
      });

      if (response.success) {
        router.push('/login?registered=true');
      } else {
        setError(response.error || 'Registration failed');
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
