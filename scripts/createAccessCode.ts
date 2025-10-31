/**
 * Create Access Code Script
 * 
 * Run this in browser console to create an access code for user registration
 */

import { accessCodeRepository } from '@/lib/repositories';
import { UserLevel } from '@/types';

export async function createAccessCode(
  userId: string,
  level: UserLevel,
  name: string,
  expiresInDays?: number
) {
  const accessCode = await accessCodeRepository.createAccessCode(
    userId,
    level,
    name,
    expiresInDays
  );

  console.log('Access Code Created:');
  console.log('-------------------');
  console.log('User ID:', accessCode.userId);
  console.log('Access Code:', accessCode.code);
  console.log('Level:', accessCode.level);
  console.log('Name:', accessCode.name);
  console.log('-------------------');
  console.log('Use this code to sign up at /signup');

  return accessCode;
}

// Example usage in browser console:
// createAccessCode('U001', 'SUPER_USER', 'Admin User')
