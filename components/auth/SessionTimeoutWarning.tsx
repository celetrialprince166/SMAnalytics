'use client';

/**
 * Session Timeout Warning Component
 * 
 * Displays a warning when session is about to expire
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/contexts/SupabaseAuthContext';
import { setupActivityListeners, onSessionWarning, onSessionTimeout, stopSessionTimeout } from '@/lib/utils/sessionTimeout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function SessionTimeoutWarning() {
  const router = useRouter();
  const { signOut } = useSupabaseAuth();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Set up callbacks
    onSessionWarning(() => {
      setShowWarning(true);
    });

    onSessionTimeout(() => {
      setShowWarning(false);
      router.push('/login?timeout=true');
    });

    // Set up activity listeners
    const cleanup = setupActivityListeners();

    return () => {
      stopSessionTimeout();
      if (cleanup) cleanup();
    };
  }, [router]);

  const handleContinue = () => {
    setShowWarning(false);
    // Activity will reset the timer automatically
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in 5 minutes due to inactivity. 
            Would you like to continue your session?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout}>Logout</AlertDialogCancel>
          <AlertDialogAction onClick={handleContinue}>Continue Session</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
