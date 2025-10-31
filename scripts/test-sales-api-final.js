/**
 * Final Sales API CRUD Testing Script with Real Data
 * 
 * This script tests all CRUD operations using actual database data
 */

const baseUrl = 'http://localhost:3000/api';

// Test data IDs from the database
const TEST_DATA = {
  productId: 'b8e95f88-d8ee-4542-9682-c2b045e5c825',
  customerAccountId: '1f5ed77f-f08a-4c32-b7dc-937bd6d07216',
};

async function testSalesAPI() {
  console.log('🚀 Starting Final Sales API CRUD Testing...\n');
  console.log('📋 Using Test Data:');
  console.log('  Product ID:', TEST_DATA.productId);
  console.log('  Customer Account ID:', TEST_DATA.customerAccountId);
  console.log('');

  const results = {
    create: false,
    read: false,
    update: false,
    delete: false,
    validation: false,
  };

  let createdSalesId = null;

  try {
    // Test 1: CREATE - Create a new sales entry
    console.log('🔵 Test 1: CREATE Sales Entry...');
    const createData = {
      date: new Date().toISOString(),
      productId: TEST_DATA.productId,
      description: 'Test Sales Entry from Final API Test',
      salesValue: 1000.00,
      costValue: 500.00,
      customerAccountId: TEST_DATA.customerAccountId,
      applyVat: true,
      vatRate: 15.0,
    };

    const createResponse = await fetch(`${baseUrl}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createData),
    });

    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ CREATE successful:', createResult.data.salesCode);
      console.log('   Description:', createResult.data.description);
      console.log('   Sales Value:', createResult.data.salesValue);
      console.log('   VAT Amount:', createResult.data.vatAmount);
      console.log('   Total with VAT:', createResult.data.totalWithVat);
      createdSalesId = createResult.data.id;
      results.create = true;
    } else {
      const error = await createResponse.text();
      console.log('❌ CREATE failed:', createResponse.status, error);
    }

    // Test 2: READ - Get all sales entries
    console.log('\n🔵 Test 2: READ All Sales Entries...');
    const readResponse = await fetch(`${baseUrl}/sales`);
    
    if (readResponse.ok) {
      const readResult = await readResponse.json();
      console.log('✅ READ successful: Found', readResult.data.data.length, 'sales entries');
      if (readResult.data.data.length > 0) {
        console.log('   Latest entry:', readResult.data.data[0].salesCode);
      }
      results.read = true;
    } else {
      const error = await readResponse.text();
      console.log('❌ READ failed:', readResponse.status, error);
    }

    // Test 3: READ BY ID - Get specific sales entry
    if (createdSalesId) {
      console.log('\n🔵 Test 3: READ Sales Entry by ID...');
      const readByIdResponse = await fetch(`${baseUrl}/sales/${createdSalesId}`);
      
      if (readByIdResponse.ok) {
        const readByIdResult = await readByIdResponse.json();
        console.log('✅ READ BY ID successful:', readByIdResult.data.salesCode);
        console.log('   Description:', readByIdResult.data.description);
      } else {
        const error = await readByIdResponse.text();
        console.log('❌ READ BY ID failed:', readByIdResponse.status, error);
      }
    }

    // Test 4: UPDATE - Update the sales entry
    if (createdSalesId) {
      console.log('\n🔵 Test 4: UPDATE Sales Entry...');
      const updateData = {
        description: 'Updated Test Sales Entry - Final Test',
        salesValue: 1200.00,
        applyVat: false,
        vatRate: null,
        vatAmount: null,
        totalWithVat: null,
      };

      const updateResponse = await fetch(`${baseUrl}/sales/${createdSalesId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ UPDATE successful:', updateResult.data.salesCode);
        console.log('   New Description:', updateResult.data.description);
        console.log('   New Sales Value:', updateResult.data.salesValue);
        console.log('   VAT Applied:', updateResult.data.applyVat);
        results.update = true;
      } else {
        const error = await updateResponse.text();
        console.log('❌ UPDATE failed:', updateResponse.status, error);
      }
    }

    // Test 5: VALIDATION - Test validation errors
    console.log('\n🔵 Test 5: VALIDATION Errors...');
    const invalidData = {
      date: new Date().toISOString(),
      // Missing required fields
    };

    const validationResponse = await fetch(`${baseUrl}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    });

    if (validationResponse.status === 400) {
      console.log('✅ VALIDATION successful: Correctly rejected invalid data');
      results.validation = true;
    } else {
      console.log('❌ VALIDATION failed: Should have returned 400');
    }

    // Test 6: DELETE - Delete the sales entry
    if (createdSalesId) {
      console.log('\n🔵 Test 6: DELETE Sales Entry...');
      const deleteResponse = await fetch(`${baseUrl}/sales/${createdSalesId}`, {
        method: 'DELETE',
      });

      if (deleteResponse.ok) {
        console.log('✅ DELETE successful: Sales entry deleted');
        results.delete = true;
      } else {
        const error = await deleteResponse.text();
        console.log('❌ DELETE failed:', deleteResponse.status, error);
      }
    }

    // Test 7: Verify deletion
    if (createdSalesId && results.delete) {
      console.log('\n🔵 Test 7: Verify Deletion...');
      const verifyResponse = await fetch(`${baseUrl}/sales/${createdSalesId}`);
      
      if (verifyResponse.status === 404) {
        console.log('✅ DELETION VERIFICATION successful: Sales entry not found');
      } else {
        console.log('❌ DELETION VERIFICATION failed: Sales entry still exists');
      }
    }

    // Test Summary
    console.log('\n📊 Final Test Results Summary:');
    console.log('  CREATE:', results.create ? '✅ PASS' : '❌ FAIL');
    console.log('  READ:', results.read ? '✅ PASS' : '❌ FAIL');
    console.log('  UPDATE:', results.update ? '✅ PASS' : '❌ FAIL');
    console.log('  DELETE:', results.delete ? '✅ PASS' : '❌ FAIL');
    console.log('  VALIDATION:', results.validation ? '✅ PASS' : '❌ FAIL');

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL CRUD OPERATIONS WORKING PERFECTLY!');
      console.log('✅ Database setup complete');
      console.log('✅ API routes working');
      console.log('✅ All CRUD operations functional');
      console.log('✅ Validation working correctly');
      console.log('\n🚀 Ready for browser testing!');
    } else {
      console.log('⚠️  Some tests failed. Check the logs above.');
    }

  } catch (error) {
    console.error('❌ Test execution error:', error);
  }
}

// Run the tests
testSalesAPI();












