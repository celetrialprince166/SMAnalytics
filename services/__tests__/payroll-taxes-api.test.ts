/**
 * Payroll Taxes API Test Suite
 * 
 * Comprehensive testing for payroll tax configuration API endpoints
 */

class PayrollTaxesAPITester {
  private results: Array<{ test: string; status: 'PASS' | 'FAIL'; message: string }> = [];
  private baseUrl = 'http://localhost:3000/api/payroll';

  private addResult(test: string, status: 'PASS' | 'FAIL', message: string) {
    this.results.push({ test, status, message });
    console.log(`[${status}] ${test}: ${message}`);
  }

  async testTaxConfigurationCRUD() {
    console.log('\n🧪 Testing Tax Configuration CRUD Operations...\n');

    // Test 1: GET tax configurations (should return empty array initially)
    try {
      const response = await fetch(`${this.baseUrl}/tax-configurations`);
      const data = await response.json();
      
      if (response.ok && Array.isArray(data.data)) {
        this.addResult('GET /tax-configurations', 'PASS', `Retrieved ${data.data.length} configurations`);
      } else {
        this.addResult('GET /tax-configurations', 'FAIL', `Unexpected response: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      this.addResult('GET /tax-configurations', 'FAIL', `Error: ${error.message}`);
    }

    // Test 2: GET active tax configuration (should return 404 initially)
    try {
      const response = await fetch(`${this.baseUrl}/tax-configurations/active`);
      const data = await response.json();
      
      if (response.status === 404) {
        this.addResult('GET /tax-configurations/active (no active)', 'PASS', 'Correctly returned 404 for no active configuration');
      } else {
        this.addResult('GET /tax-configurations/active (no active)', 'FAIL', `Expected 404, got ${response.status}`);
      }
    } catch (error: any) {
      this.addResult('GET /tax-configurations/active (no active)', 'FAIL', `Error: ${error.message}`);
    }

    // Test 3: Create tax configuration
    let createdConfigId: string | null = null;
    try {
      const taxConfigData = {
        effectiveDate: new Date().toISOString(),
        brackets: [
          { order: 1, amount: 0, rate: 0 },
          { order: 2, amount: 365, rate: 5 },
          { order: 3, amount: 110, rate: 10 },
          { order: 4, amount: 130, rate: 17.5 },
          { order: 5, amount: 3000, rate: 25 },
          { order: 6, amount: 16395, rate: 30 },
          { order: 7, amount: 0, rate: 35 }
        ],
        nonResidentRate: 20,
        personalRelief: 402
      };

      const response = await fetch(`${this.baseUrl}/tax-configurations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxConfigData),
      });

      const data = await response.json();
      
      if (response.ok && data.data && data.data.id) {
        createdConfigId = data.data.id;
        this.addResult('POST /tax-configurations', 'PASS', `Created configuration with ID: ${createdConfigId}`);
      } else {
        this.addResult('POST /tax-configurations', 'FAIL', `Failed to create: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      this.addResult('POST /tax-configurations', 'FAIL', `Error: ${error.message}`);
    }

    // Test 4: GET active tax configuration (should now return the created config)
    try {
      const response = await fetch(`${this.baseUrl}/tax-configurations/active`);
      const data = await response.json();
      
      if (response.ok && data.data && data.data.isActive) {
        this.addResult('GET /tax-configurations/active (with active)', 'PASS', 'Successfully retrieved active configuration');
      } else {
        this.addResult('GET /tax-configurations/active (with active)', 'FAIL', `Failed to get active config: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      this.addResult('GET /tax-configurations/active (with active)', 'FAIL', `Error: ${error.message}`);
    }

    // Test 5: GET specific tax configuration by ID
    if (createdConfigId) {
      try {
        const response = await fetch(`${this.baseUrl}/tax-configurations/${createdConfigId}`);
        const data = await response.json();
        
        if (response.ok && data.data && data.data.id === createdConfigId) {
          this.addResult('GET /tax-configurations/[id]', 'PASS', 'Successfully retrieved configuration by ID');
        } else {
          this.addResult('GET /tax-configurations/[id]', 'FAIL', `Failed to get config by ID: ${JSON.stringify(data)}`);
        }
      } catch (error: any) {
        this.addResult('GET /tax-configurations/[id]', 'FAIL', `Error: ${error.message}`);
      }
    }

    // Test 6: Update tax configuration
    if (createdConfigId) {
      try {
        const updateData = {
          personalRelief: 500
        };

        const response = await fetch(`${this.baseUrl}/tax-configurations/${createdConfigId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        const data = await response.json();
        
        if (response.ok && data.data && data.data.personalRelief === 500) {
          this.addResult('PUT /tax-configurations/[id]', 'PASS', 'Successfully updated configuration');
        } else {
          this.addResult('PUT /tax-configurations/[id]', 'FAIL', `Failed to update: ${JSON.stringify(data)}`);
        }
      } catch (error: any) {
        this.addResult('PUT /tax-configurations/[id]', 'FAIL', `Error: ${error.message}`);
      }
    }

    // Test 7: Validation tests
    await this.testValidation();

    // Test 8: Clean up - Delete tax configuration
    if (createdConfigId) {
      try {
        const response = await fetch(`${this.baseUrl}/tax-configurations/${createdConfigId}`, {
          method: 'DELETE',
        });

        const data = await response.json();
        
        if (response.ok) {
          this.addResult('DELETE /tax-configurations/[id]', 'PASS', 'Successfully deleted configuration');
        } else {
          this.addResult('DELETE /tax-configurations/[id]', 'FAIL', `Failed to delete: ${JSON.stringify(data)}`);
        }
      } catch (error: any) {
        this.addResult('DELETE /tax-configurations/[id]', 'FAIL', `Error: ${error.message}`);
      }
    }
  }

  async testValidation() {
    console.log('\n🔍 Testing Validation...\n');

    // Test invalid effective date
    try {
      const invalidData = {
        effectiveDate: 'invalid-date',
        brackets: [{ order: 1, amount: 0, rate: 0 }],
        nonResidentRate: 20,
        personalRelief: 402
      };

      const response = await fetch(`${this.baseUrl}/tax-configurations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      if (response.status === 400) {
        this.addResult('Validation - Invalid date', 'PASS', 'Correctly rejected invalid date');
      } else {
        this.addResult('Validation - Invalid date', 'FAIL', `Expected 400, got ${response.status}`);
      }
    } catch (error: any) {
      this.addResult('Validation - Invalid date', 'FAIL', `Error: ${error.message}`);
    }

    // Test missing brackets
    try {
      const invalidData = {
        effectiveDate: new Date().toISOString(),
        nonResidentRate: 20,
        personalRelief: 402
      };

      const response = await fetch(`${this.baseUrl}/tax-configurations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      if (response.status === 400) {
        this.addResult('Validation - Missing brackets', 'PASS', 'Correctly rejected missing brackets');
      } else {
        this.addResult('Validation - Missing brackets', 'FAIL', `Expected 400, got ${response.status}`);
      }
    } catch (error: any) {
      this.addResult('Validation - Missing brackets', 'FAIL', `Error: ${error.message}`);
    }

    // Test invalid non-resident rate
    try {
      const invalidData = {
        effectiveDate: new Date().toISOString(),
        brackets: [{ order: 1, amount: 0, rate: 0 }],
        nonResidentRate: 150, // Invalid: > 100
        personalRelief: 402
      };

      const response = await fetch(`${this.baseUrl}/tax-configurations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      if (response.status === 400) {
        this.addResult('Validation - Invalid rate', 'PASS', 'Correctly rejected invalid rate');
      } else {
        this.addResult('Validation - Invalid rate', 'FAIL', `Expected 400, got ${response.status}`);
      }
    } catch (error: any) {
      this.addResult('Validation - Invalid rate', 'FAIL', `Error: ${error.message}`);
    }
  }

  async testPensionConfigurationCRUD() {
    console.log('\n🧪 Testing Pension Configuration CRUD Operations...\n');

    // Test 1: GET pension configurations
    try {
      const response = await fetch(`${this.baseUrl}/pension-configurations`);
      const data = await response.json();
      
      if (response.ok && Array.isArray(data.data)) {
        this.addResult('GET /pension-configurations', 'PASS', `Retrieved ${data.data.length} configurations`);
      } else {
        this.addResult('GET /pension-configurations', 'FAIL', `Unexpected response: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      this.addResult('GET /pension-configurations', 'FAIL', `Error: ${error.message}`);
    }

    // Test 2: Create pension configuration
    let createdConfigId: string | null = null;
    try {
      const pensionConfigData = {
        effectiveDate: new Date().toISOString(),
        tier1EmployerRate: 13.5,
        tier1EmployeeRate: 5.5,
        tier1PensionRate: 13.5,
        tier1NHISRate: 2.5,
        tier2Rate: 5.0,
        tier3EmployerRate: 5.0,
        tier3EmployeeRate: 5.0,
        tier3MaxAmount: 50000
      };

      const response = await fetch(`${this.baseUrl}/pension-configurations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pensionConfigData),
      });

      const data = await response.json();
      
      if (response.ok && data.data && data.data.id) {
        createdConfigId = data.data.id;
        this.addResult('POST /pension-configurations', 'PASS', `Created pension configuration with ID: ${createdConfigId}`);
      } else {
        this.addResult('POST /pension-configurations', 'FAIL', `Failed to create: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      this.addResult('POST /pension-configurations', 'FAIL', `Error: ${error.message}`);
    }

    // Test 3: GET active pension configuration
    try {
      const response = await fetch(`${this.baseUrl}/pension-configurations/active`);
      const data = await response.json();
      
      if (response.ok && data.data && data.data.isActive) {
        this.addResult('GET /pension-configurations/active', 'PASS', 'Successfully retrieved active pension configuration');
      } else {
        this.addResult('GET /pension-configurations/active', 'FAIL', `Failed to get active pension config: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      this.addResult('GET /pension-configurations/active', 'FAIL', `Error: ${error.message}`);
    }

    // Test 4: Update pension configuration
    if (createdConfigId) {
      try {
        const updateData = {
          tier3MaxAmount: 60000
        };

        const response = await fetch(`${this.baseUrl}/pension-configurations/${createdConfigId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        const data = await response.json();
        
        if (response.ok && data.data && data.data.tier3MaxAmount === 60000) {
          this.addResult('PUT /pension-configurations/[id]', 'PASS', 'Successfully updated pension configuration');
        } else {
          this.addResult('PUT /pension-configurations/[id]', 'FAIL', `Failed to update: ${JSON.stringify(data)}`);
        }
      } catch (error: any) {
        this.addResult('PUT /pension-configurations/[id]', 'FAIL', `Error: ${error.message}`);
      }
    }

    // Test 5: Clean up - Delete pension configuration
    if (createdConfigId) {
      try {
        const response = await fetch(`${this.baseUrl}/pension-configurations/${createdConfigId}`, {
          method: 'DELETE',
        });

        const data = await response.json();
        
        if (response.ok) {
          this.addResult('DELETE /pension-configurations/[id]', 'PASS', 'Successfully deleted pension configuration');
        } else {
          this.addResult('DELETE /pension-configurations/[id]', 'FAIL', `Failed to delete: ${JSON.stringify(data)}`);
        }
      } catch (error: any) {
        this.addResult('DELETE /pension-configurations/[id]', 'FAIL', `Error: ${error.message}`);
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Payroll Taxes API Tests...\n');
    
    await this.testTaxConfigurationCRUD();
    await this.testPensionConfigurationCRUD();
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`  - ${result.test}: ${result.message}`);
      });
    }
    
    console.log('\n🎉 Payroll Taxes API Tests Complete!');
    return { passed, failed, total };
  }
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  const tester = new PayrollTaxesAPITester();
  tester.runAllTests();
} else {
  // Node environment
  export { PayrollTaxesAPITester };
}
