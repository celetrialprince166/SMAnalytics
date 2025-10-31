/**
 * Inventory Movement Repository
 * 
 * Data access layer for inventory movements
 */

import { InventoryMovement } from '@/types';
import { BaseRepository } from './BaseRepository';

export class InventoryMovementRepository extends BaseRepository<InventoryMovement> {
  protected storageKey = 'inventoryMovements' as const;

  /**
   * Find movements by product
   */
  async findByProduct(productId: string): Promise<InventoryMovement[]> {
    const movements = this.getAll();
    return movements.filter(m => m.productId === productId);
  }

  /**
   * Find movements by type
   */
  async findByType(type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT'): Promise<InventoryMovement[]> {
    const movements = this.getAll();
    return movements.filter(m => m.type === type);
  }

  /**
   * Find movements by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<InventoryMovement[]> {
    const movements = this.getAll();
    return movements.filter(m => {
      const movementDate = new Date(m.date);
      return movementDate >= startDate && movementDate <= endDate;
    });
  }

  /**
   * Find movements by reference number
   */
  async findByReference(referenceNumber: string): Promise<InventoryMovement[]> {
    const movements = this.getAll();
    return movements.filter(m => m.referenceNumber === referenceNumber);
  }

  /**
   * Get total quantity for a product
   */
  async getTotalQuantity(productId: string): Promise<number> {
    const movements = await this.findByProduct(productId);
    return movements.reduce((total, movement) => {
      if (movement.type === 'PURCHASE' || movement.type === 'ADJUSTMENT') {
        return total + movement.quantity;
      } else if (movement.type === 'SALE') {
        return total - movement.quantity;
      }
      return total;
    }, 0);
  }

  /**
   * Get total value for a product
   */
  async getTotalValue(productId: string): Promise<number> {
    const movements = await this.findByProduct(productId);
    return movements.reduce((total, movement) => {
      if (movement.type === 'PURCHASE' || movement.type === 'ADJUSTMENT') {
        return total + movement.totalCost;
      } else if (movement.type === 'SALE') {
        return total - movement.totalCost;
      }
      return total;
    }, 0);
  }

  /**
   * Get average cost for a product
   */
  async getAverageCost(productId: string): Promise<number> {
    const quantity = await this.getTotalQuantity(productId);
    const value = await this.getTotalValue(productId);
    return quantity > 0 ? value / quantity : 0;
  }

  /**
   * Get last movement date for a product
   */
  async getLastMovementDate(productId: string): Promise<Date | null> {
    const movements = await this.findByProduct(productId);
    if (movements.length === 0) return null;
    
    const sorted = movements.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sorted[0].date;
  }
}

// Export singleton instance
export const inventoryMovementRepository = new InventoryMovementRepository();
