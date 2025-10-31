/**
 * Database Seeding Script
 * 
 * Creates initial data for development and testing
 * Includes organizations, users, and account hierarchies
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clean existing data (optional - remove in production)
    console.log('\n🧹 Cleaning existing data...');
    await prisma.holderAccount.deleteMany({});
    await prisma.secondaryAccount.deleteMany({});
    await prisma.primaryAccount.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    console.log('✅ Existing data cleaned');

    // Create test organization
    console.log('\n🏢 Creating test organization...');
    const organization = await prisma.organization.create({
      data: {
        name: 'SNM Analytics Demo',
        slug: 'snm-analytics-demo',
      },
    });
    console.log('✅ Organization created:', organization.name);

    // Create test user
    console.log('\n👤 Creating test user...');
    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        email: 'admin@snm-analytics.com',
        username: 'admin',
        passwordHash: '$2a$10$dummy.hash.for.testing.purposes.only', // Dummy hash
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('✅ User created:', user.email);

    // Create primary accounts
    console.log('\n📊 Creating primary accounts...');
    const primaryAccounts = await Promise.all([
      prisma.primaryAccount.create({
        data: {
          organizationId: organization.id,
          name: 'Assets',
          type: 'ASSETS',
          description: 'All asset accounts',
        },
      }),
      prisma.primaryAccount.create({
        data: {
          organizationId: organization.id,
          name: 'Liabilities',
          type: 'LIABILITIES',
          description: 'All liability accounts',
        },
      }),
      prisma.primaryAccount.create({
        data: {
          organizationId: organization.id,
          name: 'Equity',
          type: 'EQUITY',
          description: 'All equity accounts',
        },
      }),
      prisma.primaryAccount.create({
        data: {
          organizationId: organization.id,
          name: 'Revenue',
          type: 'REVENUE',
          description: 'All revenue accounts',
        },
      }),
      prisma.primaryAccount.create({
        data: {
          organizationId: organization.id,
          name: 'Expenses',
          type: 'EXPENSES',
          description: 'All expense accounts',
        },
      }),
    ]);
    console.log('✅ Primary accounts created:', primaryAccounts.length);

    // Create secondary accounts
    console.log('\n📋 Creating secondary accounts...');
    const secondaryAccounts = await Promise.all([
      // Assets
      prisma.secondaryAccount.create({
        data: {
          organizationId: organization.id,
          primaryAccountId: primaryAccounts[0].id, // Assets
          name: 'Current Assets',
          code: '01',
          description: 'Assets that can be converted to cash within one year',
        },
      }),
      prisma.secondaryAccount.create({
        data: {
          organizationId: organization.id,
          primaryAccountId: primaryAccounts[0].id, // Assets
          name: 'Fixed Assets',
          code: '02',
          description: 'Long-term assets',
        },
      }),
      // Liabilities
      prisma.secondaryAccount.create({
        data: {
          organizationId: organization.id,
          primaryAccountId: primaryAccounts[1].id, // Liabilities
          name: 'Current Liabilities',
          code: '03',
          description: 'Liabilities due within one year',
        },
      }),
      // Equity
      prisma.secondaryAccount.create({
        data: {
          organizationId: organization.id,
          primaryAccountId: primaryAccounts[2].id, // Equity
          name: 'Owner Equity',
          code: '04',
          description: 'Owner investment and retained earnings',
        },
      }),
      // Revenue
      prisma.secondaryAccount.create({
        data: {
          organizationId: organization.id,
          primaryAccountId: primaryAccounts[3].id, // Revenue
          name: 'Operating Revenue',
          code: '05',
          description: 'Revenue from core business operations',
        },
      }),
      // Expenses
      prisma.secondaryAccount.create({
        data: {
          organizationId: organization.id,
          primaryAccountId: primaryAccounts[4].id, // Expenses
          name: 'Operating Expenses',
          code: '06',
          description: 'Expenses from core business operations',
        },
      }),
    ]);
    console.log('✅ Secondary accounts created:', secondaryAccounts.length);

    // Create holder accounts
    console.log('\n🏦 Creating holder accounts...');
    const holderAccounts = await Promise.all([
      // Current Assets
      prisma.holderAccount.create({
        data: {
          organizationId: organization.id,
          secondaryAccountId: secondaryAccounts[0].id, // Current Assets
          code: '01-001-001',
          name: 'Cash',
          description: 'Cash on hand and in bank',
          balance: 10000.00,
        },
      }),
      prisma.holderAccount.create({
        data: {
          organizationId: organization.id,
          secondaryAccountId: secondaryAccounts[0].id, // Current Assets
          code: '01-001-002',
          name: 'Accounts Receivable',
          description: 'Money owed by customers',
          balance: 5000.00,
        },
      }),
      prisma.holderAccount.create({
        data: {
          organizationId: organization.id,
          secondaryAccountId: secondaryAccounts[0].id, // Current Assets
          code: '01-001-003',
          name: 'Inventory',
          description: 'Stock on hand',
          balance: 15000.00,
        },
      }),
      // Fixed Assets
      prisma.holderAccount.create({
        data: {
          organizationId: organization.id,
          secondaryAccountId: secondaryAccounts[1].id, // Fixed Assets
          code: '02-002-001',
          name: 'Equipment',
          description: 'Office equipment and machinery',
          balance: 25000.00,
        },
      }),
      prisma.holderAccount.create({
        data: {
          organizationId: organization.id,
          secondaryAccountId: secondaryAccounts[1].id, // Fixed Assets
          code: '02-002-002',
          name: 'Accumulated Depreciation - Equipment',
          description: 'Depreciation accumulated on equipment',
          balance: -5000.00,
        },
      }),
      // Current Liabilities
      prisma.holderAccount.create({
        data: {
          organizationId: organization.id,
          secondaryAccountId: secondaryAccounts[2].id, // Current Liabilities
          code: '03-003-001',
          name: 'Accounts Payable',
          description: 'Money owed to suppliers',
          balance: 3000.00,
        },
      }),
      // Owner Equity
      prisma.holderAccount.create({
        data: {
          organizationId: organization.id,
          secondaryAccountId: secondaryAccounts[3].id, // Owner Equity
          code: '04-004-001',
          name: 'Owner Investment',
          description: 'Initial owner investment',
          balance: 50000.00,
        },
      }),
      prisma.holderAccount.create({
        data: {
          organizationId: organization.id,
          secondaryAccountId: secondaryAccounts[3].id, // Owner Equity
          code: '04-004-002',
          name: 'Retained Earnings',
          description: 'Accumulated profits',
          balance: 10000.00,
        },
      }),
      // Operating Revenue
      prisma.holderAccount.create({
        data: {
          organizationId: organization.id,
          secondaryAccountId: secondaryAccounts[4].id, // Operating Revenue
          code: '05-005-001',
          name: 'Sales Revenue',
          description: 'Revenue from product sales',
          balance: 75000.00,
        },
      }),
      // Operating Expenses
      prisma.holderAccount.create({
        data: {
          organizationId: organization.id,
          secondaryAccountId: secondaryAccounts[5].id, // Operating Expenses
          code: '06-006-001',
          name: 'Salaries',
          description: 'Employee salaries and wages',
          balance: 20000.00,
        },
      }),
      prisma.holderAccount.create({
        data: {
          organizationId: organization.id,
          secondaryAccountId: secondaryAccounts[5].id, // Operating Expenses
          code: '06-006-002',
          name: 'Rent',
          description: 'Office rent expense',
          balance: 5000.00,
        },
      }),
    ]);
    console.log('✅ Holder accounts created:', holderAccounts.length);

    // Create some sample transactions
    console.log('\n💳 Creating sample transactions...');
    const transactions = await Promise.all([
      prisma.transaction.create({
        data: {
          organizationId: organization.id,
          date: new Date('2024-01-15'),
          number: 'TXN-001',
          description: 'Initial cash investment',
          amount: 50000.00,
          debitAccountId: holderAccounts[0].id, // Cash
          creditAccountId: holderAccounts[6].id, // Owner Investment
          reconciled: true,
        },
      }),
      prisma.transaction.create({
        data: {
          organizationId: organization.id,
          date: new Date('2024-01-20'),
          number: 'TXN-002',
          description: 'Equipment purchase',
          amount: 25000.00,
          debitAccountId: holderAccounts[3].id, // Equipment
          creditAccountId: holderAccounts[0].id, // Cash
          reconciled: true,
        },
      }),
      prisma.transaction.create({
        data: {
          organizationId: organization.id,
          date: new Date('2024-01-25'),
          number: 'TXN-003',
          description: 'Sales revenue',
          amount: 5000.00,
          debitAccountId: holderAccounts[0].id, // Cash
          creditAccountId: holderAccounts[8].id, // Sales Revenue
          reconciled: true,
        },
      }),
    ]);
    console.log('✅ Sample transactions created:', transactions.length);

    // Summary
    console.log('\n📊 Seeding Summary:');
    console.log(`✅ Organizations: 1`);
    console.log(`✅ Users: 1`);
    console.log(`✅ Primary Accounts: ${primaryAccounts.length}`);
    console.log(`✅ Secondary Accounts: ${secondaryAccounts.length}`);
    console.log(`✅ Holder Accounts: ${holderAccounts.length}`);
    console.log(`✅ Transactions: ${transactions.length}`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Test credentials:');
    console.log('Email: admin@snm-analytics.com');
    console.log('Password: (set up in Supabase Auth)');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seedDatabase();
