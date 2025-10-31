/**
 * Taxation API Test Script
 * 
 * Tests the taxation API endpoints for VAT and Withholding Tax configurations
 */

const BASE_URL = 'http://localhost:3000/api/taxation';

interface VATTaxConfig {
  id?: string;
  nhil: number;
  getfund: number;
  covid19: number;
  vat: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  organizationId?: string;
}

interface WithholdingTaxConfig {
  id?: string;
  nonIndividualThreshold: number;
  nonIndividualRate: number;
  individualRate: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  organizationId?: string;
}

class TaxationAPITester {
  private results: Array<{ test: string; status: 'PASS' | 'FAIL'; message: string }> = [];

  private async makeRequest(url: string, options: RequestInit = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      return { response, data };
    } catch (error) {
      return { 
        response: { ok: false, status: 500, statusText: 'Network Error' }, 
        data: { error: error.message } 
      };
    }
  }

  private logResult(test: string, status: 'PASS' | 'FAIL', message: string) {
    this.results.push({ test, status, message });
    console.log(`[${status}] ${test}: ${message}`);
  }

  // VAT Tax Configuration Tests
  async testVATTaxConfiguration() {
    console.log('\n=== Testing VAT Tax Configuration API ===');

    // Test 1: Get initial VAT configuration (should be null or empty)
    const { response: getResponse, data: getData } = await this.makeRequest(
      `${BASE_URL}/vat-configuration`
    );

    if (getResponse.ok) {
      this.logResult(
        'GET VAT Configuration',
        'PASS',
        `Successfully fetched VAT configuration: ${JSON.stringify(getData.data)}`
      );
    } else {
      this.logResult(
        'GET VAT Configuration',
        'FAIL',
        `Failed to fetch VAT configuration: ${getResponse.status} ${getResponse.statusText}`
      );
    }

    // Test 2: Create VAT configuration
    const vatConfig: Partial<VATTaxConfig> = {
      nhil: 2.5,
      getfund: 2.5,
      covid19: 1.0,
      vat: 12.5,
    };

    const { response: createResponse, data: createData } = await this.makeRequest(
      `${BASE_URL}/vat-configuration`,
      {
        method: 'POST',
        body: JSON.stringify(vatConfig),
      }
    );

    if (createResponse.ok) {
      this.logResult(
        'CREATE VAT Configuration',
        'PASS',
        `Successfully created VAT configuration with ID: ${createData.data?.id}`
      );
    } else {
      this.logResult(
        'CREATE VAT Configuration',
        'FAIL',
        `Failed to create VAT configuration: ${createResponse.status} ${createResponse.statusText} - ${createData.message}`
      );
    }

    // Test 3: Update VAT configuration
    const updatedVATConfig: Partial<VATTaxConfig> = {
      nhil: 3.0,
      getfund: 2.5,
      covid19: 1.5,
      vat: 15.0,
    };

    const { response: updateResponse, data: updateData } = await this.makeRequest(
      `${BASE_URL}/vat-configuration`,
      {
        method: 'POST',
        body: JSON.stringify(updatedVATConfig),
      }
    );

    if (updateResponse.ok) {
      this.logResult(
        'UPDATE VAT Configuration',
        'PASS',
        `Successfully updated VAT configuration: ${JSON.stringify(updateData.data)}`
      );
    } else {
      this.logResult(
        'UPDATE VAT Configuration',
        'FAIL',
        `Failed to update VAT configuration: ${updateResponse.status} ${updateResponse.statusText} - ${updateData.message}`
      );
    }

    // Test 4: Validation - Invalid rates
    const invalidVATConfig: Partial<VATTaxConfig> = {
      nhil: -1.0, // Invalid: negative rate
      getfund: 150.0, // Invalid: rate over 100%
      covid19: 1.0,
      vat: 12.5,
    };

    const { response: validationResponse, data: validationData } = await this.makeRequest(
      `${BASE_URL}/vat-configuration`,
      {
        method: 'POST',
        body: JSON.stringify(invalidVATConfig),
      }
    );

    if (!validationResponse.ok && validationData.message?.includes('rates must be numbers between 0 and 100')) {
      this.logResult(
        'VAT Configuration Validation',
        'PASS',
        'Correctly rejected invalid VAT rates'
      );
    } else {
      this.logResult(
        'VAT Configuration Validation',
        'FAIL',
        `Expected validation error but got: ${validationResponse.status} ${validationResponse.statusText}`
      );
    }
  }

  // Withholding Tax Configuration Tests
  async testWithholdingTaxConfiguration() {
    console.log('\n=== Testing Withholding Tax Configuration API ===');

    // Test 1: Get initial withholding tax configuration
    const { response: getResponse, data: getData } = await this.makeRequest(
      `${BASE_URL}/withholding-tax-configuration`
    );

    if (getResponse.ok) {
      this.logResult(
        'GET Withholding Tax Configuration',
        'PASS',
        `Successfully fetched withholding tax configuration: ${JSON.stringify(getData.data)}`
      );
    } else {
      this.logResult(
        'GET Withholding Tax Configuration',
        'FAIL',
        `Failed to fetch withholding tax configuration: ${getResponse.status} ${getResponse.statusText}`
      );
    }

    // Test 2: Create withholding tax configuration
    const withholdingConfig: Partial<WithholdingTaxConfig> = {
      nonIndividualThreshold: 2000,
      nonIndividualRate: 5.0,
      individualRate: 7.5,
    };

    const { response: createResponse, data: createData } = await this.makeRequest(
      `${BASE_URL}/withholding-tax-configuration`,
      {
        method: 'POST',
        body: JSON.stringify(withholdingConfig),
      }
    );

    if (createResponse.ok) {
      this.logResult(
        'CREATE Withholding Tax Configuration',
        'PASS',
        `Successfully created withholding tax configuration with ID: ${createData.data?.id}`
      );
    } else {
      this.logResult(
        'CREATE Withholding Tax Configuration',
        'FAIL',
        `Failed to create withholding tax configuration: ${createResponse.status} ${createResponse.statusText} - ${createData.message}`
      );
    }

    // Test 3: Update withholding tax configuration
    const updatedWithholdingConfig: Partial<WithholdingTaxConfig> = {
      nonIndividualThreshold: 2500,
      nonIndividualRate: 6.0,
      individualRate: 8.0,
    };

    const { response: updateResponse, data: updateData } = await this.makeRequest(
      `${BASE_URL}/withholding-tax-configuration`,
      {
        method: 'POST',
        body: JSON.stringify(updatedWithholdingConfig),
      }
    );

    if (updateResponse.ok) {
      this.logResult(
        'UPDATE Withholding Tax Configuration',
        'PASS',
        `Successfully updated withholding tax configuration: ${JSON.stringify(updateData.data)}`
      );
    } else {
      this.logResult(
        'UPDATE Withholding Tax Configuration',
        'FAIL',
        `Failed to update withholding tax configuration: ${updateResponse.status} ${updateResponse.statusText} - ${updateData.message}`
      );
    }

    // Test 4: Validation - Invalid threshold
    const invalidWithholdingConfig: Partial<WithholdingTaxConfig> = {
      nonIndividualThreshold: -100, // Invalid: negative threshold
      nonIndividualRate: 5.0,
      individualRate: 7.5,
    };

    const { response: validationResponse, data: validationData } = await this.makeRequest(
      `${BASE_URL}/withholding-tax-configuration`,
      {
        method: 'POST',
        body: JSON.stringify(invalidWithholdingConfig),
      }
    );

    if (!validationResponse.ok && validationData.message?.includes('positive number')) {
      this.logResult(
        'Withholding Tax Configuration Validation',
        'PASS',
        'Correctly rejected invalid threshold'
      );
    } else {
      this.logResult(
        'Withholding Tax Configuration Validation',
        'FAIL',
        `Expected validation error but got: ${validationResponse.status} ${validationResponse.statusText}`
      );
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Taxation API Tests...\n');
    
    try {
      await this.testVATTaxConfiguration();
      await this.testWithholdingTaxConfiguration();
      
      // Print summary
      console.log('\n=== Test Summary ===');
      const passed = this.results.filter(r => r.status === 'PASS').length;
      const failed = this.results.filter(r => r.status === 'FAIL').length;
      
      console.log(`✅ Passed: ${passed}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`📊 Total: ${this.results.length}`);
      
      if (failed === 0) {
        console.log('\n🎉 All tests passed!');
      } else {
        console.log('\n⚠️  Some tests failed. Check the logs above for details.');
      }
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
    }
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  const tester = new TaxationAPITester();
  tester.runAllTests();
}

export default TaxationAPITester;

