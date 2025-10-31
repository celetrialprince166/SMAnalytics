/**
 * Prisma Base Repository
 * 
 * Generic Prisma repository pattern implementation
 * Mirrors the existing BaseRepository interface for seamless migration
 */

import { prisma, PrismaTransactionClient } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Re-export the Repository interface from existing BaseRepository
export interface Repository<T> {
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(filters?: any): Promise<T[]>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

/**
 * Base Prisma Repository
 * 
 * Provides common CRUD operations using Prisma
 * Maintains same interface as localStorage BaseRepository for compatibility
 */
export abstract class PrismaBaseRepository<T extends { id: string }> implements Repository<T> {
  protected abstract modelName: Prisma.ModelName;
  protected organizationId?: string;

  /**
   * Get Prisma delegate for the model
   */
  protected getDelegate(tx?: PrismaTransactionClient) {
    const client = tx || prisma;
    return (client as any)[this.modelNameLowercase()];
  }

  /**
   * Convert model name to lowercase (prisma convention)
   */
  protected modelNameLowercase(): string {
    return this.modelName.charAt(0).toLowerCase() + this.modelName.slice(1);
  }

  /**
   * Set organization context for multi-tenancy
   */
  setOrganizationId(organizationId: string): this {
    this.organizationId = organizationId;
    return this;
  }

  /**
   * Add organization filter if context is set
   */
  protected addOrgFilter<W>(where?: W): W {
    if (this.organizationId && where) {
      return { ...where, organizationId: this.organizationId } as W;
    }
    return where || ({} as W);
  }

  /**
   * Create a new entity
   */
  async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const delegate = this.getDelegate();
    const data = this.organizationId
      ? { ...entity, organizationId: this.organizationId }
      : entity;

    return delegate.create({ data }) as Promise<T>;
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ id });
    return delegate.findUnique({ where }) as Promise<T | null>;
  }

  /**
   * Find entity by ID (synchronous version for internal use)
   * Note: This is async in Prisma, but we maintain the interface
   */
  async findByIdSync(id: string): Promise<T | null> {
    return this.findById(id);
  }

  /**
   * Find all entities with optional filtering
   */
  async findAll(filters?: any): Promise<T[]> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter(filters);
    return delegate.findMany({ where }) as Promise<T[]>;
  }

  /**
   * Update an entity
   */
  async update(id: string, updates: Partial<T>): Promise<T> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ id });
    
    // Remove fields that shouldn't be updated
    const { id: _, createdAt, ...data } = updates as any;
    
    return delegate.update({
      where,
      data,
    }) as Promise<T>;
  }

  /**
   * Delete an entity (soft delete by default)
   */
  async delete(id: string): Promise<void> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ id });
    
    // Try soft delete first
    try {
      await delegate.update({
        where,
        data: { isActive: false },
      });
    } catch (error) {
      // If no isActive field, do hard delete
      await delegate.delete({ where });
    }
  }

  /**
   * Apply filters to entities (to be overridden by subclasses)
   */
  protected applyFilters(entities: T[], filters: any): T[] {
    return entities;
  }

  /**
   * Count entities
   */
  async count(filters?: any): Promise<number> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter(filters);
    return delegate.count({ where });
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.count({ id });
    return count > 0;
  }

  /**
   * Execute operation in transaction
   */
  protected async executeInTransaction<R>(
    fn: (tx: PrismaTransactionClient) => Promise<R>
  ): Promise<R> {
    return prisma.$transaction(fn);
  }
}















