const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTransactions() {
  try {
    const orgId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Check existing transactions
    const transactions = await prisma.transaction.findMany({
      where: { organizationId: orgId },
      select: { number: true, date: true },
      orderBy: { number: 'asc' },
      take: 20
    });

    console.log('Recent transactions:');
    transactions.forEach(t => {
      console.log(`  ${t.number} - ${new Date(t.date).toISOString().split('T')[0]}`);
    });

    // Check for duplicates
    const numbers = transactions.map(t => t.number);
    const uniqueNumbers = [...new Set(numbers)];
    if (numbers.length !== uniqueNumbers.length) {
      console.log('❌ Found duplicate transaction numbers!');
      const duplicates = numbers.filter((n, i) => numbers.indexOf(n) !== i);
      console.log('Duplicates:', [...new Set(duplicates)]);
    } else {
      console.log('✅ No duplicate transaction numbers found');
    }

    // Check today's transactions
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        date: {
          gte: new Date(today + 'T00:00:00Z'),
          lt: new Date(today + 'T23:59:59Z')
        }
      },
      select: { number: true },
      orderBy: { number: 'asc' }
    });

    console.log(`\nToday's transactions (${today}):`);
    todayTransactions.forEach(t => {
      console.log(`  ${t.number}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactions();

