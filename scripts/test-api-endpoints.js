/**
 * API Endpoints Test Script
 * 
 * Tests all API endpoints to ensure they work correctly
 */

require('dotenv').config();

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const TEST_ORGANIZATION_ID = 'test-org-id';
const TEST_AUTH_TOKEN = 'test-auth-token';

// Test data
const testData = {
  organization: {
    name: 'Test Organization',
    slug: 'test-org-' + Date.now(),
    isActive: true,
  },
  primaryAccount: {
    name: 'Test Assets',
    code: '01',
    type: 'ASSETS',
    description: 'Test asset accounts',
    isActive: true,
    organizationId: TEST_ORGANIZATION_ID,
  },
  secondaryAccount: {
    name: 'Test Current Assets',
    code: '001',
    description: 'Test current asset accounts',
    isActive: true,
    organizationId: TEST_ORGANIZATION_ID,
    primaryAccountId: 'primary-account-id',
  },
  holderAccount: {
    name: 'Test Cash',
    code: '01-001-001',
    description: 'Test cash account',
    balance: 0,
    isActive: true,
    organizationId: TEST_ORGANIZATION_ID,
    secondaryAccountId: 'secondary-account-id',
  },
  transaction: {
    number: 'TXN-' + Date.now(),
    date: new Date().toISOString(),
    description: 'Test transaction',
    amount: 1000.00,
    reconciled: false,
    organizationId: TEST_ORGANIZATION_ID,
    debitAccountId: 'holder-account-id',
    creditAccountId: 'holder-account-id-2',
  },
  product: {
    name: 'Test Product',
    description: 'Test product description',
    sku: 'SKU-' + Date.now(),
    unitPrice: 100.00,
    unitCost: 50.00,
    category: 'Test Category',
    isActive: true,
    organizationId: TEST_ORGANIZATION_ID,
  },
  salesEntry: {
    date: new Date().toISOString(),
    customerName: 'Test Customer',
    totalAmount: 1000.00,
    organizationId: TEST_ORGANIZATION_ID,
    items: [
      {
        productId: 'product-id',
        quantity: 2,
        unitPrice: 500.00,
        totalPrice: 1000.00,
      },
    ],
  },
  client: {
    name: 'Test Client',
    email: 'test@example.com',
    phone: '+1234567890',
    address: 'Test Address',
    isActive: true,
    organizationId: TEST_ORGANIZATION_ID,
  },
  employee: {
    name: 'Test Employee',
    email: 'employee@example.com',
    phone: '+1234567890',
    position: 'Manager',
    hireDate: new Date().toISOString(),
    isActive: true,
    organizationId: TEST_ORGANIZATION_ID,
  },
  fixedAsset: {
    name: 'Test Computer',
    description: 'Test computer asset',
    category: 'IT Equipment',
    purchaseDate: new Date().toISOString(),
    purchasePrice: 1000.00,
    usefulLife: 36,
    depreciationMethod: 'STRAIGHT_LINE',
    isActive: true,
    organizationId: TEST_ORGANIZATION_ID,
  },
  companySettings: {
    companyName: 'Test Company',
    address: 'Test Address',
    phone: '+1234567890',
    email: 'company@example.com',
    website: 'https://test.com',
    fiscalYearStart: new Date().toISOString(),
    currency: 'USD',
    organizationId: TEST_ORGANIZATION_ID,
  },
};

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: [],
};

// Helper function to make API requests
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_AUTH_TOKEN}`,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();

  return {
    status: response.status,
    data,
    success: response.ok,
  };
}

// Test function
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🧪 Testing: ${testName}`);
  
  try {
    await testFunction();
    testResults.passed++;
    console.log(`✅ ${testName} - PASSED`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    console.log(`❌ ${testName} - FAILED: ${error.message}`);
  }
}

// Test functions
async function testOrganizations() {
  // Test GET /api/organizations
  const listResponse = await makeRequest('/api/organizations?page=1&limit=10');
  if (!listResponse.success) throw new Error(`Failed to list organizations: ${listResponse.data.message}`);

  // Test POST /api/organizations
  const createResponse = await makeRequest('/api/organizations', {
    method: 'POST',
    body: JSON.stringify(testData.organization),
  });
  if (!createResponse.success) throw new Error(`Failed to create organization: ${createResponse.data.message}`);

  const orgId = createResponse.data.data.id;

  // Test GET /api/organizations/{id}
  const getResponse = await makeRequest(`/api/organizations/${orgId}`);
  if (!getResponse.success) throw new Error(`Failed to get organization: ${getResponse.data.message}`);

  // Test PUT /api/organizations/{id}
  const updateResponse = await makeRequest(`/api/organizations/${orgId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Updated Organization' }),
  });
  if (!updateResponse.success) throw new Error(`Failed to update organization: ${updateResponse.data.message}`);

  // Test DELETE /api/organizations/{id}
  const deleteResponse = await makeRequest(`/api/organizations/${orgId}`, {
    method: 'DELETE',
  });
  if (!deleteResponse.success) throw new Error(`Failed to delete organization: ${deleteResponse.data.message}`);
}

async function testPrimaryAccounts() {
  // Test GET /api/accounts/primary
  const listResponse = await makeRequest('/api/accounts/primary?page=1&limit=10');
  if (!listResponse.success) throw new Error(`Failed to list primary accounts: ${listResponse.data.message}`);

  // Test POST /api/accounts/primary
  const createResponse = await makeRequest('/api/accounts/primary', {
    method: 'POST',
    body: JSON.stringify(testData.primaryAccount),
  });
  if (!createResponse.success) throw new Error(`Failed to create primary account: ${createResponse.data.message}`);

  const accountId = createResponse.data.data.id;

  // Test GET /api/accounts/primary/{id}
  const getResponse = await makeRequest(`/api/accounts/primary/${accountId}`);
  if (!getResponse.success) throw new Error(`Failed to get primary account: ${getResponse.data.message}`);

  // Test PUT /api/accounts/primary/{id}
  const updateResponse = await makeRequest(`/api/accounts/primary/${accountId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Updated Assets' }),
  });
  if (!updateResponse.success) throw new Error(`Failed to update primary account: ${updateResponse.data.message}`);

  // Test DELETE /api/accounts/primary/{id}
  const deleteResponse = await makeRequest(`/api/accounts/primary/${accountId}`, {
    method: 'DELETE',
  });
  if (!deleteResponse.success) throw new Error(`Failed to delete primary account: ${deleteResponse.data.message}`);
}

async function testSecondaryAccounts() {
  // Test GET /api/accounts/secondary
  const listResponse = await makeRequest('/api/accounts/secondary?page=1&limit=10');
  if (!listResponse.success) throw new Error(`Failed to list secondary accounts: ${listResponse.data.message}`);

  // Test POST /api/accounts/secondary
  const createResponse = await makeRequest('/api/accounts/secondary', {
    method: 'POST',
    body: JSON.stringify(testData.secondaryAccount),
  });
  if (!createResponse.success) throw new Error(`Failed to create secondary account: ${createResponse.data.message}`);

  const accountId = createResponse.data.data.id;

  // Test GET /api/accounts/secondary/{id}
  const getResponse = await makeRequest(`/api/accounts/secondary/${accountId}`);
  if (!getResponse.success) throw new Error(`Failed to get secondary account: ${getResponse.data.message}`);

  // Test PUT /api/accounts/secondary/{id}
  const updateResponse = await makeRequest(`/api/accounts/secondary/${accountId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Updated Current Assets' }),
  });
  if (!updateResponse.success) throw new Error(`Failed to update secondary account: ${updateResponse.data.message}`);

  // Test DELETE /api/accounts/secondary/{id}
  const deleteResponse = await makeRequest(`/api/accounts/secondary/${accountId}`, {
    method: 'DELETE',
  });
  if (!deleteResponse.success) throw new Error(`Failed to delete secondary account: ${deleteResponse.data.message}`);
}

async function testHolderAccounts() {
  // Test GET /api/accounts/holder
  const listResponse = await makeRequest('/api/accounts/holder?page=1&limit=10');
  if (!listResponse.success) throw new Error(`Failed to list holder accounts: ${listResponse.data.message}`);

  // Test POST /api/accounts/holder
  const createResponse = await makeRequest('/api/accounts/holder', {
    method: 'POST',
    body: JSON.stringify(testData.holderAccount),
  });
  if (!createResponse.success) throw new Error(`Failed to create holder account: ${createResponse.data.message}`);

  const accountId = createResponse.data.data.id;

  // Test GET /api/accounts/holder/{id}
  const getResponse = await makeRequest(`/api/accounts/holder/${accountId}`);
  if (!getResponse.success) throw new Error(`Failed to get holder account: ${getResponse.data.message}`);

  // Test PUT /api/accounts/holder/{id}
  const updateResponse = await makeRequest(`/api/accounts/holder/${accountId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Updated Cash' }),
  });
  if (!updateResponse.success) throw new Error(`Failed to update holder account: ${updateResponse.data.message}`);

  // Test DELETE /api/accounts/holder/{id}
  const deleteResponse = await makeRequest(`/api/accounts/holder/${accountId}`, {
    method: 'DELETE',
  });
  if (!deleteResponse.success) throw new Error(`Failed to delete holder account: ${deleteResponse.data.message}`);
}

async function testTransactions() {
  // Test GET /api/transactions
  const listResponse = await makeRequest('/api/transactions?page=1&limit=10');
  if (!listResponse.success) throw new Error(`Failed to list transactions: ${listResponse.data.message}`);

  // Test POST /api/transactions
  const createResponse = await makeRequest('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(testData.transaction),
  });
  if (!createResponse.success) throw new Error(`Failed to create transaction: ${createResponse.data.message}`);

  const transactionId = createResponse.data.data.id;

  // Test GET /api/transactions/{id}
  const getResponse = await makeRequest(`/api/transactions/${transactionId}`);
  if (!getResponse.success) throw new Error(`Failed to get transaction: ${getResponse.data.message}`);

  // Test PUT /api/transactions/{id}
  const updateResponse = await makeRequest(`/api/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify({ description: 'Updated transaction' }),
  });
  if (!updateResponse.success) throw new Error(`Failed to update transaction: ${updateResponse.data.message}`);

  // Test DELETE /api/transactions/{id}
  const deleteResponse = await makeRequest(`/api/transactions/${transactionId}`, {
    method: 'DELETE',
  });
  if (!deleteResponse.success) throw new Error(`Failed to delete transaction: ${deleteResponse.data.message}`);
}

async function testProducts() {
  // Test GET /api/products
  const listResponse = await makeRequest('/api/products?page=1&limit=10');
  if (!listResponse.success) throw new Error(`Failed to list products: ${listResponse.data.message}`);

  // Test POST /api/products
  const createResponse = await makeRequest('/api/products', {
    method: 'POST',
    body: JSON.stringify(testData.product),
  });
  if (!createResponse.success) throw new Error(`Failed to create product: ${createResponse.data.message}`);

  const productId = createResponse.data.data.id;

  // Test GET /api/products/{id}
  const getResponse = await makeRequest(`/api/products/${productId}`);
  if (!getResponse.success) throw new Error(`Failed to get product: ${getResponse.data.message}`);

  // Test PUT /api/products/{id}
  const updateResponse = await makeRequest(`/api/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Updated Product' }),
  });
  if (!updateResponse.success) throw new Error(`Failed to update product: ${updateResponse.data.message}`);

  // Test DELETE /api/products/{id}
  const deleteResponse = await makeRequest(`/api/products/${productId}`, {
    method: 'DELETE',
  });
  if (!deleteResponse.success) throw new Error(`Failed to delete product: ${deleteResponse.data.message}`);
}

async function testSalesEntries() {
  // Test GET /api/sales
  const listResponse = await makeRequest('/api/sales?page=1&limit=10');
  if (!listResponse.success) throw new Error(`Failed to list sales entries: ${listResponse.data.message}`);

  // Test POST /api/sales
  const createResponse = await makeRequest('/api/sales', {
    method: 'POST',
    body: JSON.stringify(testData.salesEntry),
  });
  if (!createResponse.success) throw new Error(`Failed to create sales entry: ${createResponse.data.message}`);

  const salesEntryId = createResponse.data.data.id;

  // Test GET /api/sales/{id}
  const getResponse = await makeRequest(`/api/sales/${salesEntryId}`);
  if (!getResponse.success) throw new Error(`Failed to get sales entry: ${getResponse.data.message}`);

  // Test PUT /api/sales/{id}
  const updateResponse = await makeRequest(`/api/sales/${salesEntryId}`, {
    method: 'PUT',
    body: JSON.stringify({ customerName: 'Updated Customer' }),
  });
  if (!updateResponse.success) throw new Error(`Failed to update sales entry: ${updateResponse.data.message}`);

  // Test DELETE /api/sales/{id}
  const deleteResponse = await makeRequest(`/api/sales/${salesEntryId}`, {
    method: 'DELETE',
  });
  if (!deleteResponse.success) throw new Error(`Failed to delete sales entry: ${deleteResponse.data.message}`);
}

async function testClients() {
  // Test GET /api/clients
  const listResponse = await makeRequest('/api/clients?page=1&limit=10');
  if (!listResponse.success) throw new Error(`Failed to list clients: ${listResponse.data.message}`);

  // Test POST /api/clients
  const createResponse = await makeRequest('/api/clients', {
    method: 'POST',
    body: JSON.stringify(testData.client),
  });
  if (!createResponse.success) throw new Error(`Failed to create client: ${createResponse.data.message}`);

  const clientId = createResponse.data.data.id;

  // Test GET /api/clients/{id}
  const getResponse = await makeRequest(`/api/clients/${clientId}`);
  if (!getResponse.success) throw new Error(`Failed to get client: ${getResponse.data.message}`);

  // Test PUT /api/clients/{id}
  const updateResponse = await makeRequest(`/api/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Updated Client' }),
  });
  if (!updateResponse.success) throw new Error(`Failed to update client: ${updateResponse.data.message}`);

  // Test DELETE /api/clients/{id}
  const deleteResponse = await makeRequest(`/api/clients/${clientId}`, {
    method: 'DELETE',
  });
  if (!deleteResponse.success) throw new Error(`Failed to delete client: ${deleteResponse.data.message}`);
}

async function testEmployees() {
  // Test GET /api/employees
  const listResponse = await makeRequest('/api/employees?page=1&limit=10');
  if (!listResponse.success) throw new Error(`Failed to list employees: ${listResponse.data.message}`);

  // Test POST /api/employees
  const createResponse = await makeRequest('/api/employees', {
    method: 'POST',
    body: JSON.stringify(testData.employee),
  });
  if (!createResponse.success) throw new Error(`Failed to create employee: ${createResponse.data.message}`);

  const employeeId = createResponse.data.data.id;

  // Test GET /api/employees/{id}
  const getResponse = await makeRequest(`/api/employees/${employeeId}`);
  if (!getResponse.success) throw new Error(`Failed to get employee: ${getResponse.data.message}`);

  // Test PUT /api/employees/{id}
  const updateResponse = await makeRequest(`/api/employees/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Updated Employee' }),
  });
  if (!updateResponse.success) throw new Error(`Failed to update employee: ${updateResponse.data.message}`);

  // Test DELETE /api/employees/{id}
  const deleteResponse = await makeRequest(`/api/employees/${employeeId}`, {
    method: 'DELETE',
  });
  if (!deleteResponse.success) throw new Error(`Failed to delete employee: ${deleteResponse.data.message}`);
}

async function testFixedAssets() {
  // Test GET /api/fixed-assets
  const listResponse = await makeRequest('/api/fixed-assets?page=1&limit=10');
  if (!listResponse.success) throw new Error(`Failed to list fixed assets: ${listResponse.data.message}`);

  // Test POST /api/fixed-assets
  const createResponse = await makeRequest('/api/fixed-assets', {
    method: 'POST',
    body: JSON.stringify(testData.fixedAsset),
  });
  if (!createResponse.success) throw new Error(`Failed to create fixed asset: ${createResponse.data.message}`);

  const assetId = createResponse.data.data.id;

  // Test GET /api/fixed-assets/{id}
  const getResponse = await makeRequest(`/api/fixed-assets/${assetId}`);
  if (!getResponse.success) throw new Error(`Failed to get fixed asset: ${getResponse.data.message}`);

  // Test PUT /api/fixed-assets/{id}
  const updateResponse = await makeRequest(`/api/fixed-assets/${assetId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Updated Computer' }),
  });
  if (!updateResponse.success) throw new Error(`Failed to update fixed asset: ${updateResponse.data.message}`);

  // Test DELETE /api/fixed-assets/{id}
  const deleteResponse = await makeRequest(`/api/fixed-assets/${assetId}`, {
    method: 'DELETE',
  });
  if (!deleteResponse.success) throw new Error(`Failed to delete fixed asset: ${deleteResponse.data.message}`);
}

async function testReports() {
  // Test GET /api/reports/account-balance
  const accountBalanceResponse = await makeRequest('/api/reports/account-balance?organizationId=' + TEST_ORGANIZATION_ID);
  if (!accountBalanceResponse.success) throw new Error(`Failed to generate account balance report: ${accountBalanceResponse.data.message}`);

  // Test GET /api/reports/balance-sheet
  const balanceSheetResponse = await makeRequest('/api/reports/balance-sheet?date=' + new Date().toISOString() + '&organizationId=' + TEST_ORGANIZATION_ID);
  if (!balanceSheetResponse.success) throw new Error(`Failed to generate balance sheet report: ${balanceSheetResponse.data.message}`);

  // Test GET /api/reports/profit-loss
  const profitLossResponse = await makeRequest('/api/reports/profit-loss?dateFrom=' + new Date().toISOString() + '&dateTo=' + new Date().toISOString() + '&organizationId=' + TEST_ORGANIZATION_ID);
  if (!profitLossResponse.success) throw new Error(`Failed to generate profit loss report: ${profitLossResponse.data.message}`);

  // Test GET /api/reports/sales
  const salesResponse = await makeRequest('/api/reports/sales?organizationId=' + TEST_ORGANIZATION_ID);
  if (!salesResponse.success) throw new Error(`Failed to generate sales report: ${salesResponse.data.message}`);
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting API Endpoints Test Suite');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  console.log(`🏢 Test Organization ID: ${TEST_ORGANIZATION_ID}`);
  console.log(`🔑 Test Auth Token: ${TEST_AUTH_TOKEN}`);

  // Run all tests
  await runTest('Organizations API', testOrganizations);
  await runTest('Primary Accounts API', testPrimaryAccounts);
  await runTest('Secondary Accounts API', testSecondaryAccounts);
  await runTest('Holder Accounts API', testHolderAccounts);
  await runTest('Transactions API', testTransactions);
  await runTest('Products API', testProducts);
  await runTest('Sales Entries API', testSalesEntries);
  await runTest('Clients API', testClients);
  await runTest('Employees API', testEmployees);
  await runTest('Fixed Assets API', testFixedAssets);
  await runTest('Reports API', testReports);

  // Print results
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Total: ${testResults.total}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach(error => {
      console.log(`  • ${error.test}: ${error.error}`);
    });
  }

  if (testResults.failed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});















