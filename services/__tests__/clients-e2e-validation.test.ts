/**
 * End-to-End Validation Test for Clients Tab
 * 
 * This test simulates the complete user workflow:
 * 1. Load Clients tab (GET clients)
 * 2. Create new client via UI form
 * 3. Edit existing client
 * 4. Verify data persists across operations
 * 5. Test search and filtering
 * 6. Test soft delete functionality
 */

const BASE_URL = 'http://localhost:3000/api/clients';
const ORGANIZATION_ID = '7224ab64-5bd7-4382-839d-6c415d872ba7';

interface Client {
  id?: string;
  clientId?: string;
  registrationDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  companyName: string;
  companyRegNo?: string;
  address?: string;
  contactPerson: string;
  emailAddress: string;
  phoneNumbers: string;
  remarks?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  organizationId?: string;
}

class ClientsE2EValidator {
  private results: Array<{ test: string; status: 'PASS' | 'FAIL'; message: string }> = [];
  private testClients: Client[] = [];

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
      
      return {
        ok: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        data: { error: error.message },
      };
    }
  }

  private logResult(test: string, status: 'PASS' | 'FAIL', message: string) {
    this.results.push({ test, status, message });
    const emoji = status === 'PASS' ? '✅' : '❌';
    console.log(`[${status}] ${test}: ${message}`);
  }

  async testUILoading() {
    console.log('\n=== Testing UI Loading (GET Clients) ===');

    const response = await this.makeRequest(BASE_URL);
    
    if (response.ok && response.data.success) {
      const clients = response.data.data.data || [];
      this.logResult('UI Loading - GET Clients', 'PASS', 
        `Successfully loaded ${clients.length} clients from database`);
      
      // Store clients for further testing
      this.testClients = clients;
      return true;
    } else {
      this.logResult('UI Loading - GET Clients', 'FAIL', 
        `Failed to load clients: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  }

  async testCreateClientViaUI() {
    console.log('\n=== Testing Create Client via UI Form ===');

    const newClient: Partial<Client> = {
      companyName: 'E2E Test Company',
      contactPerson: 'John Smith',
      emailAddress: `john.smith.e2e.${Date.now()}@testcompany.com`,
      phoneNumbers: '555-0123',
      status: 'ACTIVE',
      registrationDate: new Date().toISOString(),
      remarks: 'Created via E2E test',
      organizationId: ORGANIZATION_ID,
    };

    const response = await this.makeRequest(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(newClient),
    });

    if (response.ok && response.data.success) {
      const createdClient = response.data.data;
      this.logResult('UI Create Client', 'PASS', 
        `Successfully created client: ${createdClient.companyName} (ID: ${createdClient.clientId})`);
      
      // Store for further testing
      this.testClients.push(createdClient);
      return createdClient;
    } else {
      this.logResult('UI Create Client', 'FAIL', 
        `Failed to create client: ${response.data.error || 'Unknown error'}`);
      return null;
    }
  }

  async testEditClientViaUI(client: Client) {
    console.log('\n=== Testing Edit Client via UI Form ===');

    const updates = {
      companyName: `${client.companyName} - Updated`,
      contactPerson: 'Jane Updated',
      remarks: 'Updated via E2E test',
    };

    const response = await this.makeRequest(`${BASE_URL}/${client.id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (response.ok && response.data.success) {
      const updatedClient = response.data.data;
      this.logResult('UI Edit Client', 'PASS', 
        `Successfully updated client: ${updatedClient.companyName}`);
      return updatedClient;
    } else {
      this.logResult('UI Edit Client', 'FAIL', 
        `Failed to update client: ${response.data.error || 'Unknown error'}`);
      return null;
    }
  }

  async testDataPersistence() {
    console.log('\n=== Testing Data Persistence ===');

    // Wait a moment to ensure data is persisted
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await this.makeRequest(BASE_URL);
    
    if (response.ok && response.data.success) {
      const clients = response.data.data.data || [];
      const testClient = clients.find(c => c.companyName.includes('E2E Test Company'));
      
      if (testClient) {
        this.logResult('Data Persistence', 'PASS', 
          `Client data persisted correctly: ${testClient.companyName}`);
        return true;
      } else {
        this.logResult('Data Persistence', 'FAIL', 
          'Created client not found in subsequent fetch');
        return false;
      }
    } else {
      this.logResult('Data Persistence', 'FAIL', 
        `Failed to verify persistence: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  }

  async testSearchAndFiltering() {
    console.log('\n=== Testing Search and Filtering ===');

    // Test search functionality
    const searchResponse = await this.makeRequest(`${BASE_URL}?search=E2E`);
    
    if (searchResponse.ok && searchResponse.data.success) {
      const searchResults = searchResponse.data.data.data || [];
      this.logResult('Search Functionality', 'PASS', 
        `Search found ${searchResults.length} matching clients`);
    } else {
      this.logResult('Search Functionality', 'FAIL', 
        `Search failed: ${searchResponse.data.error || 'Unknown error'}`);
    }

    // Test status filtering
    const filterResponse = await this.makeRequest(`${BASE_URL}?status=ACTIVE`);
    
    if (filterResponse.ok && filterResponse.data.success) {
      const activeClients = filterResponse.data.data.data || [];
      this.logResult('Status Filtering', 'PASS', 
        `Filter found ${activeClients.length} active clients`);
    } else {
      this.logResult('Status Filtering', 'FAIL', 
        `Filtering failed: ${filterResponse.data.error || 'Unknown error'}`);
    }
  }

  async testSoftDelete(client: Client) {
    console.log('\n=== Testing Soft Delete via UI ===');

    const response = await this.makeRequest(`${BASE_URL}/${client.id}`, {
      method: 'DELETE',
    });

    if (response.ok && response.data.success) {
      this.logResult('UI Soft Delete', 'PASS', 
        `Successfully soft deleted client: ${client.companyName}`);
      
      // Verify soft delete by checking isActive status
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const verifyResponse = await this.makeRequest(`${BASE_URL}/${client.id}`);
      if (verifyResponse.ok && verifyResponse.data.success) {
        const deletedClient = verifyResponse.data.data;
        if (deletedClient.isActive === false) {
          this.logResult('Soft Delete Verification', 'PASS', 
            'Client correctly marked as inactive');
        } else {
          this.logResult('Soft Delete Verification', 'FAIL', 
            'Client still marked as active after delete');
        }
      }
    } else {
      this.logResult('UI Soft Delete', 'FAIL', 
        `Failed to delete client: ${response.data.error || 'Unknown error'}`);
    }
  }

  async testClientIDGeneration() {
    console.log('\n=== Testing Client ID Auto-Generation ===');

    const testClient: Partial<Client> = {
      companyName: 'ID Generation Test',
      contactPerson: 'Test Person',
      emailAddress: `id.test.${Date.now()}@testcompany.com`,
      phoneNumbers: '555-9999',
      status: 'ACTIVE',
      registrationDate: new Date().toISOString(),
      organizationId: ORGANIZATION_ID,
    };

    const response = await this.makeRequest(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(testClient),
    });

    if (response.ok && response.data.success) {
      const createdClient = response.data.data;
      const expectedPattern = /^CLT-\d{4}$/;
      
      if (expectedPattern.test(createdClient.clientId)) {
        this.logResult('Client ID Generation', 'PASS', 
          `Generated correct client ID: ${createdClient.clientId}`);
      } else {
        this.logResult('Client ID Generation', 'FAIL', 
          `Invalid client ID format: ${createdClient.clientId}`);
      }
    } else {
      this.logResult('Client ID Generation', 'FAIL', 
        `Failed to create client for ID test: ${response.data.error || 'Unknown error'}`);
    }
  }

  async runEndToEndValidation() {
    console.log('🚀 Starting Clients Tab End-to-End Validation...\n');
    
    try {
      // 1. Test UI Loading
      const loadSuccess = await this.testUILoading();
      if (!loadSuccess) {
        console.log('❌ Initial load failed, stopping E2E validation');
        return;
      }

      // 2. Test Create Client via UI
      const createdClient = await this.testCreateClientViaUI();
      if (!createdClient) {
        console.log('❌ Client creation failed, stopping E2E validation');
        return;
      }

      // 3. Test Edit Client via UI
      const updatedClient = await this.testEditClientViaUI(createdClient);
      if (!updatedClient) {
        console.log('⚠️ Client update failed, continuing with other tests');
      }

      // 4. Test Data Persistence
      await this.testDataPersistence();

      // 5. Test Search and Filtering
      await this.testSearchAndFiltering();

      // 6. Test Client ID Generation
      await this.testClientIDGeneration();

      // 7. Test Soft Delete (use the created client)
      await this.testSoftDelete(createdClient);

      // Print summary
      console.log('\n=== End-to-End Validation Summary ===');
      const passed = this.results.filter(r => r.status === 'PASS').length;
      const failed = this.results.filter(r => r.status === 'FAIL').length;
      const total = this.results.length;

      console.log(`✅ Passed: ${passed}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`📊 Total: ${total}`);

      if (failed === 0) {
        console.log('\n🎉 All end-to-end validation tests passed!');
        console.log('✅ Clients tab is fully functional with API backend');
      } else {
        console.log('\n⚠️ Some end-to-end validation tests failed.');
        console.log('Check the logs above for details.');
      }

    } catch (error) {
      console.error('❌ End-to-end validation execution failed:', error);
    }
  }
}

// Run the validation if this file is executed directly
if (typeof window === 'undefined') {
  const validator = new ClientsE2EValidator();
  validator.runEndToEndValidation();
}

export default ClientsE2EValidator;


