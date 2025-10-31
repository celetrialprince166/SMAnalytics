'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userRepository } from '@/lib/repositories';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const users = await userRepository.findAll();
      
      if (users.length === 0) {
        // No users exist, redirect to setup
        router.push('/setup');
      } else {
        // Users exist, redirect to login
        router.push('/login');
      }
    } catch (error) {
      console.error('Error checking setup:', error);
      router.push('/setup');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return null;
}
