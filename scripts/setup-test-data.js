/**
 * Setup Test Data for Sales API Testing
 * 
 * This script creates the necessary test data:
 * - Organization
 * - Primary/Secondary/Holder Accounts
 * - Products
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupTestData() {
  console.log('🚀 Setting up test data for Sales API...\n');

  try {
    const orgId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Step 1: Ensure Organization exists
    console.log('📋 Step 1: Setting up Organization...');
    const organization = await prisma.organization.upsert({
      where: { id: orgId },
      update: {},
      create: {
        id: orgId,
        name: 'Test Organization',
        slug: 'test-organization',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Organization ready:', organization.name);

    // Step 2: Create Primary Account (Assets)
    console.log('\n📋 Step 2: Creating Primary Account...');
    const primaryAccount = await prisma.primaryAccount.upsert({
      where: { 
        organizationId_name: {
          organizationId: orgId,
          name: 'Assets'
        }
      },
      update: {},
      create: {
        organizationId: orgId,
        name: 'Assets',
        type: 'ASSETS',
        description: 'Primary assets account',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Primary Account ready:', primaryAccount.name);

    // Step 3: Create Secondary Account (Current Assets)
    console.log('\n📋 Step 3: Creating Secondary Account...');
    const secondaryAccount = await prisma.secondaryAccount.upsert({
      where: { 
        organizationId_code: {
          organizationId: orgId,
          code: '01-001'
        }
      },
      update: {},
      create: {
        organizationId: orgId,
        primaryAccountId: primaryAccount.id,
        code: '01-001',
        name: 'Current Assets',
        description: 'Current assets secondary account',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Secondary Account ready:', secondaryAccount.name);

    // Step 4: Create Holder Accounts
    console.log('\n📋 Step 4: Creating Holder Accounts...');
    
    // Customer Account (Accounts Receivable)
    const customerAccount = await prisma.holderAccount.upsert({
      where: { 
        organizationId_code: {
          organizationId: orgId,
          code: '01-001-001'
        }
      },
      update: {},
      create: {
        organizationId: orgId,
        secondaryAccountId: secondaryAccount.id,
        code: '01-001-001',
        name: 'Accounts Receivable',
        description: 'Customer accounts receivable',
        balance: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Customer Account ready:', customerAccount.name);

    // Inventory Account
    const inventoryAccount = await prisma.holderAccount.upsert({
      where: { 
        organizationId_code: {
          organizationId: orgId,
          code: '01-001-002'
        }
      },
      update: {},
      create: {
        organizationId: orgId,
        secondaryAccountId: secondaryAccount.id,
        code: '01-001-002',
        name: 'Inventory',
        description: 'Product inventory',
        balance: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Inventory Account ready:', inventoryAccount.name);

    // Sales Account (Revenue)
    const salesAccount = await prisma.holderAccount.upsert({
      where: { 
        organizationId_code: {
          organizationId: orgId,
          code: '02-001-001'
        }
      },
      update: {},
      create: {
        organizationId: orgId,
        secondaryAccountId: secondaryAccount.id,
        code: '02-001-001',
        name: 'Sales Revenue',
        description: 'Sales revenue account',
        balance: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Sales Account ready:', salesAccount.name);

    // Cost of Sales Account
    const costOfSalesAccount = await prisma.holderAccount.upsert({
      where: { 
        organizationId_code: {
          organizationId: orgId,
          code: '02-001-002'
        }
      },
      update: {},
      create: {
        organizationId: orgId,
        secondaryAccountId: secondaryAccount.id,
        code: '02-001-002',
        name: 'Cost of Sales',
        description: 'Cost of goods sold',
        balance: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Cost of Sales Account ready:', costOfSalesAccount.name);

    // Step 5: Create Test Products
    console.log('\n📋 Step 5: Creating Test Products...');
    
    const product1 = await prisma.product.upsert({
      where: { 
        organizationId_code: {
          organizationId: orgId,
          code: 'PROD-001'
        }
      },
      update: {},
      create: {
        organizationId: orgId,
        code: 'PROD-001',
        name: 'Test Product 1',
        description: 'A test product for sales testing',
        category: 'Test Category',
        unitPrice: 100.00,
        costPrice: 50.00,
        quantityOnHand: 100,
        reorderLevel: 10,
        isActive: true,
        inventoryAccountId: inventoryAccount.id,
        salesAccountId: salesAccount.id,
        costOfSalesAccountId: costOfSalesAccount.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Product 1 ready:', product1.name);

    const product2 = await prisma.product.upsert({
      where: { 
        organizationId_code: {
          organizationId: orgId,
          code: 'PROD-002'
        }
      },
      update: {},
      create: {
        organizationId: orgId,
        code: 'PROD-002',
        name: 'Test Product 2',
        description: 'Another test product for sales testing',
        category: 'Test Category',
        unitPrice: 200.00,
        costPrice: 100.00,
        quantityOnHand: 50,
        reorderLevel: 5,
        isActive: true,
        inventoryAccountId: inventoryAccount.id,
        salesAccountId: salesAccount.id,
        costOfSalesAccountId: costOfSalesAccount.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Product 2 ready:', product2.name);

    console.log('\n🎉 Test data setup complete!');
    console.log('\n📊 Created:');
    console.log('  ✅ Organization:', organization.name);
    console.log('  ✅ Primary Account:', primaryAccount.name);
    console.log('  ✅ Secondary Account:', secondaryAccount.name);
    console.log('  ✅ Customer Account:', customerAccount.name);
    console.log('  ✅ Inventory Account:', inventoryAccount.name);
    console.log('  ✅ Sales Account:', salesAccount.name);
    console.log('  ✅ Cost of Sales Account:', costOfSalesAccount.name);
    console.log('  ✅ Product 1:', product1.name);
    console.log('  ✅ Product 2:', product2.name);

    console.log('\n📝 Test Data IDs for API Testing:');
    console.log('  Product 1 ID:', product1.id);
    console.log('  Product 2 ID:', product2.id);
    console.log('  Customer Account ID:', customerAccount.id);

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData()
  .catch((e) => {
    console.error('❌ Setup failed:', e);
    process.exit(1);
  });












