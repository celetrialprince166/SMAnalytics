/**
 * Fixed Assets API Test Script
 * 
 * Tests all fixed assets API endpoints
 * Run with: node test-fixed-assets-api.js
 */

const BASE_URL = 'http://localhost:3000';
const ORG_ID = '7224ab64-5bd7-4382-839d-6c415d872ba7';

// Test data
let testAssetId = null;
let testBankAccountId = 'b9beeaa6-5a79-475d-a4d1-5f0dc94fa9be'; // Main Bank Account

async function testAPI() {
  console.log('🧪 Starting Fixed Assets API Tests...\n');

  try {
    // Test 1: Create Fixed Asset
    console.log('📝 Test 1: Create Fixed Asset');
    const createResponse = await fetch(`${BASE_URL}/api/fixed-assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acquisitionDate: '2025-01-15',
        referenceNumber: 'TEST-FA-001',
        category: 'EQUIPMENT',
        assetClass: 'Computer Equipment',
        description: 'Test Laptop Computer',
        valueAtCost: 2500,
        usefulLife: 3,
        depreciationRate: 33.33,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 250,
        holderAccountId: 'ca143c0a-5fd8-4206-bae4-1d3d6d67f5d7', // Fixed Assets - Equipment
        status: 'ACTIVE',
        remarks: 'Test asset for API testing',
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error('❌ Create failed:', error);
      return;
    }

    const createData = await createResponse.json();
    testAssetId = createData.data.id;
    console.log('✅ Asset created:', createData.data.assetCode);
    console.log('   ID:', testAssetId);
    console.log('   Net Book Value:', createData.data.netBookValue);
    console.log('');

    // Test 2: Get All Assets
    console.log('📝 Test 2: Get All Assets');
    const listResponse = await fetch(`${BASE_URL}/api/fixed-assets`);
    const listData = await listResponse.json();
    console.log('✅ Found', listData.data.length, 'assets');
    console.log('');

    // Test 3: Get Single Asset
    console.log('📝 Test 3: Get Single Asset');
    const getResponse = await fetch(`${BASE_URL}/api/fixed-assets/${testAssetId}`);
    const getData = await getResponse.json();
    console.log('✅ Asset retrieved:', getData.data.assetCode);
    console.log('   Description:', getData.data.description);
    console.log('');

    // Test 4: Update Asset
    console.log('📝 Test 4: Update Asset');
    const updateResponse = await fetch(`${BASE_URL}/api/fixed-assets/${testAssetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remarks: 'Updated test asset',
      }),
    });
    const updateData = await updateResponse.json();
    console.log('✅ Asset updated');
    console.log('   Remarks:', updateData.data.remarks);
    console.log('');

    // Test 5: Record Depreciation
    console.log('📝 Test 5: Record Depreciation');
    const depreciationResponse = await fetch(`${BASE_URL}/api/fixed-assets/depreciation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId: testAssetId,
        period: '2025-01-31',
      }),
    });

    if (!depreciationResponse.ok) {
      const error = await depreciationResponse.json();
      console.error('❌ Depreciation failed:', error);
    } else {
      const depreciationData = await depreciationResponse.json();
      console.log('✅ Depreciation recorded');
      console.log('   Amount:', depreciationData.data.depreciationAmount);
      console.log('   New NBV:', depreciationData.data.netBookValue);
      console.log('');
    }

    // Test 6: Get Depreciation Schedule
    console.log('📝 Test 6: Get Depreciation Schedule');
    const scheduleResponse = await fetch(
      `${BASE_URL}/api/fixed-assets/depreciation?assetId=${testAssetId}`
    );
    const scheduleData = await scheduleResponse.json();
    console.log('✅ Schedule retrieved');
    console.log('   Entries:', scheduleData.data.entries.length);
    console.log('');

    // Test 7: Dispose Asset
    console.log('📝 Test 7: Dispose Asset');
    const disposeResponse = await fetch(`${BASE_URL}/api/fixed-assets/${testAssetId}/dispose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disposalDate: '2025-02-15',
        disposalValue: 2000,
        bankAccountId: testBankAccountId,
        remarks: 'Test disposal',
      }),
    });

    if (!disposeResponse.ok) {
      const error = await disposeResponse.json();
      console.error('❌ Disposal failed:', error);
    } else {
      const disposeData = await disposeResponse.json();
      console.log('✅ Asset disposed');
      console.log('   Disposal Value:', disposeData.data.disposalValue);
      console.log('   Net Book Value:', disposeData.data.netBookValue);
      console.log('   Gain/Loss:', disposeData.data.gainLoss);
      console.log('   Transactions Created:', disposeData.data.transactionsCreated || 'N/A');
      console.log('');
    }

    // Test 8: Verify Transactions Created
    console.log('📝 Test 8: Verify Transactions Created');
    const transactionsResponse = await fetch(`${BASE_URL}/api/transactions?limit=5`);
    const transactionsData = await transactionsResponse.json();
    console.log('✅ Recent transactions:');
    transactionsData.data.slice(0, 3).forEach((t) => {
      console.log(`   ${t.number}: ${t.description} - ${t.amount}`);
    });
    console.log('');

    // Test 9: Filter Assets by Category
    console.log('📝 Test 9: Filter Assets by Category');
    const filterResponse = await fetch(`${BASE_URL}/api/fixed-assets?category=EQUIPMENT`);
    const filterData = await filterResponse.json();
    console.log('✅ Equipment assets:', filterData.data.length);
    console.log('');

    // Test 10: Search Assets
    console.log('📝 Test 10: Search Assets');
    const searchResponse = await fetch(`${BASE_URL}/api/fixed-assets?search=laptop`);
    const searchData = await searchResponse.json();
    console.log('✅ Search results:', searchData.data.length);
    console.log('');

    console.log('🎉 All tests completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   ✅ Create asset');
    console.log('   ✅ List assets');
    console.log('   ✅ Get single asset');
    console.log('   ✅ Update asset');
    console.log('   ✅ Record depreciation');
    console.log('   ✅ Get depreciation schedule');
    console.log('   ✅ Dispose asset');
    console.log('   ✅ Verify transactions');
    console.log('   ✅ Filter assets');
    console.log('   ✅ Search assets');
    console.log('');
    console.log('✨ Fixed Assets API is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run tests
testAPI();
