/**
 * Employee API Test Suite
 * 
 * Comprehensive testing for employee API endpoints
 */

class EmployeeAPITester {
  private results: Array<{ test: string; status: 'PASS' | 'FAIL'; message: string }> = [];
  private baseUrl = 'http://localhost:3000/api/employees';

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
      return { response: null, data: null, error };
    }
  }

  private addResult(test: string, status: 'PASS' | 'FAIL', message: string) {
    this.results.push({ test, status, message });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test}: ${message}`);
  }

  async testGetEmployees() {
    console.log('\n📋 Testing GET /api/employees...');
    
    const { response, data } = await this.makeRequest(this.baseUrl);
    
    if (!response) {
      this.addResult('GET Employees', 'FAIL', 'No response received');
      return;
    }

    if (response.ok && data.success && Array.isArray(data.data)) {
      this.addResult('GET Employees', 'PASS', `Retrieved ${data.data.length} employees`);
    } else {
      this.addResult('GET Employees', 'FAIL', `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    }
  }

  async testCreateEmployee() {
    console.log('\n➕ Testing POST /api/employees...');
    
    const employeeData = {
      entryDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      surname: 'Test',
      firstName: 'John',
      otherNames: 'Doe',
      dateOfBirth: '1990-01-01',
      placeOfBirth: 'Accra',
      nationality: 'GHANAIAN',
      gender: 'MALE',
      maritalStatus: 'SINGLE',
      numberOfChildren: 0,
      residentialAddress: '123 Test Street',
      emailAddress: `test${Date.now()}@example.com`,
      phoneNumber: '0241234567',
      position: 'Developer',
      department: 'IT',
      basicSalary: 5000.00,
      taxNumber: 'TAX123456',
      ssnitNumber: 'SSN123456'
    };

    const { response, data } = await this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });

    if (!response) {
      this.addResult('CREATE Employee', 'FAIL', 'No response received');
      return null;
    }

    if (response.ok && data.success && data.data.id) {
      this.addResult('CREATE Employee', 'PASS', `Created employee with ID: ${data.data.id}`);
      return data.data;
    } else {
      this.addResult('CREATE Employee', 'FAIL', `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
      return null;
    }
  }

  async testGetEmployeeById(employeeId: string) {
    console.log('\n🔍 Testing GET /api/employees/[id]...');
    
    const { response, data } = await this.makeRequest(`${this.baseUrl}/${employeeId}`);

    if (!response) {
      this.addResult('GET Employee by ID', 'FAIL', 'No response received');
      return;
    }

    if (response.ok && data.success && data.data.id === employeeId) {
      this.addResult('GET Employee by ID', 'PASS', `Retrieved employee: ${data.data.firstName} ${data.data.surname}`);
    } else {
      this.addResult('GET Employee by ID', 'FAIL', `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    }
  }

  async testUpdateEmployee(employeeId: string) {
    console.log('\n✏️ Testing PUT /api/employees/[id]...');
    
    const updateData = {
      position: 'Senior Developer',
      basicSalary: 7500.00,
      department: 'Engineering'
    };

    const { response, data } = await this.makeRequest(`${this.baseUrl}/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    if (!response) {
      this.addResult('UPDATE Employee', 'FAIL', 'No response received');
      return;
    }

    if (response.ok && data.success && data.data.position === 'Senior Developer') {
      this.addResult('UPDATE Employee', 'PASS', `Updated employee position to: ${data.data.position}`);
    } else {
      this.addResult('UPDATE Employee', 'FAIL', `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    }
  }

  async testValidationErrors() {
    console.log('\n🚫 Testing validation errors...');
    
    // Test missing required fields
    const invalidData = {
      // Missing firstName, surname, emailAddress, phoneNumber, basicSalary
      status: 'ACTIVE',
      dateOfBirth: '1990-01-01',
      nationality: 'GHANAIAN',
      gender: 'MALE',
      maritalStatus: 'SINGLE'
    };

    const { response, data } = await this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    if (!response) {
      this.addResult('Validation Errors', 'FAIL', 'No response received');
      return;
    }

    if (!response.ok && data.success === false && data.error?.code === 'VALIDATION_ERROR') {
      this.addResult('Validation Errors', 'PASS', 'Validation errors handled correctly');
    } else {
      this.addResult('Validation Errors', 'FAIL', `Expected validation error, got: ${JSON.stringify(data)}`);
    }
  }

  async testEmailValidation() {
    console.log('\n📧 Testing email validation...');
    
    const invalidEmailData = {
      entryDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      surname: 'Test',
      firstName: 'Email',
      dateOfBirth: '1990-01-01',
      nationality: 'GHANAIAN',
      gender: 'MALE',
      maritalStatus: 'SINGLE',
      numberOfChildren: 0,
      emailAddress: 'invalid-email',
      phoneNumber: '0241234567',
      basicSalary: 5000.00
    };

    const { response, data } = await this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(invalidEmailData),
    });

    if (!response) {
      this.addResult('Email Validation', 'FAIL', 'No response received');
      return;
    }

    if (!response.ok && data.success === false && data.error?.code === 'VALIDATION_ERROR') {
      this.addResult('Email Validation', 'PASS', 'Invalid email format rejected');
    } else {
      this.addResult('Email Validation', 'FAIL', `Expected email validation error, got: ${JSON.stringify(data)}`);
    }
  }

  async testDuplicateEmail(employeeId: string) {
    console.log('\n🔄 Testing duplicate email prevention...');
    
    // First, get the existing employee to get their email
    const { response: getResponse, data: getData } = await this.makeRequest(`${this.baseUrl}/${employeeId}`);
    
    if (!getResponse?.ok || !getData.success) {
      this.addResult('Duplicate Email Test', 'FAIL', 'Could not retrieve existing employee');
      return;
    }

    const existingEmail = getData.data.emailAddress;

    // Try to create another employee with the same email
    const duplicateData = {
      entryDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      surname: 'Duplicate',
      firstName: 'Test',
      dateOfBirth: '1990-01-01',
      nationality: 'GHANAIAN',
      gender: 'MALE',
      maritalStatus: 'SINGLE',
      numberOfChildren: 0,
      emailAddress: existingEmail,
      phoneNumber: '0247654321',
      basicSalary: 4000.00
    };

    const { response, data } = await this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(duplicateData),
    });

    if (!response) {
      this.addResult('Duplicate Email Test', 'FAIL', 'No response received');
      return;
    }

    if (!response.ok && data.success === false && data.error?.code === 'VALIDATION_ERROR') {
      this.addResult('Duplicate Email Test', 'PASS', 'Duplicate email prevented');
    } else {
      this.addResult('Duplicate Email Test', 'FAIL', `Expected duplicate email error, got: ${JSON.stringify(data)}`);
    }
  }

  async testDeleteEmployee(employeeId: string) {
    console.log('\n🗑️ Testing DELETE /api/employees/[id]...');
    
    const { response, data } = await this.makeRequest(`${this.baseUrl}/${employeeId}`, {
      method: 'DELETE',
    });

    if (!response) {
      this.addResult('DELETE Employee', 'FAIL', 'No response received');
      return;
    }

    if (response.ok && data.success) {
      this.addResult('DELETE Employee', 'PASS', 'Employee soft deleted successfully');
    } else {
      this.addResult('DELETE Employee', 'FAIL', `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    }
  }

  async testEmployeeIdGeneration() {
    console.log('\n🆔 Testing employee ID auto-generation...');
    
    const employeeData = {
      entryDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      surname: 'IDTest',
      firstName: 'Auto',
      dateOfBirth: '1990-01-01',
      nationality: 'GHANAIAN',
      gender: 'MALE',
      maritalStatus: 'SINGLE',
      numberOfChildren: 0,
      emailAddress: `autoid${Date.now()}@example.com`,
      phoneNumber: '0249999999',
      basicSalary: 3000.00
    };

    const { response, data } = await this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });

    if (!response) {
      this.addResult('Employee ID Generation', 'FAIL', 'No response received');
      return null;
    }

    if (response.ok && data.success && data.data.employeeId?.match(/^EMP-\d{4}$/)) {
      this.addResult('Employee ID Generation', 'PASS', `Generated employee ID: ${data.data.employeeId}`);
      return data.data;
    } else {
      this.addResult('Employee ID Generation', 'FAIL', `Expected EMP-XXXX format, got: ${data.data?.employeeId}`);
      return null;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Employee API Tests...\n');
    
    // Test basic CRUD operations
    await this.testGetEmployees();
    const createdEmployee = await this.testCreateEmployee();
    
    if (createdEmployee) {
      await this.testGetEmployeeById(createdEmployee.id);
      await this.testUpdateEmployee(createdEmployee.id);
      await this.testDuplicateEmail(createdEmployee.id);
      await this.testDeleteEmployee(createdEmployee.id);
    }
    
    // Test validation and edge cases
    await this.testValidationErrors();
    await this.testEmailValidation();
    await this.testEmployeeIdGeneration();
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }
    
    console.log('\n✨ Employee API testing completed!');
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  const tester = new EmployeeAPITester();
  tester.runAllTests().catch(console.error);
}

export { EmployeeAPITester };
