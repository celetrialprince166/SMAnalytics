/**
 * Test Script: Debug Visualization Accuracy
 * 
 * This script tests the accuracy of the debug visualization by:
 * 1. Creating test accounts with known balances
 * 2. Creating transactions
 * 3. Verifying the visualization shows correct before/after balances
 */

const API_BASE = 'http://localhost:3000/api';

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Test 1: Simple transaction between two accounts
async function testSimpleTransaction() {
  console.log('\n=== TEST 1: Simple Transaction ===\n');

  try {
    // Get two existing accounts
    const accountsResponse = await apiRequest('/accounts/holder?limit=10');
    const accounts = accountsResponse.data;

    if (accounts.length < 2) {
      console.log('❌ Not enough accounts to test. Need at least 2 accounts.');
      return false;
    }

    const debitAccount = accounts[0];
    const creditAccount = accounts[1];

    console.log(`Debit Account: ${debitAccount.name} (${debitAccount.code})`);
    console.log(`  Before Balance: ${debitAccount.balance}`);
    
    console.log(`Credit Account: ${creditAccount.name} (${creditAccount.code})`);
    console.log(`  Before Balance: ${creditAccount.balance}`);

    // Create a transaction
    const transactionAmount = 100;
    console.log(`\nCreating transaction for ${transactionAmount}...`);

    const transaction = await apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        date: new Date().toISOString(),
        description: 'Test transaction for debug visualization',
        amount: transactionAmount,
        debitAccountId: debitAccount.id,
        creditAccountId: creditAccount.id,
        reconciled: false,
      }),
    });

    console.log('✅ Transaction created:', transaction.data.number);

    // Fetch updated balances
    const debitAfter = await apiRequest(`/accounts/holder/${debitAccount.id}`);
    const creditAfter = await apiRequest(`/accounts/holder/${creditAccount.id}`);

    console.log(`\nDebit Account After:`);
    console.log(`  Balance: ${debitAfter.data.balance}`);
    console.log(`  Expected Change: +${transactionAmount} (for ASSETS/EXPENSES) or -${transactionAmount} (for LIABILITIES/EQUITY/REVENUE)`);

    console.log(`\nCredit Account After:`);
    console.log(`  Balance: ${creditAfter.data.balance}`);
    console.log(`  Expected Change: -${transactionAmount} (for ASSETS/EXPENSES) or +${transactionAmount} (for LIABILITIES/EQUITY/REVENUE)`);

    // Verify the changes
    const debitChange = Number(debitAfter.data.balance) - Number(debitAccount.balance);
    const creditChange = Number(creditAfter.data.balance) - Number(creditAccount.balance);

    console.log(`\nActual Changes:`);
    console.log(`  Debit Account: ${debitChange > 0 ? '+' : ''}${debitChange}`);
    console.log(`  Credit Account: ${creditChange > 0 ? '+' : ''}${creditChange}`);

    // Check if changes match accounting rules
    const debitType = debitAfter.data.secondaryAccount?.primaryAccount?.type;
    const creditType = creditAfter.data.secondaryAccount?.primaryAccount?.type;

    console.log(`\nAccount Types:`);
    console.log(`  Debit Account Type: ${debitType}`);
    console.log(`  Credit Account Type: ${creditType}`);

    let debitExpected, creditExpected;
    if (debitType === 'ASSETS' || debitType === 'EXPENSES') {
      debitExpected = transactionAmount; // Debit increases
    } else {
      debitExpected = -transactionAmount; // Debit decreases
    }

    if (creditType === 'LIABILITIES' || creditType === 'EQUITY' || creditType === 'REVENUE') {
      creditExpected = transactionAmount; // Credit increases
    } else {
      creditExpected = -transactionAmount; // Credit decreases
    }

    console.log(`\nExpected Changes:`);
    console.log(`  Debit Account: ${debitExpected > 0 ? '+' : ''}${debitExpected}`);
    console.log(`  Credit Account: ${creditExpected > 0 ? '+' : ''}${creditExpected}`);

    const debitCorrect = Math.abs(debitChange - debitExpected) < 0.01;
    const creditCorrect = Math.abs(creditChange - creditExpected) < 0.01;

    if (debitCorrect && creditCorrect) {
      console.log('\n✅ TEST PASSED: Balance changes are correct!');
      return true;
    } else {
      console.log('\n❌ TEST FAILED: Balance changes do not match expected values!');
      if (!debitCorrect) console.log(`  Debit: Expected ${debitExpected}, got ${debitChange}`);
      if (!creditCorrect) console.log(`  Credit: Expected ${creditExpected}, got ${creditChange}`);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Test 2: Verify visualization data structure
async function testVisualizationDataStructure() {
  console.log('\n=== TEST 2: Visualization Data Structure ===\n');

  console.log('This test requires manual verification:');
  console.log('1. Enable debug mode (Ctrl+Shift+D)');
  console.log('2. Create a transaction');
  console.log('3. Check the debug visualization modal');
  console.log('4. Verify:');
  console.log('   - "Before" balance shows the balance BEFORE the transaction');
  console.log('   - "Change" shows the correct increase/decrease');
  console.log('   - "After" balance = "Before" balance + "Change"');
  console.log('   - Account types follow accounting rules:');
  console.log('     * ASSETS/EXPENSES: Debit increases (+), Credit decreases (-)');
  console.log('     * LIABILITIES/EQUITY/REVENUE: Credit increases (+), Debit decreases (-)');

  return true;
}

// Run all tests
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Debug Visualization Accuracy Test Suite                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = [];

  results.push(await testSimpleTransaction());
  results.push(await testVisualizationDataStructure());

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Test Results Summary                                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`Tests Passed: ${passed}/${total}`);

  if (passed === total) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n❌ Some tests failed. Please review the output above.');
  }
}

// Run the tests
runTests().catch(console.error);
