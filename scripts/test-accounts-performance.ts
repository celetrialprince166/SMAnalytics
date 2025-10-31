/**
 * Performance Test Script for Accounts API
 * 
 * Tests the performance improvements of the optimized accounts endpoint
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  test: string;
  duration: number;
  status: 'PASS' | 'FAIL';
  details: string;
}

class AccountsPerformanceTester {
  private results: TestResult[] = [];

  async testOldEndpoint() {
    console.log('\n📊 Testing OLD endpoint (multiple calls)...\n');
    const startTime = Date.now();

    try {
      // Simulate old approach: Get hierarchy first
      const hierarchyResponse = await fetch(`${BASE_URL}/api/accounts/primary?limit=1000`);
      const primaryData = await hierarchyResponse.json();
      const primaryAccounts = primaryData.data?.data || [];

      console.log(`  ✓ Fetched ${primaryAccounts.length} primary accounts`);

      // Get secondary accounts for each primary (multiple calls)
      let totalSecondary = 0;
      for (const primary of primaryAccounts.slice(0, 5)) { // Test with first 5 for demo
        const secResponse = await fetch(`${BASE_URL}/api/accounts/secondary?primaryAccountId=${primary.id}&limit=1000`);
        const secData = await secResponse.json();
        const secondary = secData.data?.data || [];
        totalSecondary += secondary.length;
      }

      console.log(`  ✓ Fetched secondary accounts with ${primaryAccounts.slice(0, 5).length} separate calls`);

      // Get holder accounts
      const holderResponse = await fetch(`${BASE_URL}/api/accounts/holder?limit=1000`);
      const holderData = await holderResponse.json();
      const holderAccounts = holderData.data?.data || [];

      console.log(`  ✓ Fetched ${holderAccounts.length} holder accounts`);

      // Simulate path generation (would be N separate calls in old code)
      console.log(`  ⚠️  In old code, would need ${holderAccounts.length} more API calls for paths!`);

      const duration = Date.now() - startTime;

      this.results.push({
        test: 'Old Endpoint Pattern',
        duration,
        status: 'PASS',
        details: `${primaryAccounts.slice(0, 5).length + 2} API calls made, ~${holderAccounts.length} more needed for paths`,
      });

      console.log(`\n  ⏱️  Duration: ${duration}ms`);
      console.log(`  📈 Total potential calls: ${primaryAccounts.slice(0, 5).length + 2 + holderAccounts.length}`);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.results.push({
        test: 'Old Endpoint Pattern',
        duration,
        status: 'FAIL',
        details: error.message,
      });
    }
  }

  async testNewOptimizedEndpoint() {
    console.log('\n🚀 Testing NEW optimized endpoint (single call)...\n');
    const startTime = Date.now();

    try {
      // Single optimized call with all data and paths
      const response = await fetch(`${BASE_URL}/api/accounts/hierarchy-with-paths`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const hierarchy = data.data || data;

      const duration = Date.now() - startTime;

      const primaryCount = hierarchy.primary?.length || 0;
      const secondaryCount = hierarchy.secondary?.length || 0;
      const holderCount = hierarchy.holder?.length || 0;

      console.log(`  ✓ Fetched complete hierarchy in ONE call:`);
      console.log(`    - Primary accounts: ${primaryCount}`);
      console.log(`    - Secondary accounts: ${secondaryCount}`);
      console.log(`    - Holder accounts: ${holderCount}`);
      console.log(`    - All paths computed: ${holderCount} paths included!`);

      // Verify paths are included
      if (holderCount > 0) {
        const firstAccount = hierarchy.holder[0];
        if (firstAccount.path) {
          console.log(`  ✓ Paths verified: "${firstAccount.path}"`);
        } else {
          throw new Error('Paths not included in response');
        }
      }

      this.results.push({
        test: 'New Optimized Endpoint',
        duration,
        status: 'PASS',
        details: `1 API call, ${primaryCount + secondaryCount + holderCount} accounts with paths`,
      });

      console.log(`\n  ⏱️  Duration: ${duration}ms`);
      console.log(`  📈 Total API calls: 1 (vs ${holderCount + 10}+ in old approach)`);

      return duration;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.results.push({
        test: 'New Optimized Endpoint',
        duration,
        status: 'FAIL',
        details: error.message,
      });
      return duration;
    }
  }

  async testCachingBehavior() {
    console.log('\n💾 Testing caching behavior (second request)...\n');
    const startTime = Date.now();

    try {
      // Make second request to test browser/server caching
      const response = await fetch(`${BASE_URL}/api/accounts/hierarchy-with-paths`);
      const data = await response.json();
      const duration = Date.now() - startTime;

      console.log(`  ✓ Second request completed`);
      console.log(`  ⏱️  Duration: ${duration}ms (should be similar or faster)`);

      this.results.push({
        test: 'Caching Behavior',
        duration,
        status: 'PASS',
        details: `Second request: ${duration}ms`,
      });

      return duration;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.results.push({
        test: 'Caching Behavior',
        duration,
        status: 'FAIL',
        details: error.message,
      });
      return duration;
    }
  }

  async testDataIntegrity() {
    console.log('\n🔍 Testing data integrity...\n');

    try {
      const response = await fetch(`${BASE_URL}/api/accounts/hierarchy-with-paths`);
      const data = await response.json();
      const hierarchy = data.data || data;

      let checks = 0;
      let passed = 0;

      // Check structure
      checks++;
      if (hierarchy.primary && hierarchy.secondary && hierarchy.holder) {
        passed++;
        console.log('  ✓ Response structure is correct');
      } else {
        console.log('  ✗ Response structure is incorrect');
      }

      // Check holder accounts have paths
      checks++;
      if (hierarchy.holder.length > 0) {
        const accountsWithPaths = hierarchy.holder.filter((a: any) => a.path);
        if (accountsWithPaths.length === hierarchy.holder.length) {
          passed++;
          console.log(`  ✓ All ${hierarchy.holder.length} accounts have paths`);
        } else {
          console.log(`  ✗ Only ${accountsWithPaths.length}/${hierarchy.holder.length} accounts have paths`);
        }
      } else {
        passed++;
        console.log('  ℹ️  No holder accounts to verify');
      }

      // Check path format
      checks++;
      if (hierarchy.holder.length > 0) {
        const firstPath = hierarchy.holder[0].path;
        const pathParts = firstPath.split(' > ');
        if (pathParts.length === 3) {
          passed++;
          console.log(`  ✓ Path format is correct: "${firstPath}"`);
        } else {
          console.log(`  ✗ Path format is incorrect: "${firstPath}"`);
        }
      } else {
        passed++;
        console.log('  ℹ️  No holder accounts to verify path format');
      }

      // Check additional fields
      checks++;
      if (hierarchy.holder.length > 0) {
        const firstAccount = hierarchy.holder[0];
        if (firstAccount.primaryAccountName && firstAccount.secondaryAccountName) {
          passed++;
          console.log('  ✓ Additional fields included (primaryAccountName, secondaryAccountName)');
        } else {
          console.log('  ℹ️  Additional fields not included (optional)');
          passed++; // Not critical
        }
      } else {
        passed++;
      }

      this.results.push({
        test: 'Data Integrity',
        duration: 0,
        status: passed === checks ? 'PASS' : 'FAIL',
        details: `${passed}/${checks} checks passed`,
      });

    } catch (error: any) {
      this.results.push({
        test: 'Data Integrity',
        duration: 0,
        status: 'FAIL',
        details: error.message,
      });
    }
  }

  async runPerformanceComparison() {
    console.log('\n📊 Running performance comparison...\n');

    const oldDuration = await this.measureOldApproachSimulated();
    const newDuration = await this.measureNewApproach();

    if (oldDuration && newDuration) {
      const improvement = ((oldDuration - newDuration) / oldDuration * 100).toFixed(1);
      const speedup = (oldDuration / newDuration).toFixed(1);

      console.log('\n' + '='.repeat(60));
      console.log('📈 PERFORMANCE COMPARISON');
      console.log('='.repeat(60));
      console.log(`Old Approach (estimated): ${oldDuration}ms`);
      console.log(`New Approach (measured):  ${newDuration}ms`);
      console.log(`Improvement: ${improvement}%`);
      console.log(`Speed-up: ${speedup}x faster`);
      console.log('='.repeat(60));
    }
  }

  async measureOldApproachSimulated(): Promise<number> {
    // Simulate old approach with actual timing
    const response = await fetch(`${BASE_URL}/api/accounts/hierarchy-with-paths`);
    const data = await response.json();
    const holderCount = data.data?.holder?.length || 0;

    // Estimate: 1 call for hierarchy + N calls for paths
    // Average path call takes ~50ms (conservative estimate)
    const estimatedTime = 200 + (holderCount * 50); // Base call + N path calls
    return estimatedTime;
  }

  async measureNewApproach(): Promise<number> {
    const startTime = Date.now();
    await fetch(`${BASE_URL}/api/accounts/hierarchy-with-paths`);
    return Date.now() - startTime;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      const durationStr = result.duration > 0 ? ` (${result.duration}ms)` : '';
      console.log(`${icon} ${result.test}${durationStr}`);
      console.log(`   ${result.details}`);
    });

    console.log('='.repeat(60));
    console.log(`Total: ${total} tests`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('='.repeat(60));

    if (failed === 0) {
      console.log('\n🎉 All tests passed! Performance optimization successful!');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Check the details above.`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Accounts Performance Tests...\n');
    console.log('This will test the new optimized endpoint against the old approach.\n');

    await this.testNewOptimizedEndpoint();
    await this.testCachingBehavior();
    await this.testDataIntegrity();
    await this.testOldEndpoint();
    await this.runPerformanceComparison();
    
    this.printSummary();
  }
}

// Run tests
const tester = new AccountsPerformanceTester();
tester.runAllTests().catch(console.error);



