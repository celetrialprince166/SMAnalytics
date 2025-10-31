/**
 * Validate Account Structure Script
 * 
 * Validates that all accounts in the database match the exact specification
 * Run with: npx ts-node scripts/validate-account-structure.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Expected structure from specification
const EXPECTED_PRIMARY = [
  { name: 'Non-current Assets', code: '01', tag: 'NCA' },
  { name: 'Current Assets', code: '02', tag: 'CAS' },
  { name: 'Equity', code: '03', tag: 'EQI' },
  { name: 'Non-current Liabilities', code: '04', tag: 'NCL' },
  { name: 'Current Liabilities', code: '05', tag: 'CLI' },
  { name: 'Direct Income', code: '06', tag: 'DIC' },
  { name: 'Other Income', code: '07', tag: 'OIC' },
  { name: 'Direct Costs', code: '08', tag: 'DCO' },
  { name: 'Operating Expenses', code: '09', tag: 'OEX' },
  { name: 'Tax Expenses', code: '10', tag: 'TEX' },
  { name: 'Interest Expenses', code: '11', tag: 'IEX' },
];

const EXPECTED_SECONDARY: Record<string, Array<{ name: string; code: string }>> = {
  '01': [
    { name: 'Property, Plant & Equipment', code: '01-01' },
    { name: 'Intangible Assets', code: '01-02' },
    { name: 'Deferred Tax Asset', code: '01-03' },
    { name: 'Other Non-current Assets', code: '01-04' },
  ],
  '02': [
    { name: 'Cash & Bank Balances', code: '02-01' },
    { name: 'Accounts Receivable', code: '02-02' },
    { name: 'Short-term Investments', code: '02-03' },
    { name: 'Short-term Advances', code: '02-04' },
    { name: 'Other Current Assets', code: '02-05' },
  ],
  '03': [
    { name: 'Stated Capital', code: '03-01' },
    { name: 'Shareholders Account', code: '03-02' },
    { name: 'Retained Earnings', code: '03-03' },
    { name: 'Dividend Paid', code: '03-04' },
  ],
  '04': [
    { name: 'Accumulated Depreciation', code: '04-01' },
    { name: 'Provision for Amortization', code: '04-02' },
    { name: 'Long-term Debt', code: '04-03' },
    { name: 'Deferred Tax Liability', code: '04-04' },
    { name: 'Shareholders Loan', code: '04-05' },
    { name: 'Other Non-current Liabilities', code: '04-06' },
  ],
  '05': [
    { name: 'Accounts Payable', code: '05-01' },
    { name: 'Tax Payable', code: '05-02' },
    { name: 'Accruals', code: '05-03' },
    { name: 'Short-term Debt', code: '05-04' },
    { name: 'Other Current Liabilities', code: '05-05' },
  ],
  '06': [
    { name: 'Sales', code: '06-01' },
  ],
  '07': [
    { name: 'Other Income', code: '07-01' },
    { name: 'Interest Income', code: '07-02' },
    { name: 'Gain/(Loss) on Asset Disposal', code: '07-03' },
  ],
  '08': [
    { name: 'Cost of Sales', code: '08-01' },
    { name: 'Gifts & Promotions', code: '08-02' },
  ],
  '09': [
    { name: 'Staff Costs', code: '09-01' },
    { name: 'Rental Costs', code: '09-02' },
    { name: 'Selling, General & Admin Expenses', code: '09-03' },
    { name: 'Marketing & Advertisement Costs', code: '09-04' },
    { name: 'Taxes & Levies', code: '09-05' },
    { name: 'Depreciation & Amortization', code: '09-06' },
    { name: 'Insurance Costs', code: '09-07' },
    { name: 'Other Operating Expenses', code: '09-08' },
  ],
  '10': [
    { name: 'Corporate Tax', code: '10-01' },
    { name: 'Deferred Tax', code: '10-02' },
  ],
  '11': [
    { name: 'Interest Expenses', code: '11-01' },
  ],
};

async function validateStructure() {
  console.log('\n📋 Validating Account Structure\n');
  console.log('='.repeat(70));

  let allValid = true;
  let totalErrors = 0;

  try {
    // Get organization
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('❌ No organization found!');
      return false;
    }

    console.log(`\n✓ Using organization: ${organization.name}`);
    console.log('='.repeat(70));

    // Validate Primary Accounts
    console.log('\n📊 PRIMARY ACCOUNTS');
    console.log('-'.repeat(70));

    const primaryAccounts = await prisma.primaryAccount.findMany({
      where: { organizationId: organization.id },
      orderBy: { name: 'asc' },
    });

    console.log(`Found ${primaryAccounts.length} primary accounts (expected ${EXPECTED_PRIMARY.length})\n`);

    for (const expected of EXPECTED_PRIMARY) {
      const actual = primaryAccounts.find(a => a.name === expected.name);
      
      if (!actual) {
        console.log(`❌ Missing: ${expected.code} - ${expected.name}`);
        allValid = false;
        totalErrors++;
      } else if (actual.name !== expected.name) {
        console.log(`❌ Name mismatch for ${expected.code}:`);
        console.log(`   Expected: ${expected.name}`);
        console.log(`   Got:      ${actual.name}`);
        allValid = false;
        totalErrors++;
      } else {
        console.log(`✓ ${expected.code} - ${actual.name}`);
      }
    }

    // Check for extra primary accounts
    for (const actual of primaryAccounts) {
      const expected = EXPECTED_PRIMARY.find(e => e.name === actual.name);
      if (!expected) {
        console.log(`⚠️  Unexpected primary account: ${actual.name}`);
        totalErrors++;
      }
    }

    // Validate Secondary Accounts
    console.log('\n📊 SECONDARY ACCOUNTS');
    console.log('-'.repeat(70));

    const secondaryAccounts = await prisma.secondaryAccount.findMany({
      where: { organizationId: organization.id },
      orderBy: { code: 'asc' },
      include: { primaryAccount: true },
    });

    let totalExpectedSecondary = 0;
    Object.values(EXPECTED_SECONDARY).forEach(arr => {
      totalExpectedSecondary += arr.length;
    });

    console.log(`Found ${secondaryAccounts.length} secondary accounts (expected ${totalExpectedSecondary})\n`);

    for (const [primaryCode, expectedSecondaries] of Object.entries(EXPECTED_SECONDARY)) {
      const expectedPrimary = EXPECTED_PRIMARY.find(p => p.code === primaryCode);
      if (!expectedPrimary) {
        console.log(`❌ Expected primary account ${primaryCode} not found in specification`);
        allValid = false;
        continue;
      }
      
      const primaryAccount = primaryAccounts.find(p => p.name === expectedPrimary.name);
      if (!primaryAccount) {
        console.log(`❌ Primary account ${primaryCode} (${expectedPrimary.name}) not found for secondary accounts`);
        allValid = false;
        continue;
      }

      console.log(`\n  ${primaryCode} - ${primaryAccount.name}:`);

      for (const expected of expectedSecondaries) {
        const actual = secondaryAccounts.find(a => a.code === expected.code);
        
        if (!actual) {
          console.log(`  ❌ Missing: ${expected.code} - ${expected.name}`);
          allValid = false;
          totalErrors++;
        } else if (actual.name !== expected.name) {
          console.log(`  ❌ Name mismatch for ${expected.code}:`);
          console.log(`     Expected: ${expected.name}`);
          console.log(`     Got:      ${actual.name}`);
          allValid = false;
          totalErrors++;
        } else if (actual.primaryAccountId !== primaryAccount.id) {
          console.log(`  ❌ Wrong parent for ${expected.code}: ${actual.name}`);
          allValid = false;
          totalErrors++;
        } else {
          console.log(`  ✓ ${actual.code} - ${actual.name}`);
        }
      }
    }

    // Check for extra secondary accounts
    for (const actual of secondaryAccounts) {
      const primaryCode = actual.code.split('-')[0];
      const expectedList = EXPECTED_SECONDARY[primaryCode] || [];
      const expected = expectedList.find(e => e.code === actual.code);
      
      if (!expected) {
        console.log(`⚠️  Unexpected secondary account: ${actual.code} - ${actual.name}`);
        totalErrors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('-'.repeat(70));

    if (allValid && totalErrors === 0) {
      console.log('✅ All accounts match the specification perfectly!');
      console.log(`   - ${primaryAccounts.length} primary accounts`);
      console.log(`   - ${secondaryAccounts.length} secondary accounts`);
      console.log('='.repeat(70) + '\n');
      return true;
    } else {
      console.log(`❌ Validation failed with ${totalErrors} error(s)`);
      console.log('='.repeat(70) + '\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Validation error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
validateStructure()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

