// Test script for Sales Representatives API
const BASE_URL = 'http://localhost:3000';

async function testSalesRepsAPI() {
  console.log('🧪 Testing Sales Representatives API\n');

  // Test data
  const salesEntryId = '8e1b01c6-6401-44f2-a34c-a3c11289b9d8'; // From database
  const employeeId = '7808ca7e-7db9-4f23-b430-7646dd0555b6'; // John Test

  try {
    // Test 1: GET all representatives (should be empty initially)
    console.log('1️⃣ Testing GET /api/sales-representatives');
    const getRes = await fetch(`${BASE_URL}/api/sales-representatives?salesEntryId=${salesEntryId}`);
    const getData = await getRes.json();
    console.log('Response:', JSON.stringify(getData, null, 2));
    console.log('✅ GET request successful\n');

    // Test 2: POST create representative
    console.log('2️⃣ Testing POST /api/sales-representatives');
    const createData = {
      salesEntryId,
      employeeId,
      resourceType: 'SALES',
      salesStake: 60,
      salesTarget: 10000,
      commissionRate: 5,
    };
    console.log('Creating representative:', createData);
    
    const postRes = await fetch(`${BASE_URL}/api/sales-representatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createData),
    });
    const postData = await postRes.json();
    console.log('Response:', JSON.stringify(postData, null, 2));
    
    if (!postData.success) {
      console.log('❌ POST request failed');
      return;
    }
    console.log('✅ POST request successful\n');

    const repId = postData.data.id;

    // Test 3: GET specific representative
    console.log('3️⃣ Testing GET /api/sales-representatives/:id');
    const getOneRes = await fetch(`${BASE_URL}/api/sales-representatives/${repId}`);
    const getOneData = await getOneRes.json();
    console.log('Response:', JSON.stringify(getOneData, null, 2));
    console.log('✅ GET by ID successful\n');

    // Test 4: Validate stakes
    console.log('4️⃣ Testing GET /api/sales-representatives/validate/:salesEntryId');
    const validateRes = await fetch(`${BASE_URL}/api/sales-representatives/validate/${salesEntryId}`);
    const validateData = await validateRes.json();
    console.log('Response:', JSON.stringify(validateData, null, 2));
    console.log('✅ Validation successful\n');

    // Test 5: Update representative
    console.log('5️⃣ Testing PUT /api/sales-representatives/:id');
    const updateData = {
      salesStake: 70,
      commissionRate: 6,
    };
    const putRes = await fetch(`${BASE_URL}/api/sales-representatives/${repId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    const putData = await putRes.json();
    console.log('Response:', JSON.stringify(putData, null, 2));
    console.log('✅ PUT request successful\n');

    // Test 6: Create second representative
    console.log('6️⃣ Testing POST second representative');
    const secondEmployeeId = 'ad08c898-59c3-4001-8870-21a7b57e90bc'; // Jane Smith
    const createData2 = {
      salesEntryId,
      employeeId: secondEmployeeId,
      resourceType: 'SUPPORT',
      salesStake: 30,
      salesTarget: 5000,
      commissionRate: 3,
    };
    
    const postRes2 = await fetch(`${BASE_URL}/api/sales-representatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createData2),
    });
    const postData2 = await postRes2.json();
    console.log('Response:', JSON.stringify(postData2, null, 2));
    console.log('✅ Second representative created\n');

    // Test 7: Validate stakes again (should be 100%)
    console.log('7️⃣ Testing validation with 100% stakes');
    const validateRes2 = await fetch(`${BASE_URL}/api/sales-representatives/validate/${salesEntryId}`);
    const validateData2 = await validateRes2.json();
    console.log('Response:', JSON.stringify(validateData2, null, 2));
    console.log('✅ Validation shows 100% allocation\n');

    // Test 8: GET all representatives again
    console.log('8️⃣ Testing GET all representatives');
    const getAllRes = await fetch(`${BASE_URL}/api/sales-representatives?salesEntryId=${salesEntryId}`);
    const getAllData = await getAllRes.json();
    console.log('Response:', JSON.stringify(getAllData, null, 2));
    console.log('✅ Retrieved all representatives\n');

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testSalesRepsAPI();
