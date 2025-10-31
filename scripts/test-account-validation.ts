/**
 * Test Script for Account Name Validation
 * 
 * Tests that no two holder accounts under the same secondary account can have the same name
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
}

class AccountValidationTester {
  private results: TestResult[] = [];

  async testDuplicateNameValidation() {
    console.log('\n🔍 Testing Account Name Validation...\n');

    try {
      // First, get a secondary account to test with
      const hierarchyResponse = await fetch(`${BASE_URL}/api/accounts/hierarchy-with-paths`);
      const hierarchyData = await hierarchyResponse.json();
      const hierarchy = hierarchyData.data || hierarchyData;

      if (!hierarchy.secondary || hierarchy.secondary.length === 0) {
        this.results.push({
          test: 'Account Name Validation',
          status: 'FAIL',
          message: 'No secondary accounts found to test with',
        });
        return;
      }

      const testSecondaryAccount = hierarchy.secondary[0];
      console.log(`  📋 Using secondary account: ${testSecondaryAccount.name} (${testSecondaryAccount.code})`);

      // Test 1: Create first account with name "Test Account"
      console.log('\n  🧪 Test 1: Creating first account with name "Test Account"');
      const firstAccountResponse = await fetch(`${BASE_URL}/api/accounts/holder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secondaryAccountId: testSecondaryAccount.id,
          name: 'Test Account',
          description: 'Test account for validation',
        }),
      });

      if (firstAccountResponse.ok) {
        console.log('    ✅ First account created successfully');
      } else {
        const error = await firstAccountResponse.json();
        console.log(`    ❌ Failed to create first account: ${error.message}`);
        this.results.push({
          test: 'Account Name Validation',
          status: 'FAIL',
          message: `Failed to create first account: ${error.message}`,
        });
        return;
      }

      // Test 2: Try to create second account with same name under same secondary account
      console.log('\n  🧪 Test 2: Attempting to create second account with same name');
      const secondAccountResponse = await fetch(`${BASE_URL}/api/accounts/holder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secondaryAccountId: testSecondaryAccount.id,
          name: 'Test Account', // Same name!
          description: 'Second test account',
        }),
      });

      if (!secondAccountResponse.ok) {
        const error = await secondAccountResponse.json();
        console.log(`    ✅ Validation working! Error: ${error.message}`);
        
        if (error.message.includes('already exists')) {
          console.log('    ✅ Correct validation error message');
          this.results.push({
            test: 'Account Name Validation',
            status: 'PASS',
            message: 'Duplicate name validation working correctly',
          });
        } else {
          console.log('    ❌ Wrong error message');
          this.results.push({
            test: 'Account Name Validation',
            status: 'FAIL',
            message: `Wrong error message: ${error.message}`,
          });
        }
      } else {
        console.log('    ❌ Validation failed! Second account was created');
        this.results.push({
          test: 'Account Name Validation',
          status: 'FAIL',
          message: 'Duplicate name validation not working - second account was created',
        });
      }

      // Test 3: Create account with same name under different secondary account (should work)
      console.log('\n  🧪 Test 3: Creating account with same name under different secondary account');
      if (hierarchy.secondary.length > 1) {
        const differentSecondaryAccount = hierarchy.secondary[1];
        console.log(`    📋 Using different secondary account: ${differentSecondaryAccount.name}`);

        const thirdAccountResponse = await fetch(`${BASE_URL}/api/accounts/holder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secondaryAccountId: differentSecondaryAccount.id,
            name: 'Test Account', // Same name, different secondary account
            description: 'Third test account',
          }),
        });

        if (thirdAccountResponse.ok) {
          console.log('    ✅ Account created successfully under different secondary account');
          this.results.push({
            test: 'Cross Secondary Account Names',
            status: 'PASS',
            message: 'Same name allowed under different secondary accounts',
          });
        } else {
          const error = await thirdAccountResponse.json();
          console.log(`    ❌ Unexpected error: ${error.message}`);
          this.results.push({
            test: 'Cross Secondary Account Names',
            status: 'FAIL',
            message: `Unexpected error: ${error.message}`,
          });
        }
      } else {
        console.log('    ⚠️  Only one secondary account available, skipping cross-account test');
      }

      // Cleanup: Delete test accounts
      console.log('\n  🧹 Cleaning up test accounts...');
      await this.cleanupTestAccounts();

    } catch (error: any) {
      console.log(`    ❌ Test failed with error: ${error.message}`);
      this.results.push({
        test: 'Account Name Validation',
        status: 'FAIL',
        message: `Test failed: ${error.message}`,
      });
    }
  }

  async cleanupTestAccounts() {
    try {
      // Get all accounts
      const response = await fetch(`${BASE_URL}/api/accounts/holder?search=Test Account`);
      const data = await response.json();
      const accounts = data.data?.data || data.data || [];

      // Delete test accounts
      for (const account of accounts) {
        if (account.name === 'Test Account') {
          try {
            await fetch(`${BASE_URL}/api/accounts/holder/${account.id}`, {
              method: 'DELETE',
            });
            console.log(`    🗑️  Deleted test account: ${account.name}`);
          } catch (err) {
            console.log(`    ⚠️  Could not delete account ${account.id}: ${err}`);
          }
        }
      }
    } catch (error) {
      console.log(`    ⚠️  Cleanup failed: ${error}`);
    }
  }

  async testUpdateValidation() {
    console.log('\n🔍 Testing Account Update Validation...\n');

    try {
      // Get a secondary account and existing account
      const hierarchyResponse = await fetch(`${BASE_URL}/api/accounts/hierarchy-with-paths`);
      const hierarchyData = await hierarchyResponse.json();
      const hierarchy = hierarchyData.data || hierarchyData;

      if (!hierarchy.secondary || hierarchy.secondary.length === 0 || !hierarchy.holder || hierarchy.holder.length === 0) {
        this.results.push({
          test: 'Update Validation',
          status: 'SKIP',
          message: 'No accounts found to test update validation',
        });
        return;
      }

      const testSecondaryAccount = hierarchy.secondary[0];
      const existingAccounts = hierarchy.holder.filter((h: any) => h.secondaryAccountId === testSecondaryAccount.id);

      if (existingAccounts.length < 2) {
        this.results.push({
          test: 'Update Validation',
          status: 'SKIP',
          message: 'Need at least 2 accounts under same secondary account to test update validation',
        });
        return;
      }

      const account1 = existingAccounts[0];
      const account2 = existingAccounts[1];

      console.log(`  📋 Testing with accounts: "${account1.name}" and "${account2.name}"`);

      // Try to update account1 to have the same name as account2
      console.log(`\n  🧪 Attempting to rename "${account1.name}" to "${account2.name}"`);
      const updateResponse = await fetch(`${BASE_URL}/api/accounts/holder/${account1.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: account2.name, // Same name as account2
          description: account1.description,
        }),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        console.log(`    ✅ Update validation working! Error: ${error.message}`);
        
        if (error.message.includes('already exists')) {
          this.results.push({
            test: 'Update Validation',
            status: 'PASS',
            message: 'Update duplicate name validation working correctly',
          });
        } else {
          this.results.push({
            test: 'Update Validation',
            status: 'FAIL',
            message: `Wrong error message: ${error.message}`,
          });
        }
      } else {
        console.log('    ❌ Update validation failed! Account was renamed');
        this.results.push({
          test: 'Update Validation',
          status: 'FAIL',
          message: 'Update duplicate name validation not working',
        });
      }

    } catch (error: any) {
      console.log(`    ❌ Update test failed: ${error.message}`);
      this.results.push({
        test: 'Update Validation',
        status: 'FAIL',
        message: `Update test failed: ${error.message}`,
      });
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 VALIDATION TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${icon} ${result.test}`);
      console.log(`   ${result.message}`);
    });

    console.log('='.repeat(60));
    console.log(`Total: ${this.results.length} tests`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped: ${skipped}`);
    console.log('='.repeat(60));

    if (failed === 0) {
      console.log('\n🎉 All validation tests passed! Account name validation is working correctly!');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Check the implementation.`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Account Name Validation Tests...\n');
    console.log('This will test that no two holder accounts under the same secondary account can have the same name.\n');

    await this.testDuplicateNameValidation();
    await this.testUpdateValidation();
    
    this.printSummary();
  }
}

// Run tests
const tester = new AccountValidationTester();
tester.runAllTests().catch(console.error);



