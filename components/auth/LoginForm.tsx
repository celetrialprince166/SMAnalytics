'use client';

/**
 * Login Form Component
 * 
 * Handles user login with username and password
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useSupabaseAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userLevel, setUserLevel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    setError('');
    
    // Auto-detect user level when username is entered
    if (value.trim()) {
      // This would typically query the backend, but we'll check locally
      // For now, just clear the user level
      setUserLevel('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await signIn(username, password);

      if (response.success) {
        router.push('/dashboard');
      } else {
        setError(response.error || 'Login failed');
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
              onChange={(e) => handleUsernameChange(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {userLevel && (
            <div className="space-y-2">
              <Label>User Level</Label>
              <Input
                type="text"
                value={userLevel.replace('_', ' ')}
                disabled
                className="bg-muted"
              />
            </div>
          )}

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
