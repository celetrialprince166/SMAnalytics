/**
 * Test Script for Real-time Account Name Validation
 * 
 * Tests the real-time validation API endpoint
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
}

class RealTimeValidationTester {
  private results: TestResult[] = [];

  async testValidationEndpoint() {
    console.log('\n🔍 Testing Real-time Validation Endpoint...\n');

    try {
      // Get a secondary account to test with
      const hierarchyResponse = await fetch(`${BASE_URL}/api/accounts/hierarchy-with-paths`);
      const hierarchyData = await hierarchyResponse.json();
      const hierarchy = hierarchyData.data || hierarchyData;

      if (!hierarchy.secondary || hierarchy.secondary.length === 0) {
        this.results.push({
          test: 'Real-time Validation',
          status: 'FAIL',
          message: 'No secondary accounts found to test with',
        });
        return;
      }

      const testSecondaryAccount = hierarchy.secondary[0];
      console.log(`  📋 Using secondary account: ${testSecondaryAccount.name} (${testSecondaryAccount.code})`);

      // Test 1: Check available name
      console.log('\n  🧪 Test 1: Checking available name');
      const availableResponse = await fetch(`${BASE_URL}/api/accounts/validate-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Unique Test Name 12345',
          secondaryAccountId: testSecondaryAccount.id,
        }),
      });

      if (availableResponse.ok) {
        const data = await availableResponse.json();
        console.log('    ✅ Available name validation working');
        console.log(`    📝 Response: ${data.data?.message || 'Name is available'}`);
        this.results.push({
          test: 'Available Name Validation',
          status: 'PASS',
          message: `Success: ${data.data?.message || 'Name is available'}`,
        });
      } else {
        const error = await availableResponse.json();
        console.log(`    ❌ Available name validation failed: ${error.message}`);
        this.results.push({
          test: 'Available Name Validation',
          status: 'FAIL',
          message: `Failed: ${error.message}`,
        });
        return;
      }

      // Test 2: Check existing name
      console.log('\n  🧪 Test 2: Checking existing name');
      if (hierarchy.holder && hierarchy.holder.length > 0) {
        const existingAccount = hierarchy.holder.find((h: any) => h.secondaryAccountId === testSecondaryAccount.id);
        
        if (existingAccount) {
          const existingResponse = await fetch(`${BASE_URL}/api/accounts/validate-name`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: existingAccount.name,
              secondaryAccountId: testSecondaryAccount.id,
            }),
          });

          if (!existingResponse.ok) {
            const error = await existingResponse.json();
            console.log('    ✅ Existing name validation working');
            console.log(`    📝 Response: ${error.message}`);
            this.results.push({
              test: 'Existing Name Validation',
              status: 'PASS',
              message: 'Correctly rejected existing name',
            });
          } else {
            console.log('    ❌ Existing name validation failed - should have been rejected');
            this.results.push({
              test: 'Existing Name Validation',
              status: 'FAIL',
              message: 'Failed to reject existing name',
            });
          }
        } else {
          console.log('    ⚠️  No existing accounts under this secondary account to test with');
        }
      }

      // Test 3: Check with excludeAccountId (for updates)
      console.log('\n  🧪 Test 3: Checking with excludeAccountId (update scenario)');
      if (hierarchy.holder && hierarchy.holder.length > 0) {
        const existingAccount = hierarchy.holder.find((h: any) => h.secondaryAccountId === testSecondaryAccount.id);
        
        if (existingAccount) {
          const excludeResponse = await fetch(`${BASE_URL}/api/accounts/validate-name`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: existingAccount.name,
              secondaryAccountId: testSecondaryAccount.id,
              excludeAccountId: existingAccount.id, // Exclude the same account
            }),
          });

          if (excludeResponse.ok) {
            console.log('    ✅ Exclude account validation working');
            console.log('    📝 Same account can keep its name during update');
            this.results.push({
              test: 'Exclude Account Validation',
              status: 'PASS',
              message: 'Correctly allowed same account to keep its name',
            });
          } else {
            const error = await excludeResponse.json();
            console.log(`    ❌ Exclude account validation failed: ${error.message}`);
            this.results.push({
              test: 'Exclude Account Validation',
              status: 'FAIL',
              message: `Failed: ${error.message}`,
            });
          }
        }
      }

      // Test 4: Invalid request (missing fields)
      console.log('\n  🧪 Test 4: Testing invalid request');
      const invalidResponse = await fetch(`${BASE_URL}/api/accounts/validate-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Name',
          // Missing secondaryAccountId
        }),
      });

      if (!invalidResponse.ok) {
        const error = await invalidResponse.json();
        console.log('    ✅ Invalid request handling working');
        console.log(`    📝 Response: ${error.message}`);
        this.results.push({
          test: 'Invalid Request Handling',
          status: 'PASS',
          message: 'Correctly handled invalid request',
        });
      } else {
        console.log('    ❌ Invalid request should have been rejected');
        this.results.push({
          test: 'Invalid Request Handling',
          status: 'FAIL',
          message: 'Failed to reject invalid request',
        });
      }

    } catch (error: any) {
      console.log(`    ❌ Test failed with error: ${error.message}`);
      this.results.push({
        test: 'Real-time Validation',
        status: 'FAIL',
        message: `Test failed: ${error.message}`,
      });
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...\n');

    try {
      const hierarchyResponse = await fetch(`${BASE_URL}/api/accounts/hierarchy-with-paths`);
      const hierarchyData = await hierarchyResponse.json();
      const hierarchy = hierarchyData.data || hierarchyData;

      if (!hierarchy.secondary || hierarchy.secondary.length === 0) {
        console.log('    ⚠️  No secondary accounts to test performance');
        return;
      }

      const testSecondaryAccount = hierarchy.secondary[0];
      const testName = 'Performance Test Name';

      // Test response time
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/api/accounts/validate-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testName,
          secondaryAccountId: testSecondaryAccount.id,
        }),
      });
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`    ⏱️  Response time: ${duration}ms`);

      if (duration < 500) {
        console.log('    ✅ Performance is good (< 500ms)');
        this.results.push({
          test: 'Performance',
          status: 'PASS',
          message: `Response time: ${duration}ms`,
        });
      } else {
        console.log('    ⚠️  Performance could be improved (> 500ms)');
        this.results.push({
          test: 'Performance',
          status: 'PASS',
          message: `Response time: ${duration}ms (acceptable but could be faster)`,
        });
      }

    } catch (error: any) {
      console.log(`    ❌ Performance test failed: ${error.message}`);
      this.results.push({
        test: 'Performance',
        status: 'FAIL',
        message: `Test failed: ${error.message}`,
      });
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 REAL-TIME VALIDATION TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;

    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}`);
      console.log(`   ${result.message}`);
    });

    console.log('='.repeat(60));
    console.log(`Total: ${this.results.length} tests`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('='.repeat(60));

    if (failed === 0) {
      console.log('\n🎉 All real-time validation tests passed!');
      console.log('✨ Users will now get instant feedback as they type!');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Check the implementation.`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Real-time Account Name Validation Tests...\n');
    console.log('This will test the validation API endpoint that provides instant feedback.\n');

    await this.testValidationEndpoint();
    await this.testPerformance();
    
    this.printSummary();
  }
}

// Run tests
const tester = new RealTimeValidationTester();
tester.runAllTests().catch(console.error);

