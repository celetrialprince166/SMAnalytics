/**
 * Test script to verify holder accounts API response includes secondaryAccountId
 */

async function testHolderAccountsAPI() {
  try {
    console.log('Testing Holder Accounts API...\n');
    
    const response = await fetch('http://localhost:3000/api/accounts/holder?limit=10');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('API Response Structure:');
    console.log('- success:', data.success);
    console.log('- data type:', typeof data.data);
    console.log('- data.data type:', typeof data.data?.data);
    console.log('- data.pagination:', data.data?.pagination);
    console.log('');
    
    // Extract accounts array
    const accounts = data.data?.data || data.data || [];
    
    console.log(`Found ${accounts.length} holder accounts\n`);
    
    if (accounts.length > 0) {
      console.log('Sample Account Structure:');
      const sample = accounts[0];
      console.log('- id:', sample.id);
      console.log('- code:', sample.code);
      console.log('- name:', sample.name);
      console.log('- balance:', sample.balance);
      console.log('- secondaryAccountId:', sample.secondaryAccountId);
      console.log('- secondaryAccount:', sample.secondaryAccount ? 'Present' : 'Missing');
      console.log('');
      
      // Check if secondaryAccountId is present
      const accountsWithSecondaryId = accounts.filter(a => a.secondaryAccountId);
      console.log(`Accounts with secondaryAccountId: ${accountsWithSecondaryId.length}/${accounts.length}`);
      
      // Group by secondary account
      const grouped = {};
      accounts.forEach(account => {
        const secId = account.secondaryAccountId || 'null';
        const secName = account.secondaryAccount?.name || 'Unknown';
        const key = `${secName} (${secId})`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(account.name);
      });
      
      console.log('\nAccounts grouped by Secondary Account:');
      Object.entries(grouped).forEach(([secAccount, holderAccounts]) => {
        console.log(`\n${secAccount}:`);
        holderAccounts.forEach(name => console.log(`  - ${name}`));
      });
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testHolderAccountsAPI();
