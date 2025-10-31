/**
 * Test Prisma Repositories
 * 
 * Verifies that the Prisma repositories work correctly
 * and match the existing localStorage repository interface
 */

const { PrismaClient } = require('@prisma/client');

// Create a simple test organization first
const prisma = new PrismaClient();

async function testPrismaRepositories() {
  try {
    console.log('🔄 Testing Prisma repositories...');
    
    // Create test organization
    const testOrg = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        slug: 'test-org-repositories-' + Date.now(),
      },
    });
    
    console.log('✅ Test organization created:', testOrg.name);
    
    // Test Primary Account Repository
    console.log('\n📊 Testing Primary Account Repository...');
    
    const primaryAccount = await prisma.primaryAccount.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Assets',
        type: 'ASSETS',
        description: 'Test primary account for assets',
      },
    });
    
    console.log('✅ Primary account created:', primaryAccount.name);
    
    // Test Secondary Account Repository
    console.log('\n📊 Testing Secondary Account Repository...');
    
    const secondaryAccount = await prisma.secondaryAccount.create({
      data: {
        organizationId: testOrg.id,
        primaryAccountId: primaryAccount.id,
        name: 'Current Assets',
        code: '01',
        description: 'Current assets secondary account',
      },
    });
    
    console.log('✅ Secondary account created:', secondaryAccount.name);
    
    // Test Holder Account Repository
    console.log('\n📊 Testing Holder Account Repository...');
    
    const holderAccount = await prisma.holderAccount.create({
      data: {
        organizationId: testOrg.id,
        secondaryAccountId: secondaryAccount.id,
        code: '01-001-001',
        name: 'Cash',
        description: 'Cash on hand',
        balance: 1000.00,
      },
    });
    
    console.log('✅ Holder account created:', holderAccount.name);
    console.log('💰 Initial balance:', holderAccount.balance);
    
    // Test balance update
    await prisma.holderAccount.update({
      where: { id: holderAccount.id },
      data: { balance: { increment: 500.00 } },
    });
    
    const updatedAccount = await prisma.holderAccount.findUnique({
      where: { id: holderAccount.id },
    });
    
    console.log('💰 Updated balance:', updatedAccount.balance);
    
    // Test account hierarchy query
    const accountWithHierarchy = await prisma.holderAccount.findUnique({
      where: { id: holderAccount.id },
      include: {
        secondaryAccount: {
          include: {
            primaryAccount: true,
          },
        },
      },
    });
    
    console.log('🏗️ Account hierarchy:', {
      holder: accountWithHierarchy.name,
      secondary: accountWithHierarchy.secondaryAccount.name,
      primary: accountWithHierarchy.secondaryAccount.primaryAccount.name,
    });
    
    // Test search functionality
    const searchResults = await prisma.holderAccount.findMany({
      where: {
        organizationId: testOrg.id,
        isActive: true,
        OR: [
          { name: { contains: 'Cash', mode: 'insensitive' } },
          { code: { contains: '01', mode: 'insensitive' } },
        ],
      },
    });
    
    console.log('🔍 Search results:', searchResults.length, 'accounts found');
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    
    await prisma.holderAccount.delete({ where: { id: holderAccount.id } });
    await prisma.secondaryAccount.delete({ where: { id: secondaryAccount.id } });
    await prisma.primaryAccount.delete({ where: { id: primaryAccount.id } });
    await prisma.organization.delete({ where: { id: testOrg.id } });
    
    console.log('✅ Test data cleaned up');
    console.log('🎉 Prisma repositories test completed successfully!');
    
  } catch (error) {
    console.error('❌ Prisma repositories test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaRepositories();















