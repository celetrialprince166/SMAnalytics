const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test service lines table
    console.log('\n📋 Testing service_lines table...');
    const serviceLines = await prisma.serviceLine.findMany({
      where: { organizationId: '7224ab64-5bd7-4382-839d-6c415d872ba7' },
      take: 5
    });
    console.log(`✅ Found ${serviceLines.length} service lines:`, serviceLines.map(sl => sl.name));
    
    // Test products table
    console.log('\n📦 Testing products table...');
    const products = await prisma.product.findMany({
      where: { organizationId: '7224ab64-5bd7-4382-839d-6c415d872ba7' },
      take: 5
    });
    console.log(`✅ Found ${products.length} products:`, products.map(p => p.name));
    
    // Test clients table
    console.log('\n👥 Testing clients table...');
    const clients = await prisma.client.findMany({
      where: { organizationId: '7224ab64-5bd7-4382-839d-6c415d872ba7' },
      take: 5
    });
    console.log(`✅ Found ${clients.length} clients:`, clients.map(c => c.name));
    
    // Test holder accounts table
    console.log('\n🏦 Testing holder_accounts table...');
    const accounts = await prisma.holderAccount.findMany({
      where: { organizationId: '7224ab64-5bd7-4382-839d-6c415d872ba7' },
      take: 5
    });
    console.log(`✅ Found ${accounts.length} holder accounts:`, accounts.map(a => a.name));
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();










