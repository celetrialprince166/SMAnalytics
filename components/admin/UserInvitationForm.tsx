'use client';

/**
 * User Invitation Form Component
 * Allows admins to create invitations for new users
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateInvitation, useInvitations } from '@/lib/hooks/useInvitations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, Check, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['USER', 'ACCOUNTANT', 'MANAGER', 'ADMIN']),
});

type FormData = z.infer<typeof schema>;

interface UserInvitationFormProps {
  orgId: string;
}

export function UserInvitationForm({ orgId }: UserInvitationFormProps) {
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'USER',
    },
  });

  const { mutate, isPending } = useCreateInvitation();
  const { data: invitations, isLoading } = useInvitations(orgId);

  const selectedRole = watch('role');

  const onSubmit = (data: FormData) => {
    mutate(
      { email: data.email, name: data.name, role: data.role, orgId },
      {
        onSuccess: (result) => {
          setGeneratedCode(result.code);
          reset();
        },
      }
    );
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast.success('Access code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create User Invitation</CardTitle>
          <CardDescription>
            Generate an access code for a new user to sign up
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                {...register('email')}
                disabled={isPending}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register('name')}
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setValue('role', value as any)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Invitation
            </Button>
          </form>

          {generatedCode && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Access Code Generated:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-background rounded border text-lg font-mono">
                  {generatedCode}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyToClipboard}
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this code with the user. It expires in 7 days.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Active invitation codes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : invitations && invitations.length > 0 ? (
            <div className="space-y-2">
              {invitations
                .filter((inv: any) => !inv.isUsed)
                .map((inv: any) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{inv.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {inv.name} • {inv.level} • Code: {inv.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No pending invitations
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
