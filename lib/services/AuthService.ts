/**
 * Authentication Service
 * 
 * Handles user authentication, registration, and session management
 */

import { 
  User, 
  UserSession, 
  LoginRequest, 
  LoginResponse, 
  SignupRequest, 
  SignupResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UserLevel,
  USER_PERMISSIONS,
  UserPermissions
} from '@/types';
import { userRepository, accessCodeRepository } from '../repositories';

export class AuthService {
  private static instance: AuthService;
  private currentSession: UserSession | null = null;

  private constructor() {
    this.loadSession();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * User login
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const user = await userRepository.findByUsername(request.username);

      if (!user) {
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is inactive. Please contact administrator.',
        };
      }

      const passwordValid = await this.verifyPassword(request.password, user.passwordHash);

      if (!passwordValid) {
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      // Update last login
      await userRepository.updateLastLogin(user.id);

      // Create session
      const session = this.createSession(user);
      this.currentSession = session;
      this.saveSession(session);

      const { passwordHash, ...userWithoutPassword } = user;

      return {
        success: true,
        session,
        user: userWithoutPassword,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login',
      };
    }
  }

  /**
   * User signup/registration
   */
  async signup(request: SignupRequest): Promise<SignupResponse> {
    try {
      // Validate passwords match
      if (request.password !== request.confirmPassword) {
        return {
          success: false,
          message: 'Passwords do not match',
        };
      }

      // Validate password strength
      if (request.password.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters long',
        };
      }

      // Check if username already exists
      const existingUser = await userRepository.findByUsername(request.username);
      if (existingUser) {
        return {
          success: false,
          message: 'Username already exists. Please choose a different username.',
        };
      }

      // Validate access code
      const accessCode = await accessCodeRepository.validateAccessCode(
        request.accessCode,
        request.userId
      );

      if (!accessCode) {
        return {
          success: false,
          message: 'Invalid or expired access code',
        };
      }

      // Create user
      const passwordHash = await this.hashPassword(request.password);
      const user = await userRepository.create({
        userId: request.userId,
        username: request.username,
        passwordHash,
        level: accessCode.level,
        name: accessCode.name,
        isActive: true,
      });

      // Mark access code as used
      await accessCodeRepository.markAsUsed(request.accessCode);

      const { passwordHash: _, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword,
        message: 'Account created successfully',
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: 'An error occurred during registration',
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    try {
      // Validate new passwords match
      if (request.newPassword !== request.confirmPassword) {
        return {
          success: false,
          message: 'New passwords do not match',
        };
      }

      // Validate password strength
      if (request.newPassword.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters long',
        };
      }

      // Find user
      const user = await userRepository.findByUsername(request.username);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Verify current password
      const passwordValid = await this.verifyPassword(request.currentPassword, user.passwordHash);
      if (!passwordValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
        };
      }

      // Update password
      const newPasswordHash = await this.hashPassword(request.newPassword);
      await userRepository.update(user.id, { passwordHash: newPasswordHash });

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'An error occurred while changing password',
      };
    }
  }

  /**
   * Logout
   */
  logout(): void {
    this.currentSession = null;
    this.clearSession();
  }

  /**
   * Get current session
   */
  getCurrentSession(): UserSession | null {
    if (!this.currentSession) {
      return null;
    }

    // Check if session is expired
    if (new Date() > this.currentSession.expiresAt) {
      this.logout();
      return null;
    }

    return this.currentSession;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentSession() !== null;
  }

  /**
   * Get current user permissions
   */
  getCurrentUserPermissions(): UserPermissions | null {
    const session = this.getCurrentSession();
    if (!session) {
      return null;
    }

    return USER_PERMISSIONS[session.level];
  }

  /**
   * Check if current user has specific permission
   */
  hasPermission(permission: keyof UserPermissions): boolean {
    const permissions = this.getCurrentUserPermissions();
    if (!permissions) {
      return false;
    }

    return permissions[permission];
  }

  /**
   * Create a session for user
   */
  private createSession(user: User): UserSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      userId: user.id,
      username: user.username,
      level: user.level,
      name: user.name,
      token: this.generateToken(),
      expiresAt,
      createdAt: now,
    };
  }

  /**
   * Generate a session token
   */
  private generateToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Hash password (simple implementation)
   * Note: In production, use bcrypt or similar
   */
  private async hashPassword(password: string): Promise<string> {
    // Simple hash for demo purposes
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  /**
   * Save session to storage
   */
  private saveSession(session: UserSession): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('snm_session', JSON.stringify(session));
    }
  }

  /**
   * Load session from storage
   */
  private loadSession(): void {
    if (typeof window !== 'undefined') {
      const sessionData = localStorage.getItem('snm_session');
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          session.expiresAt = new Date(session.expiresAt);
          session.createdAt = new Date(session.createdAt);
          
          // Check if session is still valid
          if (new Date() <= session.expiresAt) {
            this.currentSession = session;
          } else {
            this.clearSession();
          }
        } catch (error) {
          console.error('Error loading session:', error);
          this.clearSession();
        }
      }
    }
  }

  /**
   * Clear session from storage
   */
  private clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('snm_session');
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
