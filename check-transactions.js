const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransactions() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        organizationId: '7224ab64-5bd7-4382-839d-6c415d872ba7'
      },
      select: {
        number: true,
        date: true,
        description: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    console.log('\n=== Recent Transactions ===');
    console.log(`Total found: ${transactions.length}\n`);
    
    transactions.forEach((t, i) => {
      console.log(`${i + 1}. Number: ${t.number} | Date: ${t.date.toISOString().split('T')[0]} | Desc: ${t.description}`);
    });

    // Check for today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = await prisma.transaction.findMany({
      where: {
        organizationId: '7224ab64-5bd7-4382-839d-6c415d872ba7',
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        number: true
      },
      orderBy: {
        number: 'desc'
      }
    });

    console.log(`\n=== Today's Transactions ===`);
    console.log(`Count: ${todayTransactions.length}`);
    todayTransactions.forEach(t => console.log(`  - ${t.number}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactions();
