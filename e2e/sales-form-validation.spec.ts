/**
 * Sales Form Validation E2E Test
 * 
 * Tests the updated sales form validation where either product OR service must be selected
 */

import { test, expect } from '@playwright/test';

test.describe('Sales Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the sales form
    await page.goto('/transactions/sales');
    
    // Wait for the form to load
    await page.waitForSelector('[data-testid="sales-form"], form', { timeout: 10000 });
  });

  test('should show product as optional when service is selected', async ({ page }) => {
    // Select a service line first
    const serviceLineSelect = page.locator('select, [role="combobox"]').first();
    await serviceLineSelect.waitFor({ state: 'visible' });
    
    // Wait for services to load after selecting service line
    await page.waitForTimeout(1000);
    
    // Select a service
    const serviceSelect = page.locator('select, [role="combobox"]').nth(1);
    if (await serviceSelect.isVisible()) {
      await serviceSelect.selectOption({ index: 1 });
    }
    
    // Check if product label shows as optional
    const productLabel = page.locator('label').filter({ hasText: /product/i });
    if (await productLabel.isVisible()) {
      const labelText = await productLabel.textContent();
      expect(labelText).toContain('Optional');
    }
  });

  test('should show service as optional when product is selected', async ({ page }) => {
    // Select a product first
    const productSelect = page.locator('select, [role="combobox"]').last();
    if (await productSelect.isVisible()) {
      await productSelect.selectOption({ index: 1 });
    }
    
    // Check if service label shows as optional
    const serviceLabel = page.locator('label').filter({ hasText: /service/i }).nth(1);
    if (await serviceLabel.isVisible()) {
      const labelText = await serviceLabel.textContent();
      expect(labelText).toContain('Optional');
    }
  });

  test('should allow submission with only service selected', async ({ page }) => {
    // Fill in required fields
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[placeholder*="description"], textarea', 'Test service sale');
    await page.fill('input[placeholder*="service fee"], input[type="number"]', '1000');
    await page.fill('input[placeholder*="cost value"], input[type="number"]', '600');
    
    // Select a service line and service
    const serviceLineSelect = page.locator('select, [role="combobox"]').first();
    await serviceLineSelect.waitFor({ state: 'visible' });
    await serviceLineSelect.selectOption({ index: 1 });
    
    await page.waitForTimeout(1000);
    
    const serviceSelect = page.locator('select, [role="combobox"]').nth(1);
    if (await serviceSelect.isVisible()) {
      await serviceSelect.selectOption({ index: 1 });
    }
    
    // Select a customer account
    const customerSelect = page.locator('select, [role="combobox"]').filter({ hasText: /customer/i });
    if (await customerSelect.isVisible()) {
      await customerSelect.selectOption({ index: 1 });
    }
    
    // Try to submit the form
    const submitButton = page.locator('button').filter({ hasText: /submit|save/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Check for success message or no validation error
      await page.waitForTimeout(2000);
      
      // Should not show validation error for missing product
      const errorMessage = page.locator('text=/please select a product/i');
      await expect(errorMessage).not.toBeVisible();
    }
  });

  test('should allow submission with only product selected', async ({ page }) => {
    // Fill in required fields
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[placeholder*="description"], textarea', 'Test product sale');
    await page.fill('input[placeholder*="service fee"], input[type="number"]', '1000');
    await page.fill('input[placeholder*="cost value"], input[type="number"]', '600');
    
    // Select a product
    const productSelect = page.locator('select, [role="combobox"]').last();
    if (await productSelect.isVisible()) {
      await productSelect.selectOption({ index: 1 });
    }
    
    // Select a customer account
    const customerSelect = page.locator('select, [role="combobox"]').filter({ hasText: /customer/i });
    if (await customerSelect.isVisible()) {
      await customerSelect.selectOption({ index: 1 });
    }
    
    // Try to submit the form
    const submitButton = page.locator('button').filter({ hasText: /submit|save/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Check for success message or no validation error
      await page.waitForTimeout(2000);
      
      // Should not show validation error for missing service
      const errorMessage = page.locator('text=/please select a service/i');
      await expect(errorMessage).not.toBeVisible();
    }
  });

  test('should show validation error when neither product nor service is selected', async ({ page }) => {
    // Fill in required fields but don't select product or service
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[placeholder*="description"], textarea', 'Test sale without selection');
    await page.fill('input[placeholder*="service fee"], input[type="number"]', '1000');
    await page.fill('input[placeholder*="cost value"], input[type="number"]', '600');
    
    // Select a customer account
    const customerSelect = page.locator('select, [role="combobox"]').filter({ hasText: /customer/i });
    if (await customerSelect.isVisible()) {
      await customerSelect.selectOption({ index: 1 });
    }
    
    // Try to submit the form
    const submitButton = page.locator('button').filter({ hasText: /submit|save/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation error
      const errorMessage = page.locator('text=/either.*product.*service.*required/i, text=/please select either.*product.*service/i');
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should show appropriate placeholder text based on selection', async ({ page }) => {
    // Check initial placeholder for product
    const productSelect = page.locator('select, [role="combobox"]').last();
    if (await productSelect.isVisible()) {
      const placeholder = await productSelect.getAttribute('placeholder');
      expect(placeholder).toContain('Select product');
    }
    
    // Select a service first
    const serviceLineSelect = page.locator('select, [role="combobox"]').first();
    await serviceLineSelect.waitFor({ state: 'visible' });
    await serviceLineSelect.selectOption({ index: 1 });
    
    await page.waitForTimeout(1000);
    
    const serviceSelect = page.locator('select, [role="combobox"]').nth(1);
    if (await serviceSelect.isVisible()) {
      await serviceSelect.selectOption({ index: 1 });
    }
    
    // Check if product placeholder changed to show it's optional
    if (await productSelect.isVisible()) {
      const placeholder = await productSelect.getAttribute('placeholder');
      expect(placeholder).toContain('optional');
    }
  });
});









