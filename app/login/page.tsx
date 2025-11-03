import { LoginForm } from '@/components/auth';
import { Building2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="flex justify-center mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Building2 className="h-12 w-12 text-primary" />
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-2">SNM Accounts Manager</h1>
      <p className="text-muted-foreground mb-8">Professional Accounting Management System</p>
      
      <LoginForm />
      
      <div className="mt-6 w-full max-w-md">
        <Alert>
          <UserPlus className="h-4 w-4" />
          <AlertDescription>
            <strong>New user?</strong> You need to{' '}
            <Link href="/signup" className="font-medium underline underline-offset-4 hover:text-primary">
              sign up first
            </Link>{' '}
            with an access code from your administrator before you can login.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
