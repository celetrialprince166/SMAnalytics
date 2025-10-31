/**
 * Fixed Assets API Test Suite
 * 
 * Comprehensive testing for Fixed Assets API endpoints
 */

class FixedAssetsAPITester {
  private results: Array<{ test: string; status: 'PASS' | 'FAIL'; message: string }> = [];
  private baseUrl = 'http://localhost:3000/api/fixed-assets';

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
      throw new Error(`Request failed: ${error}`);
    }
  }

  private addResult(test: string, status: 'PASS' | 'FAIL', message: string) {
    this.results.push({ test, status, message });
    const statusIcon = status === 'PASS' ? '✅' : '❌';
    console.log(`${statusIcon} ${test}: ${message}`);
  }

  async testGetFixedAssets() {
    try {
      const { response, data } = await this.makeRequest(this.baseUrl);
      
      if (response.ok && Array.isArray(data.data)) {
        this.addResult('GET /api/fixed-assets', 'PASS', `Successfully fetched ${data.data.length} fixed assets`);
        return data.data;
      } else {
        this.addResult('GET /api/fixed-assets', 'FAIL', `Failed to fetch fixed assets: ${data.message || 'Unknown error'}`);
        return [];
      }
    } catch (error) {
      this.addResult('GET /api/fixed-assets', 'FAIL', `Request failed: ${error}`);
      return [];
    }
  }

  async testCreateFixedAsset() {
    try {
      const testAsset = {
        acquisitionDate: new Date().toISOString(),
        description: 'Test Office Equipment',
        category: 'EQUIPMENT',
        assetClass: 'Computers',
        valueAtCost: 1500.00,
        usefulLife: 5,
        depreciationRate: 20.0,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 100.00,
        status: 'ACTIVE',
        remarks: 'Test asset for API testing',
      };

      const { response, data } = await this.makeRequest(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(testAsset),
      });

      if (response.ok && data.data && data.data.id) {
        this.addResult('POST /api/fixed-assets', 'PASS', `Successfully created fixed asset with ID: ${data.data.id}`);
        return data.data;
      } else {
        this.addResult('POST /api/fixed-assets', 'FAIL', `Failed to create fixed asset: ${data.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      this.addResult('POST /api/fixed-assets', 'FAIL', `Request failed: ${error}`);
      return null;
    }
  }

  async testGetFixedAssetById(assetId: string) {
    try {
      const { response, data } = await this.makeRequest(`${this.baseUrl}/${assetId}`);

      if (response.ok && data.data && data.data.id === assetId) {
        this.addResult('GET /api/fixed-assets/[id]', 'PASS', `Successfully fetched fixed asset: ${assetId}`);
        return data.data;
      } else {
        this.addResult('GET /api/fixed-assets/[id]', 'FAIL', `Failed to fetch fixed asset: ${data.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      this.addResult('GET /api/fixed-assets/[id]', 'FAIL', `Request failed: ${error}`);
      return null;
    }
  }

  async testUpdateFixedAsset(assetId: string) {
    try {
      const updateData = {
        description: 'Updated Test Office Equipment',
        valueAtCost: 1750.00,
        remarks: 'Updated test asset for API testing',
      };

      const { response, data } = await this.makeRequest(`${this.baseUrl}/${assetId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (response.ok && data.data && data.data.id === assetId) {
        this.addResult('PUT /api/fixed-assets/[id]', 'PASS', `Successfully updated fixed asset: ${assetId}`);
        return data.data;
      } else {
        this.addResult('PUT /api/fixed-assets/[id]', 'FAIL', `Failed to update fixed asset: ${data.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      this.addResult('PUT /api/fixed-assets/[id]', 'FAIL', `Request failed: ${error}`);
      return null;
    }
  }

  async testGetDepreciationEntries(assetId: string) {
    try {
      const { response, data } = await this.makeRequest(`${this.baseUrl}/${assetId}/depreciation`);

      if (response.ok && Array.isArray(data.data)) {
        this.addResult('GET /api/fixed-assets/[id]/depreciation', 'PASS', `Successfully fetched ${data.data.length} depreciation entries`);
        return data.data;
      } else {
        this.addResult('GET /api/fixed-assets/[id]/depreciation', 'FAIL', `Failed to fetch depreciation entries: ${data.message || 'Unknown error'}`);
        return [];
      }
    } catch (error) {
      this.addResult('GET /api/fixed-assets/[id]/depreciation', 'FAIL', `Request failed: ${error}`);
      return [];
    }
  }

  async testRecordDepreciation(assetId: string) {
    try {
      const depreciationData = {
        period: new Date().toISOString(),
        depreciationAmount: 100.00,
      };

      const { response, data } = await this.makeRequest(`${this.baseUrl}/${assetId}/depreciation`, {
        method: 'POST',
        body: JSON.stringify(depreciationData),
      });

      if (response.ok && data.data && data.data.id) {
        this.addResult('POST /api/fixed-assets/[id]/depreciation', 'PASS', `Successfully recorded depreciation entry: ${data.data.id}`);
        return data.data;
      } else {
        this.addResult('POST /api/fixed-assets/[id]/depreciation', 'FAIL', `Failed to record depreciation: ${data.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      this.addResult('POST /api/fixed-assets/[id]/depreciation', 'FAIL', `Request failed: ${error}`);
      return null;
    }
  }

  async testValidationErrors() {
    try {
      // Test missing required fields
      const invalidAsset = {
        // Missing required fields
        category: 'EQUIPMENT',
        valueAtCost: 1000.00,
      };

      const { response, data } = await this.makeRequest(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(invalidAsset),
      });

      if (response.status === 400 && data.errors) {
        this.addResult('Validation Errors', 'PASS', `Properly validated required fields: ${data.errors.length} errors returned`);
      } else {
        this.addResult('Validation Errors', 'FAIL', `Expected validation errors but got: ${response.status}`);
      }
    } catch (error) {
      this.addResult('Validation Errors', 'FAIL', `Request failed: ${error}`);
    }
  }

  async testDeleteFixedAsset(assetId: string) {
    try {
      const { response, data } = await this.makeRequest(`${this.baseUrl}/${assetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        this.addResult('DELETE /api/fixed-assets/[id]', 'PASS', `Successfully deleted fixed asset: ${assetId}`);
        return true;
      } else {
        this.addResult('DELETE /api/fixed-assets/[id]', 'FAIL', `Failed to delete fixed asset: ${data.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      this.addResult('DELETE /api/fixed-assets/[id]', 'FAIL', `Request failed: ${error}`);
      return false;
    }
  }

  async testCRUDOperations() {
    console.log('🧪 Testing Fixed Assets CRUD Operations...\n');

    // Test GET all assets
    const existingAssets = await this.testGetFixedAssets();

    // Test CREATE asset
    const createdAsset = await this.testCreateFixedAsset();
    if (!createdAsset) {
      console.log('❌ Cannot continue tests without creating an asset\n');
      return;
    }

    // Test GET by ID
    await this.testGetFixedAssetById(createdAsset.id);

    // Test UPDATE asset
    await this.testUpdateFixedAsset(createdAsset.id);

    // Test GET depreciation entries
    await this.testGetDepreciationEntries(createdAsset.id);

    // Test RECORD depreciation
    await this.testRecordDepreciation(createdAsset.id);

    // Test validation
    await this.testValidationErrors();

    // Test DELETE asset
    await this.testDeleteFixedAsset(createdAsset.id);

    console.log('\n🏁 Fixed Assets CRUD Operations Complete!\n');
  }

  async runAllTests() {
    console.log('🚀 Starting Fixed Assets API Tests...\n');
    console.log('=' * 50);
    
    await this.testCRUDOperations();

    console.log('=' * 50);
    console.log('📊 Test Results Summary:');
    console.log('=' * 50);

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${total}`);
    console.log(`🎯 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`  - ${result.test}: ${result.message}`);
      });
    }

    console.log('\n🏆 Fixed Assets API Testing Complete!');
    return { passed, failed, total };
  }
}

// Export for use in other test files
export { FixedAssetsAPITester };

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof require !== 'undefined') {
  const tester = new FixedAssetsAPITester();
  tester.runAllTests().then(results => {
    console.log('Final Results:', results);
  }).catch(error => {
    console.error('Test execution failed:', error);
  });
}

