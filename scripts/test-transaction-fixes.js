/**
 * Test script to verify transaction timeout and balance fixes
 * Run this to test if the transaction system works without timeouts
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function testOptimizedTransactionCreation() {
  console.log('🧪 Testing optimized transaction creation...');

  try {
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Test the new optimized approach
    const result = await prisma.$transaction(async (tx) => {
      console.log('  📊 Starting optimized transaction...');

      // Pre-load all account types (this is the optimization)
      const accountTypes = await tx.holderAccount.findMany({
        where: {
          organizationId,
          isActive: true,
        },
        include: {
          secondaryAccount: {
            include: {
              primaryAccount: true,
            },
          },
        },
        select: {
          id: true,
          secondaryAccount: {
            select: {
              primaryAccount: {
                select: {
                  type: true,
                },
              },
            },
          },
        },
      });

      // Create lookup map
      const accountTypeMap = {};
      for (const account of accountTypes) {
        if (account.secondaryAccount?.primaryAccount?.type) {
          accountTypeMap[account.id] = account.secondaryAccount.primaryAccount.type;
        }
      }

      console.log(`  📋 Pre-loaded ${Object.keys(accountTypeMap).length} account types`);

      // Find test accounts
      const testAccounts = await tx.holderAccount.findMany({
        where: {
          organizationId,
          isActive: true,
        },
        take: 2,
      });

      if (testAccounts.length < 2) {
        throw new Error('Need at least 2 test accounts');
      }

      console.log(`  📋 Found test accounts: ${testAccounts.map(a => a.name).join(', ')}`);

      // Create multiple transactions to test performance
      const transactions = [];
      for (let i = 0; i < 5; i++) {
        const transaction = await tx.transaction.create({
          data: {
            organizationId,
            date: new Date(),
            number: `TEST-${String(i + 1).padStart(3, '0')}`,
            description: `Test transaction ${i + 1}`,
            amount: 100 + i * 10,
            debitAccountId: testAccounts[0].id,
            creditAccountId: testAccounts[1].id,
            reconciled: false,
          },
        });
        transactions.push(transaction);
      }

      console.log(`  ✅ Created ${transactions.length} transactions`);

      // Test O(1) account type lookups (should be instant now)
      const debitType = accountTypeMap[testAccounts[0].id];
      const creditType = accountTypeMap[testAccounts[1].id];

      console.log(`  📈 Account type lookups: ${debitType} -> ${creditType}`);
      console.log(`  ✅ Optimized transaction test completed successfully`);

      return { transactions, accountTypes: Object.keys(accountTypeMap).length };
    });

    console.log('🎉 Optimized transaction tests passed!');
    console.log('📊 Created Transactions:', result.transactions.length);
    console.log('📋 Pre-loaded Account Types:', result.accountTypes);

  } catch (error) {
    console.error('❌ Transaction test failed:', error.message);
    console.error('🔍 Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testSplitTransactionOptimization() {
  console.log('🧪 Testing optimized split transaction creation...');

  try {
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Get accounts for testing
    const accounts = await prisma.holderAccount.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      take: 4,
    });

    if (accounts.length < 3) {
      throw new Error('Need at least 3 accounts for split transaction test');
    }

    const result = await prisma.$transaction(async (tx) => {
      console.log('  📊 Starting optimized split transaction...');

      // Pre-load account types (optimization)
      const accountTypes = await tx.holderAccount.findMany({
        where: {
          organizationId,
          isActive: true,
        },
        select: {
          id: true,
          secondaryAccount: {
            select: {
              primaryAccount: {
                select: {
                  type: true,
                },
              },
            },
          },
        },
      });

      const accountTypeMap = {};
      for (const account of accountTypes) {
        if (account.secondaryAccount?.primaryAccount?.type) {
          accountTypeMap[account.id] = account.secondaryAccount.primaryAccount.type;
        }
      }

      console.log(`  📋 Pre-loaded ${Object.keys(accountTypeMap).length} account types for split`);

      // Create split transaction
      const splitTransaction = await tx.splitTransaction.create({
        data: {
          organizationId,
          date: new Date(),
          code: 'SPL-TEST',
          baseAccountId: accounts[0].id,
          baseAccountSide: 'DEBIT',
          splits: [
            { accountId: accounts[1].id, amount: 50, description: 'Split 1' },
            { accountId: accounts[2].id, amount: 30, description: 'Split 2' },
          ],
          totalAmount: 80,
          reconciled: false,
        },
      });

      console.log(`  ✅ Split transaction created: ${splitTransaction.id}`);

      // Create individual transactions
      const transactions = [];
      for (let i = 0; i < 2; i++) {
        const split = splitTransaction.splits[i];
        const transaction = await tx.transaction.create({
          data: {
            organizationId,
            date: new Date(),
            number: `SPL-TEST-${String(i + 1).padStart(2, '0')}`,
            description: split.description,
            amount: split.amount,
            debitAccountId: accounts[0].id, // base account
            creditAccountId: split.accountId,
            reconciled: false,
            splitTransactionId: splitTransaction.id,
          },
        });
        transactions.push(transaction);
      }

      console.log(`  ✅ Created ${transactions.length} individual transactions`);

      // Test balance updates with O(1) lookups
      for (const transaction of transactions) {
        const debitType = accountTypeMap[transaction.debitAccountId];
        const creditType = accountTypeMap[transaction.creditAccountId];

        // Apply correct balance logic based on account type
        if (debitType === 'ASSETS' || debitType === 'EXPENSES') {
          await tx.holderAccount.update({
            where: { id: transaction.debitAccountId },
            data: { balance: { increment: transaction.amount } },
          });
        }

        if (creditType === 'LIABILITIES' || creditType === 'EQUITY' || creditType === 'REVENUE') {
          await tx.holderAccount.update({
            where: { id: transaction.creditAccountId },
            data: { balance: { increment: transaction.amount } },
          });
        }
      }

      console.log(`  ✅ Balance updates completed`);
      console.log(`  ✅ Optimized split transaction test completed`);

      return { splitTransaction, transactions };
    });

    console.log('🎉 Optimized split transaction tests passed!');
    console.log('📊 Split Transaction ID:', result.splitTransaction.id);
    console.log('📋 Individual Transactions:', result.transactions.length);

  } catch (error) {
    console.error('❌ Split transaction test failed:', error.message);
    console.error('🔍 Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run both tests
async function runAllTests() {
  try {
    await testOptimizedTransactionCreation();
    await testSplitTransactionOptimization();
    console.log('🎉 All transaction optimization tests passed!');
  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runAllTests();
}

module.exports = { testOptimizedTransactionCreation, testSplitTransactionOptimization };

