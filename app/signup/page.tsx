import { SignupForm } from '@/components/auth';
import { Building2, Info, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="flex justify-center mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Building2 className="h-12 w-12 text-primary" />
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-2">SNM Accounts Manager</h1>
      <p className="text-muted-foreground mb-4">Create Your Account</p>
      
      <div className="w-full max-w-md mb-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>New users only.</strong> You need an access code from your administrator to create an account.
            Already have an account?{' '}
            <Link href="/login" className="font-medium underline underline-offset-4 hover:text-primary">
              Login here
            </Link>
          </AlertDescription>
        </Alert>
      </div>
      
      <SignupForm />
    </div>
  );
}
