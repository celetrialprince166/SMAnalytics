/**
 * Seed Accounts Data
 * 
 * Creates the exact account structure as specified:
 * - Primary Accounts with exact names and codes
 * - Secondary Accounts with exact names and codes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Primary Accounts - Exact names and codes as specified
const PRIMARY_ACCOUNTS = [
  { name: 'Non-current Assets', code: '01', tag: 'NCA', type: 'ASSETS' },
  { name: 'Current Assets', code: '02', tag: 'CAS', type: 'ASSETS' },
  { name: 'Equity', code: '03', tag: 'EQI', type: 'EQUITY' },
  { name: 'Non-current Liabilities', code: '04', tag: 'NCL', type: 'LIABILITIES' },
  { name: 'Current Liabilities', code: '05', tag: 'CLI', type: 'LIABILITIES' },
  { name: 'Direct Income', code: '06', tag: 'DIC', type: 'INCOME' },
  { name: 'Other Income', code: '07', tag: 'OIC', type: 'INCOME' },
  { name: 'Direct Costs', code: '08', tag: 'DCO', type: 'EXPENSES' },
  { name: 'Operating Expenses', code: '09', tag: 'OEX', type: 'EXPENSES' },
  { name: 'Tax Expenses', code: '10', tag: 'TEX', type: 'EXPENSES' },
  { name: 'Interest Expenses', code: '11', tag: 'IEX', type: 'EXPENSES' },
];

// Secondary Accounts - Exact names and codes as specified
const SECONDARY_ACCOUNTS = [
  // Non-current Assets (01)
  { primaryCode: '01', name: 'Property, Plant & Equipment', code: '01-01' },
  { primaryCode: '01', name: 'Intangible Assets', code: '01-02' },
  { primaryCode: '01', name: 'Deferred Tax Asset', code: '01-03' },
  { primaryCode: '01', name: 'Other Non-current Assets', code: '01-04' },
  
  // Current Assets (02)
  { primaryCode: '02', name: 'Cash & Bank Balances', code: '02-01' },
  { primaryCode: '02', name: 'Accounts Receivable', code: '02-02' },
  { primaryCode: '02', name: 'Short-term Investments', code: '02-03' },
  { primaryCode: '02', name: 'Short-term Advances', code: '02-04' },
  { primaryCode: '02', name: 'Other Current Assets', code: '02-05' },
  
  // Equity (03)
  { primaryCode: '03', name: 'Stated Capital', code: '03-01' },
  { primaryCode: '03', name: 'Shareholders Account', code: '03-02' },
  { primaryCode: '03', name: 'Retained Earnings', code: '03-03' },
  { primaryCode: '03', name: 'Dividend Paid', code: '03-04' },
  
  // Non-current Liabilities (04)
  { primaryCode: '04', name: 'Accumulated Depreciation', code: '04-01' },
  { primaryCode: '04', name: 'Provision for Amortization', code: '04-02' },
  { primaryCode: '04', name: 'Long-term Debt', code: '04-03' },
  { primaryCode: '04', name: 'Deferred Tax Liability', code: '04-04' },
  { primaryCode: '04', name: 'Shareholders Loan', code: '04-05' },
  { primaryCode: '04', name: 'Other Non-current Liabilities', code: '04-06' },
  
  // Current Liabilities (05)
  { primaryCode: '05', name: 'Accounts Payable', code: '05-01' },
  { primaryCode: '05', name: 'Tax Payable', code: '05-02' },
  { primaryCode: '05', name: 'Accruals', code: '05-03' },
  { primaryCode: '05', name: 'Short-term Debt', code: '05-04' },
  { primaryCode: '05', name: 'Other Current Liabilities', code: '05-05' },
  
  // Direct Income (06)
  { primaryCode: '06', name: 'Sales', code: '06-01' },
  
  // Other Income (07)
  { primaryCode: '07', name: 'Other Income', code: '07-01' },
  { primaryCode: '07', name: 'Interest Income', code: '07-02' },
  { primaryCode: '07', name: 'Gain/(Loss) on Asset Disposal', code: '07-03' },
  
  // Direct Costs (08)
  { primaryCode: '08', name: 'Cost of Sales', code: '08-01' },
  { primaryCode: '08', name: 'Gifts & Promotions', code: '08-02' },
  
  // Operating Expenses (09)
  { primaryCode: '09', name: 'Staff Costs', code: '09-01' },
  { primaryCode: '09', name: 'Rental Costs', code: '09-02' },
  { primaryCode: '09', name: 'Selling, General & Admin Expenses', code: '09-03' },
  { primaryCode: '09', name: 'Marketing & Advertisement Costs', code: '09-04' },
  { primaryCode: '09', name: 'Taxes & Levies', code: '09-05' },
  { primaryCode: '09', name: 'Depreciation & Amortization', code: '09-06' },
  { primaryCode: '09', name: 'Insurance Costs', code: '09-07' },
  { primaryCode: '09', name: 'Other Operating Expenses', code: '09-08' },
  
  // Tax Expenses (10)
  { primaryCode: '10', name: 'Corporate Tax', code: '10-01' },
  { primaryCode: '10', name: 'Deferred Tax', code: '10-02' },
  
  // Interest Expenses (11)
  { primaryCode: '11', name: 'Interest Expenses', code: '11-01' },
];

async function seedAccounts(organizationId: string) {
  console.log('🌱 Seeding accounts for organization:', organizationId);

  // Clear existing accounts for this organization (in correct order due to foreign keys)
  console.log('🧹 Clearing existing accounts...');
  
  // First delete transactions that reference holder accounts
  console.log('  → Deleting transactions...');
  await prisma.transaction.deleteMany({
    where: {
      OR: [
        { debitAccountId: { in: (await prisma.holderAccount.findMany({ where: { organizationId }, select: { id: true } })).map(a => a.id) } },
        { creditAccountId: { in: (await prisma.holderAccount.findMany({ where: { organizationId }, select: { id: true } })).map(a => a.id) } }
      ]
    }
  });
  
  // Then delete holder accounts
  console.log('  → Deleting holder accounts...');
  await prisma.holderAccount.deleteMany({
    where: { organizationId },
  });
  
  // Then delete secondary accounts
  console.log('  → Deleting secondary accounts...');
  await prisma.secondaryAccount.deleteMany({
    where: { organizationId },
  });
  
  // Finally delete primary accounts
  console.log('  → Deleting primary accounts...');
  await prisma.primaryAccount.deleteMany({
    where: { organizationId },
  });

  // Create primary accounts
  console.log('📝 Creating primary accounts...');
  const primaryAccountMap = new Map<string, string>();
  
  for (const pa of PRIMARY_ACCOUNTS) {
    const created = await prisma.primaryAccount.create({
      data: {
        organizationId,
        name: pa.name,
        type: pa.type as any,
        description: `${pa.name} (${pa.tag})`,
        isActive: true,
      },
    });
    primaryAccountMap.set(pa.code, created.id);
    console.log(`  ✓ ${pa.code} - ${pa.name}`);
  }

  // Create secondary accounts
  console.log('\n📝 Creating secondary accounts...');
  const secondaryAccountMap = new Map<string, string>();
  
  for (const sa of SECONDARY_ACCOUNTS) {
    const primaryAccountId = primaryAccountMap.get(sa.primaryCode);
    if (!primaryAccountId) {
      console.error(`  ✗ Primary account not found for code: ${sa.primaryCode}`);
      continue;
    }

    const created = await prisma.secondaryAccount.create({
      data: {
        organizationId,
        primaryAccountId,
        name: sa.name,
        code: sa.code,
        description: `${sa.name}`,
        isActive: true,
      },
    });
    secondaryAccountMap.set(sa.code, created.id);
    console.log(`  ✓ ${sa.code} - ${sa.name}`);
  }

  console.log('\n✅ Account seeding complete!');
  console.log(`   - ${PRIMARY_ACCOUNTS.length} primary accounts created`);
  console.log(`   - ${SECONDARY_ACCOUNTS.length} secondary accounts created`);

  return {
    primaryAccounts: primaryAccountMap.size,
    secondaryAccounts: secondaryAccountMap.size,
  };
}

async function main() {
  try {
    console.log('🚀 Starting account seeding process...');
    
    // Test database connection
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✓ Database connected successfully');
    
    // Get the first organization or create a default one
    console.log('📦 Looking for existing organization...');
    let organization = await prisma.organization.findFirst();
    
    if (!organization) {
      console.log('📦 Creating default organization...');
      organization = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default',
          isActive: true,
        },
      });
      console.log(`   ✓ Organization created: ${organization.name}`);
    } else {
      console.log(`✓ Found organization: ${organization.name}`);
    }

    await seedAccounts(organization.id);

  } catch (error) {
    console.error('❌ Error seeding accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in other scripts
export { seedAccounts, PRIMARY_ACCOUNTS, SECONDARY_ACCOUNTS };

// Run if executed directly
if (process.argv[1] && process.argv[1].includes('seed-accounts.ts')) {
  main()
    .then(() => {
      console.log('\n🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seeding failed:', error);
      process.exit(1);
    });
}

