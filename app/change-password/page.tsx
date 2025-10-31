import { ChangePasswordForm } from '@/components/auth';
import { Building2 } from 'lucide-react';

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="flex justify-center mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Building2 className="h-12 w-12 text-primary" />
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-2">SNM Accounts Manager</h1>
      <p className="text-muted-foreground mb-8">Update Your Password</p>
      <ChangePasswordForm />
    </div>
  );
}
