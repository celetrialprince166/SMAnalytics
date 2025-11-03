/**
 * TanStack Query hooks for signup flow
 */

import { useMutation } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/lib/contexts/SupabaseAuthContext';

export function useValidateCode() {
  return useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      const res = await fetch('/api/auth/validate-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, accessCode: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid code');
      }

      return data;
    },
  });
}

export function useCompleteSignup() {
  const { signUp } = useSupabaseAuth();

  return useMutation({
    mutationFn: async ({
      email,
      code,
      password,
    }: {
      email: string;
      code: string;
      password: string;
    }) => {
      return signUp({ email, accessCode: code, password });
    },
  });
}
