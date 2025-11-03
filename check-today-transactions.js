const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTodayTransactions() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTxns = await prisma.transaction.findMany({
      where: {
        organizationId: '7224ab64-5bd7-4382-839d-6c415d872ba7',
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        number: true,
        date: true,
        description: true
      }
    });

    console.log('\n=== Today\'s Transactions ===');
    console.log(`Count: ${todayTxns.length}`);
    todayTxns.forEach(t => console.log(`  ${t.number} - ${t.description}`));

    // Check for number "1.00"
    const onePointZero = await prisma.transaction.findFirst({
      where: {
        organizationId: '7224ab64-5bd7-4382-839d-6c415d872ba7',
        number: '1.00'
      },
      select: {
        number: true,
        date: true,
        description: true
      }
    });

    console.log('\n=== Transaction with number "1.00" ===');
    if (onePointZero) {
      console.log(`Found: ${onePointZero.number} - ${onePointZero.date} - ${onePointZero.description}`);
    } else {
      console.log('Not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodayTransactions();
