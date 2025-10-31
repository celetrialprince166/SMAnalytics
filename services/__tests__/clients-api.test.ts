/**
 * Clients API Test Script
 * 
 * Tests the clients API endpoints for CRUD operations
 */

const BASE_URL = 'http://localhost:3000/api/clients';

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

class ClientsAPITester {
  private results: Array<{ test: string; status: 'PASS' | 'FAIL'; message: string }> = [];
  private createdClientId: string | null = null;

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

  // Test CRUD Operations
  async testCRUDOperations() {
    console.log('\n=== Testing Clients CRUD Operations ===');

    // Test 1: Get initial clients list
    const { response: getResponse, data: getData } = await this.makeRequest(
      `${BASE_URL}?organizationId=7224ab64-5bd7-4382-839d-6c415d872ba7&limit=10`
    );

    if (getResponse.ok) {
      this.logResult(
        'GET Clients List',
        'PASS',
        `Successfully fetched ${getData.data?.length || 0} clients`
      );
    } else {
      this.logResult(
        'GET Clients List',
        'FAIL',
        `Failed to fetch clients: ${getResponse.status} ${getResponse.statusText}`
      );
    }

    // Test 2: Create new client
    const newClient: Partial<Client> = {
      registrationDate: new Date().toISOString(),
      status: 'ACTIVE',
      companyName: 'Test Company Ltd',
      companyRegNo: 'C123456789',
      address: '123 Test Street, Accra',
      contactPerson: 'John Doe',
      emailAddress: 'john.doe@testcompany.com',
      phoneNumbers: '+233 24 123 4567',
      remarks: 'Test client for API testing',
    };

    const { response: createResponse, data: createData } = await this.makeRequest(
      `${BASE_URL}`,
      {
        method: 'POST',
        body: JSON.stringify(newClient),
      }
    );

    if (createResponse.ok && createData.data) {
      this.createdClientId = createData.data.id;
      this.logResult(
        'CREATE Client',
        'PASS',
        `Successfully created client with ID: ${this.createdClientId}, Client ID: ${createData.data.clientId}`
      );
    } else {
      this.logResult(
        'CREATE Client',
        'FAIL',
        `Failed to create client: ${createResponse.status} ${createResponse.statusText} - ${createData.error?.message || 'Unknown error'}`
      );
    }

    // Test 3: Get client by ID (if created successfully)
    if (this.createdClientId) {
      const { response: getByIdResponse, data: getByIdData } = await this.makeRequest(
        `${BASE_URL}/${this.createdClientId}`
      );

      if (getByIdResponse.ok && getByIdData.data) {
        this.logResult(
          'GET Client by ID',
          'PASS',
          `Successfully fetched client: ${getByIdData.data.companyName}`
        );
      } else {
        this.logResult(
          'GET Client by ID',
          'FAIL',
          `Failed to fetch client by ID: ${getByIdResponse.status} ${getByIdResponse.statusText}`
        );
      }

      // Test 4: Update client
      const updateData: Partial<Client> = {
        companyName: 'Updated Test Company Ltd',
        contactPerson: 'Jane Doe',
        emailAddress: 'jane.doe@testcompany.com',
        status: 'INACTIVE',
        remarks: 'Updated test client',
      };

      const { response: updateResponse, data: updateClientData } = await this.makeRequest(
        `${BASE_URL}/${this.createdClientId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      if (updateResponse.ok && updateClientData.data) {
        this.logResult(
          'UPDATE Client',
          'PASS',
          `Successfully updated client: ${updateClientData.data.companyName}`
        );
      } else {
        this.logResult(
          'UPDATE Client',
          'FAIL',
          `Failed to update client: ${updateResponse.status} ${updateResponse.statusText} - ${updateClientData.error?.message || 'Unknown error'}`
        );
      }
    }

    // Test 5: Search clients
    const { response: searchResponse, data: searchData } = await this.makeRequest(
      `${BASE_URL}?organizationId=7224ab64-5bd7-4382-839d-6c415d872ba7&search=Test&limit=10`
    );

    if (searchResponse.ok) {
      this.logResult(
        'SEARCH Clients',
        'PASS',
        `Successfully searched clients: found ${searchData.data?.length || 0} results`
      );
    } else {
      this.logResult(
        'SEARCH Clients',
        'FAIL',
        `Failed to search clients: ${searchResponse.status} ${searchResponse.statusText}`
      );
    }

    // Test 6: Filter clients by status
    const { response: filterResponse, data: filterData } = await this.makeRequest(
      `${BASE_URL}?organizationId=7224ab64-5bd7-4382-839d-6c415d872ba7&status=ACTIVE&limit=10`
    );

    if (filterResponse.ok) {
      this.logResult(
        'FILTER Clients by Status',
        'PASS',
        `Successfully filtered clients by status: found ${filterData.data?.length || 0} active clients`
      );
    } else {
      this.logResult(
        'FILTER Clients by Status',
        'FAIL',
        `Failed to filter clients: ${filterResponse.status} ${filterResponse.statusText}`
      );
    }

    // Test 7: Soft delete client (if created successfully)
    if (this.createdClientId) {
      const { response: deleteResponse, data: deleteData } = await this.makeRequest(
        `${BASE_URL}/${this.createdClientId}`,
        {
          method: 'DELETE',
        }
      );

      if (deleteResponse.ok) {
        this.logResult(
          'DELETE Client (Soft Delete)',
          'PASS',
          'Successfully soft deleted client'
        );
      } else {
        this.logResult(
          'DELETE Client (Soft Delete)',
          'FAIL',
          `Failed to delete client: ${deleteResponse.status} ${deleteResponse.statusText}`
        );
      }
    }
  }

  // Test Validation
  async testValidation() {
    console.log('\n=== Testing Client Validation ===');

    // Test 1: Missing required fields
    const invalidClient1: Partial<Client> = {
      status: 'ACTIVE',
      // Missing companyName, contactPerson, emailAddress, phoneNumbers, registrationDate
    };

    const { response: validation1Response, data: validation1Data } = await this.makeRequest(
      `${BASE_URL}`,
      {
        method: 'POST',
        body: JSON.stringify(invalidClient1),
      }
    );

    if (!validation1Response.ok && validation1Data.error) {
      this.logResult(
        'Validation - Missing Required Fields',
        'PASS',
        'Correctly rejected client with missing required fields'
      );
    } else {
      this.logResult(
        'Validation - Missing Required Fields',
        'FAIL',
        `Expected validation error but got: ${validation1Response.status} ${validation1Response.statusText}`
      );
    }

    // Test 2: Invalid email format
    const invalidClient2: Partial<Client> = {
      registrationDate: new Date().toISOString(),
      status: 'ACTIVE',
      companyName: 'Test Company',
      contactPerson: 'John Doe',
      emailAddress: 'invalid-email', // Invalid email format
      phoneNumbers: '+233 24 123 4567',
    };

    const { response: validation2Response, data: validation2Data } = await this.makeRequest(
      `${BASE_URL}`,
      {
        method: 'POST',
        body: JSON.stringify(invalidClient2),
      }
    );

    if (!validation2Response.ok && validation2Data.error?.message?.includes('email')) {
      this.logResult(
        'Validation - Invalid Email Format',
        'PASS',
        'Correctly rejected client with invalid email format'
      );
    } else {
      this.logResult(
        'Validation - Invalid Email Format',
        'FAIL',
        `Expected email validation error but got: ${validation2Response.status} ${validation2Response.statusText}`
      );
    }

    // Test 3: Duplicate email
    const duplicateClient: Partial<Client> = {
      registrationDate: new Date().toISOString(),
      status: 'ACTIVE',
      companyName: 'Another Test Company',
      contactPerson: 'Jane Smith',
      emailAddress: 'john.doe@testcompany.com', // Same email as previously created
      phoneNumbers: '+233 24 987 6543',
    };

    const { response: validation3Response, data: validation3Data } = await this.makeRequest(
      `${BASE_URL}`,
      {
        method: 'POST',
        body: JSON.stringify(duplicateClient),
      }
    );

    if (!validation3Response.ok && validation3Data.error?.message?.includes('email already exists')) {
      this.logResult(
        'Validation - Duplicate Email',
        'PASS',
        'Correctly rejected client with duplicate email'
      );
    } else {
      this.logResult(
        'Validation - Duplicate Email',
        'FAIL',
        `Expected duplicate email error but got: ${validation3Response.status} ${validation3Response.statusText}`
      );
    }

    // Test 4: Invalid status
    const invalidClient3: Partial<Client> = {
      registrationDate: new Date().toISOString(),
      status: 'INVALID_STATUS' as any,
      companyName: 'Test Company',
      contactPerson: 'John Doe',
      emailAddress: 'test@example.com',
      phoneNumbers: '+233 24 123 4567',
    };

    const { response: validation4Response, data: validation4Data } = await this.makeRequest(
      `${BASE_URL}`,
      {
        method: 'POST',
        body: JSON.stringify(invalidClient3),
      }
    );

    if (!validation4Response.ok && validation4Data.error) {
      this.logResult(
        'Validation - Invalid Status',
        'PASS',
        'Correctly rejected client with invalid status'
      );
    } else {
      this.logResult(
        'Validation - Invalid Status',
        'FAIL',
        `Expected status validation error but got: ${validation4Response.status} ${validation4Response.statusText}`
      );
    }
  }

  // Test Error Handling
  async testErrorHandling() {
    console.log('\n=== Testing Error Handling ===');

    // Test 1: Get non-existent client
    const { response: notFoundResponse, data: notFoundData } = await this.makeRequest(
      `${BASE_URL}/non-existent-id`
    );

    if (notFoundResponse.status === 404) {
      this.logResult(
        'Error Handling - Not Found',
        'PASS',
        'Correctly returned 404 for non-existent client'
      );
    } else {
      this.logResult(
        'Error Handling - Not Found',
        'FAIL',
        `Expected 404 but got: ${notFoundResponse.status} ${notFoundResponse.statusText}`
      );
    }

    // Test 2: Update non-existent client
    const { response: updateNotFoundResponse, data: updateNotFoundData } = await this.makeRequest(
      `${BASE_URL}/non-existent-id`,
      {
        method: 'PUT',
        body: JSON.stringify({ companyName: 'Updated Name' }),
      }
    );

    if (updateNotFoundResponse.status === 404) {
      this.logResult(
        'Error Handling - Update Not Found',
        'PASS',
        'Correctly returned 404 when updating non-existent client'
      );
    } else {
      this.logResult(
        'Error Handling - Update Not Found',
        'FAIL',
        `Expected 404 but got: ${updateNotFoundResponse.status} ${updateNotFoundResponse.statusText}`
      );
    }

    // Test 3: Delete non-existent client
    const { response: deleteNotFoundResponse, data: deleteNotFoundData } = await this.makeRequest(
      `${BASE_URL}/non-existent-id`,
      {
        method: 'DELETE',
      }
    );

    if (deleteNotFoundResponse.status === 404) {
      this.logResult(
        'Error Handling - Delete Not Found',
        'PASS',
        'Correctly returned 404 when deleting non-existent client'
      );
    } else {
      this.logResult(
        'Error Handling - Delete Not Found',
        'FAIL',
        `Expected 404 but got: ${deleteNotFoundResponse.status} ${deleteNotFoundResponse.statusText}`
      );
    }
  }

  // Test Client ID Generation
  async testClientIdGeneration() {
    console.log('\n=== Testing Client ID Generation ===');

    // Create multiple clients to test ID generation
    const clients = [
      {
        registrationDate: new Date().toISOString(),
        status: 'ACTIVE' as const,
        companyName: 'Company A',
        contactPerson: 'Person A',
        emailAddress: 'a@company.com',
        phoneNumbers: '+233 24 111 1111',
      },
      {
        registrationDate: new Date().toISOString(),
        status: 'ACTIVE' as const,
        companyName: 'Company B',
        contactPerson: 'Person B',
        emailAddress: 'b@company.com',
        phoneNumbers: '+233 24 222 2222',
      },
      {
        registrationDate: new Date().toISOString(),
        status: 'ACTIVE' as const,
        companyName: 'Company C',
        contactPerson: 'Person C',
        emailAddress: 'c@company.com',
        phoneNumbers: '+233 24 333 3333',
      },
    ];

    const createdClientIds: string[] = [];

    for (let i = 0; i < clients.length; i++) {
      const { response, data } = await this.makeRequest(
        `${BASE_URL}`,
        {
          method: 'POST',
          body: JSON.stringify(clients[i]),
        }
      );

      if (response.ok && data.data?.clientId) {
        createdClientIds.push(data.data.clientId);
        this.logResult(
          `Client ID Generation - Client ${i + 1}`,
          'PASS',
          `Generated client ID: ${data.data.clientId}`
        );
      } else {
        this.logResult(
          `Client ID Generation - Client ${i + 1}`,
          'FAIL',
          `Failed to create client ${i + 1}: ${response.status} ${response.statusText}`
        );
      }
    }

    // Verify ID sequence
    const expectedIds = ['CLT-0001', 'CLT-0002', 'CLT-0003'];
    const idsMatch = createdClientIds.every((id, index) => id === expectedIds[index]);

    if (idsMatch) {
      this.logResult(
        'Client ID Sequence Validation',
        'PASS',
        `Client IDs generated in correct sequence: ${createdClientIds.join(', ')}`
      );
    } else {
      this.logResult(
        'Client ID Sequence Validation',
        'FAIL',
        `Expected sequence ${expectedIds.join(', ')}, got ${createdClientIds.join(', ')}`
      );
    }

    // Clean up created clients
    for (const clientId of createdClientIds) {
      const client = createdClientIds.indexOf(clientId);
      const { response } = await this.makeRequest(
        `${BASE_URL}/${client}`,
        { method: 'DELETE' }
      );
      // Don't log cleanup results as they're not part of the test
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Clients API Tests...\n');
    
    try {
      await this.testCRUDOperations();
      await this.testValidation();
      await this.testErrorHandling();
      await this.testClientIdGeneration();
      
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
  const tester = new ClientsAPITester();
  tester.runAllTests();
}

export default ClientsAPITester;


