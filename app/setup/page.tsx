'use client';

/**
 * Initial Setup Page
 * 
 * Creates the first admin user and access codes
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { accessCodeRepository, userRepository } from '@/lib/repositories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SetupPage() {
  const router = useRouter();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
  const [hasUsers, setHasUsers] = useState(false);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    const users = await userRepository.findAll();
    setHasUsers(users.length > 0);

    const codes = await accessCodeRepository.findAll();
    setAccessCodes(codes.filter(c => !c.isUsed));
  };

  const createInitialSetup = async () => {
    setIsLoading(true);
    try {
      // Create access codes for different user levels
      const codes = await Promise.all([
        accessCodeRepository.createAccessCode('U001', 'SUPER_USER', 'Super Admin'),
        accessCodeRepository.createAccessCode('U002', 'ADMIN', 'Administrator'),
        accessCodeRepository.createAccessCode('U003', 'USER_2', 'Manager'),
        accessCodeRepository.createAccessCode('U004', 'USER_1', 'Staff User'),
      ]);

      setAccessCodes(codes);
      setIsSetupComplete(true);
      toast.success('Setup completed successfully!');
    } catch (error) {
      console.error('Setup error:', error);
      toast.error('Failed to complete setup');
    } finally {
      setIsLoading(false);
    }
  };

  if (hasUsers) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <CardTitle>Setup Already Complete</CardTitle>
                <CardDescription>Users already exist in the system</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  The system has already been set up. Please use the login page to access your account.
                </AlertDescription>
              </Alert>
              <Button onClick={() => router.push('/login')} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="flex justify-center mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Building2 className="h-12 w-12 text-primary" />
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-2">SNM Accounts Manager</h1>
      <p className="text-muted-foreground mb-8">Initial System Setup</p>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome to SNM Accounts Management System</CardTitle>
          <CardDescription>
            Let's set up your system with initial access codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSetupComplete ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Click the button below to create access codes for user registration. 
                  You'll need these codes to create user accounts.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">What will be created:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Super User access code (Full system access)</li>
                  <li>Admin access code (Administrative access)</li>
                  <li>Manager access code (USER_2 level)</li>
                  <li>Staff access code (USER_1 level)</li>
                </ul>
              </div>

              <Button 
                onClick={createInitialSetup} 
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Creating...' : 'Create Access Codes'}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  Setup completed successfully! Use the access codes below to register users.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">Access Codes Created:</h3>
                {accessCodes.map((code, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">User ID</p>
                          <p className="font-mono font-bold">{code.userId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Access Code</p>
                          <p className="font-mono font-bold text-lg text-primary">{code.code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Level</p>
                          <p className="font-semibold">{code.level.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-semibold">{code.name}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Important:</strong> Save these access codes! You'll need them to create user accounts.
                  Each code can only be used once.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={() => router.push('/signup')} className="flex-1">
                  Go to Sign Up
                </Button>
                <Button onClick={() => router.push('/login')} variant="outline" className="flex-1">
                  Go to Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
