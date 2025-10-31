/**
 * Test Prisma Client Connection
 * 
 * Verifies that the Prisma client can connect to the database
 * and perform basic operations
 */

import { prisma } from '../lib/prisma/client';

async function testPrismaConnection() {
  try {
    console.log('🔄 Testing Prisma client connection...');
    
    // Test raw query
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Prisma raw query successful!');
    
    // Test organization count
    const orgCount = await prisma.organization.count();
    console.log(`📊 Organizations in database: ${orgCount}`);
    
    // Test creating a test organization
    const testOrg = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        slug: 'test-org-' + Date.now(),
      },
    });
    console.log('✅ Test organization created:', testOrg.name);
    
    // Clean up test data
    await prisma.organization.delete({
      where: { id: testOrg.id },
    });
    console.log('✅ Test organization cleaned up');
    
    console.log('🎉 Prisma client test completed successfully!');
    
  } catch (error) {
    console.error('❌ Prisma client test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();
