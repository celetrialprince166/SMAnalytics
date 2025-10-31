/**
 * User Repository
 * 
 * Data access layer for user and authentication management
 */

import { BaseRepository } from './BaseRepository';
import { User, AccessCode, UserLevel } from '@/types';
import { storageService } from '../storage/LocalStorageService';

export class UserRepository extends BaseRepository<User> {
  protected storageKey = 'users' as const;

  async findByUsername(username: string): Promise<User | null> {
    const users = this.getAll();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  async findByUserId(userId: string): Promise<User | null> {
    const users = this.getAll();
    return users.find(u => u.userId === userId) || null;
  }

  async usernameExists(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return user !== null;
  }

  async findActive(): Promise<User[]> {
    const users = this.getAll();
    return users.filter(u => u.isActive);
  }

  async findByLevel(level: UserLevel): Promise<User[]> {
    const users = this.getAll();
    return users.filter(u => u.level === level && u.isActive);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.update(userId, { lastLogin: new Date() });
  }
}

export class AccessCodeRepository extends BaseRepository<AccessCode> {
  protected storageKey = 'accessCodes' as const;

  async findByCode(code: string): Promise<AccessCode | null> {
    const codes = this.getAll();
    return codes.find(c => c.code === code) || null;
  }

  async findByUserId(userId: string): Promise<AccessCode | null> {
    const codes = this.getAll();
    return codes.find(c => c.userId === userId) || null;
  }

  async validateAccessCode(code: string, userId: string): Promise<AccessCode | null> {
    const accessCode = await this.findByCode(code);

    if (!accessCode) {
      return null;
    }

    if (accessCode.userId !== userId) {
      return null;
    }

    if (accessCode.isUsed) {
      return null;
    }

    if (accessCode.expiresAt && new Date() > accessCode.expiresAt) {
      return null;
    }

    return accessCode;
  }

  async markAsUsed(code: string): Promise<void> {
    const accessCodes = this.getAll();
    const index = accessCodes.findIndex(c => c.code === code);
    if (index !== -1) {
      accessCodes[index] = { ...accessCodes[index], isUsed: true };
      this.saveAll(accessCodes);
    }
  }

  async createAccessCode(userId: string, level: UserLevel, name: string, expiresInDays?: number): Promise<AccessCode> {
    const code = this.generateAccessCode();
    const now = new Date();
    const expiresAt = expiresInDays
      ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    return await this.create({
      code,
      userId,
      level,
      name,
      isUsed: false,
      expiresAt,
    });
  }

  private generateAccessCode(): string {
    // Generate a random 8-character alphanumeric code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking characters
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

// Export singleton instances
export const userRepository = new UserRepository();
export const accessCodeRepository = new AccessCodeRepository();
