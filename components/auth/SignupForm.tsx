'use client';

/**
 * Signup Form Component
 *
 * Two-step signup flow:
 * 1. Validate email + access code
 * 2. Create password and complete signup
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useValidateCode, useCompleteSignup } from '@/lib/hooks/useSignup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const validateSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().min(8, 'Access code must be 8 characters'),
});

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ValidateFormData = z.infer<typeof validateSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<'validate' | 'password'>('validate');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = useForm<ValidateFormData>({
    resolver: zodResolver(validateSchema),
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const validateMutation = useValidateCode();
  const signupMutation = useCompleteSignup();

  const handleValidate = validateForm.handleSubmit((data) => {
    validateMutation.mutate(
      { email: data.email, code: data.code },
      {
        onSuccess: (info) => {
          setUserInfo(info);
          setStep('password');
        },
      }
    );
  });

  const handleSignup = passwordForm.handleSubmit((data) => {
    const email = validateForm.getValues('email');
    const code = validateForm.getValues('code');

    signupMutation.mutate(
      {
        email,
        code,
        password: data.password,
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            router.push('/login?registered=true');
          }
        },
      }
    );
  });

  if (step === 'validate') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/login')}
              disabled={validateMutation.isPending}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Enter your email and access code</CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleValidate}>
          <CardContent className="space-y-4">
            {validateMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {validateMutation.error?.message || 'Invalid access code'}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                {...validateForm.register('email')}
                disabled={validateMutation.isPending}
              />
              {validateForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {validateForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Access Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 8-character code"
                maxLength={8}
                {...validateForm.register('code')}
                disabled={validateMutation.isPending}
                className="uppercase"
              />
              {validateForm.formState.errors.code && (
                <p className="text-sm text-destructive">
                  {validateForm.formState.errors.code.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Contact your administrator for your access code
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={validateMutation.isPending}>
              {validateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Code
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  // Step 2: Password setup
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep('validate')}
            disabled={signupMutation.isPending}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Create Password</CardTitle>
            <CardDescription>Welcome, {userInfo?.name}!</CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="space-y-4">
          {signupMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {(signupMutation.error as any)?.error || 'Signup failed'}
              </AlertDescription>
            </Alert>
          )}

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Role:</span> {userInfo?.level}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password (min 6 characters)"
                {...passwordForm.register('password')}
                disabled={signupMutation.isPending}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {passwordForm.formState.errors.password && (
              <p className="text-sm text-destructive">
                {passwordForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                {...passwordForm.register('confirmPassword')}
                disabled={signupMutation.isPending}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
            {signupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
