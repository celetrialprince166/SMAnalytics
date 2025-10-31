/**
 * Base Repository
 * 
 * Generic repository pattern implementation for data access
 */

import { storageService } from '../storage/LocalStorageService';

export interface Repository<T> {
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(filters?: any): Promise<T[]>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export abstract class BaseRepository<T extends { id: string; createdAt?: Date; updatedAt?: Date }> implements Repository<T> {
  protected abstract storageKey: keyof import('@/types').AppData;

  /**
   * Generate a unique ID
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all entities from storage
   */
  protected getAll(): T[] {
    const data = storageService.getData(this.storageKey);
    return (Array.isArray(data) ? data : []) as unknown as T[];
  }

  /**
   * Save all entities to storage
   */
  protected saveAll(entities: T[]): void {
    storageService.updateData(this.storageKey, entities as unknown as any);
  }

  /**
   * Create a new entity
   */
  async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const newEntity = {
      ...entity,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    } as T;

    const entities = this.getAll();
    entities.push(newEntity);
    this.saveAll(entities);

    return newEntity;
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    const entities = this.getAll();
    return entities.find(e => e.id === id) || null;
  }

  /**
   * Find entity by ID (synchronous version for internal use)
   */
  findByIdSync(id: string): T | null {
    const entities = this.getAll();
    return entities.find(e => e.id === id) || null;
  }

  /**
   * Find all entities with optional filtering
   */
  async findAll(filters?: any): Promise<T[]> {
    let entities = this.getAll();

    if (filters) {
      entities = this.applyFilters(entities, filters);
    }

    return entities;
  }

  /**
   * Update an entity
   */
  async update(id: string, updates: Partial<T>): Promise<T> {
    const entities = this.getAll();
    const index = entities.findIndex(e => e.id === id);

    if (index === -1) {
      throw new Error(`Entity with id ${id} not found`);
    }

    const updatedEntity = {
      ...entities[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    entities[index] = updatedEntity;
    this.saveAll(entities);

    return updatedEntity;
  }

  /**
   * Delete an entity
   */
  async delete(id: string): Promise<void> {
    const entities = this.getAll();
    const filtered = entities.filter(e => e.id !== id);

    if (filtered.length === entities.length) {
      throw new Error(`Entity with id ${id} not found`);
    }

    this.saveAll(filtered);
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
    const entities = await this.findAll(filters);
    return entities.length;
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const entity = await this.findById(id);
    return entity !== null;
  }
}
