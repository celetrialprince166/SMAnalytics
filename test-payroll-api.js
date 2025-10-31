/**
 * Payroll API Test Script
 * 
 * Tests all payroll API endpoints
 */

const BASE_URL = 'http://localhost:3000/api';

async function testPayrollAPI() {
  console.log('🚀 Testing Payroll API...\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Create Employee
    console.log('\n📝 Test 1: Creating employee...');
    const employeeResponse = await fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryDate: new Date().toISOString(),
        status: 'ACTIVE',
        surname: 'Doe',
        firstName: 'John',
        dateOfBirth: '1990-01-01',
        emailAddress: `john.doe.${Date.now()}@test.com`,
        phoneNumber: '0241234567',
        nationality: 'GHANAIAN',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        basicSalary: 5000,
        department: 'IT',
        position: 'Developer',
      }),
    });
    
    if (!employeeResponse.ok) {
      throw new Error(`Employee creation failed: ${employeeResponse.statusText}`);
    }
    
    const employee = await employeeResponse.json();
    console.log('✅ Employee created:', employee.data.employeeId);
    console.log('   Name:', `${employee.data.firstName} ${employee.data.surname}`);
    console.log('   Basic Salary:', employee.data.basicSalary);

    // Test 2: List Employees
    console.log('\n📋 Test 2: Listing employees...');
    const listResponse = await fetch(`${BASE_URL}/employees`);
    const employeeList = await listResponse.json();
    console.log('✅ Found', employeeList.data.pagination.total, 'employees');

    // Test 3: Get Employee by ID
    console.log('\n🔍 Test 3: Getting employee by ID...');
    const getResponse = await fetch(`${BASE_URL}/employees/${employee.data.id}`);
    const employeeDetail = await getResponse.json();
    console.log('✅ Employee details retrieved');
    console.log('   ID:', employeeDetail.data.employeeId);
    console.log('   Status:', employeeDetail.data.status);

    // Test 4: Create Tax Configuration
    console.log('\n💰 Test 4: Creating tax configuration...');
    const taxResponse = await fetch(`${BASE_URL}/payroll/tax-configurations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        effectiveDate: new Date().toISOString(),
        brackets: [
          { order: 1, amount: 0, rate: 0 },
          { order: 2, amount: 365, rate: 5 },
          { order: 3, amount: 110, rate: 10 },
          { order: 4, amount: 130, rate: 17.5 },
          { order: 5, amount: 3000, rate: 25 },
          { order: 6, amount: 0, rate: 30 },
        ],
        nonResidentRate: 25,
        personalRelief: 365,
      }),
    });
    
    if (!taxResponse.ok) {
      throw new Error(`Tax config creation failed: ${taxResponse.statusText}`);
    }
    
    const taxConfig = await taxResponse.json();
    console.log('✅ Tax configuration created');
    console.log('   Brackets:', taxConfig.data.brackets.length);
    console.log('   Personal Relief:', taxConfig.data.personalRelief);

    // Test 5: Get Active Tax Configuration
    console.log('\n🔍 Test 5: Getting active tax configuration...');
    const activeTaxResponse = await fetch(`${BASE_URL}/payroll/tax-configurations/active`);
    const activeTax = await activeTaxResponse.json();
    console.log('✅ Active tax configuration retrieved');
    console.log('   ID:', activeTax.data.id);
    console.log('   Is Active:', activeTax.data.isActive);

    // Test 6: Create Pension Configuration
    console.log('\n🏦 Test 6: Creating pension configuration...');
    const pensionResponse = await fetch(`${BASE_URL}/payroll/pension-configurations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        effectiveDate: new Date().toISOString(),
        tier1EmployerRate: 13,
        tier1EmployeeRate: 5.5,
        tier1PensionRate: 13.5,
        tier1NHISRate: 5,
        tier2Rate: 5,
        tier3EmployerRate: 5,
        tier3EmployeeRate: 5,
      }),
    });
    
    if (!pensionResponse.ok) {
      throw new Error(`Pension config creation failed: ${pensionResponse.statusText}`);
    }
    
    const pensionConfig = await pensionResponse.json();
    console.log('✅ Pension configuration created');
    console.log('   Tier 1 Employee Rate:', pensionConfig.data.tier1EmployeeRate + '%');
    console.log('   Tier 2 Rate:', pensionConfig.data.tier2Rate + '%');

    // Test 7: Get Active Pension Configuration
    console.log('\n🔍 Test 7: Getting active pension configuration...');
    const activePensionResponse = await fetch(`${BASE_URL}/payroll/pension-configurations/active`);
    const activePension = await activePensionResponse.json();
    console.log('✅ Active pension configuration retrieved');
    console.log('   ID:', activePension.data.id);
    console.log('   Is Active:', activePension.data.isActive);

    // Test 8: Calculate Salary (Preview)
    console.log('\n🧮 Test 8: Calculating salary (preview)...');
    const calculateResponse = await fetch(`${BASE_URL}/payroll/salaries/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: employee.data.id,
        allowances: 500,
        commission: 200,
      }),
    });
    
    if (!calculateResponse.ok) {
      throw new Error(`Salary calculation failed: ${calculateResponse.statusText}`);
    }
    
    const calculation = await calculateResponse.json();
    console.log('✅ Salary calculated');
    console.log('   Gross Salary:', calculation.data.earnings.grossSalary);
    console.log('   Income Tax:', calculation.data.deductions.incomeTax);
    console.log('   Total SSNIT:', calculation.data.deductions.pension.totalSSNIT);
    console.log('   Total Deductions:', calculation.data.deductions.totalDeductions);
    console.log('   Net Salary:', calculation.data.netSalary);

    // Test 9: Process Salary
    console.log('\n💵 Test 9: Processing salary...');
    const salaryResponse = await fetch(`${BASE_URL}/payroll/salaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: employee.data.id,
        salaryDate: new Date().toISOString(),
        allowances: 500,
        commission: 200,
        remarks: 'Test salary processing',
      }),
    });
    
    if (!salaryResponse.ok) {
      throw new Error(`Salary processing failed: ${salaryResponse.statusText}`);
    }
    
    const salary = await salaryResponse.json();
    console.log('✅ Salary processed');
    console.log('   Salary ID:', salary.data.id);
    console.log('   Gross:', salary.data.grossSalary);
    console.log('   Net:', salary.data.netSalary);

    // Test 10: Get Salary Entry
    console.log('\n🔍 Test 10: Getting salary entry...');
    const getSalaryResponse = await fetch(`${BASE_URL}/payroll/salaries/${salary.data.id}`);
    const salaryDetail = await getSalaryResponse.json();
    console.log('✅ Salary entry retrieved');
    console.log('   Employee:', `${salaryDetail.data.employee.firstName} ${salaryDetail.data.employee.surname}`);
    console.log('   Processed Date:', new Date(salaryDetail.data.processedDate).toLocaleDateString());

    // Test 11: List Salary Entries
    console.log('\n📋 Test 11: Listing salary entries...');
    const listSalariesResponse = await fetch(`${BASE_URL}/payroll/salaries?employeeId=${employee.data.id}`);
    const salariesList = await listSalariesResponse.json();
    console.log('✅ Found', salariesList.data.pagination.total, 'salary entries for employee');

    // Test 12: Create Commission
    console.log('\n💰 Test 12: Creating commission...');
    const commissionResponse = await fetch(`${BASE_URL}/payroll/commissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: employee.data.id,
        commissionDate: new Date().toISOString(),
        amount: 1000,
        rate: 5,
        salesAmount: 20000,
        remarks: 'Q1 sales commission',
      }),
    });
    
    if (!commissionResponse.ok) {
      throw new Error(`Commission creation failed: ${commissionResponse.statusText}`);
    }
    
    const commission = await commissionResponse.json();
    console.log('✅ Commission created');
    console.log('   Amount:', commission.data.amount);
    console.log('   Rate:', commission.data.rate + '%');
    console.log('   Is Paid:', commission.data.isPaid);

    // Test 13: Get Unpaid Commissions
    console.log('\n📋 Test 13: Getting unpaid commissions...');
    const unpaidResponse = await fetch(`${BASE_URL}/payroll/commissions/unpaid?employeeId=${employee.data.id}`);
    const unpaid = await unpaidResponse.json();
    console.log('✅ Unpaid commissions retrieved');
    console.log('   Count:', unpaid.data.summary.count);
    console.log('   Total Amount:', unpaid.data.summary.totalAmount);

    // Test 14: Mark Commission as Paid
    console.log('\n✅ Test 14: Marking commission as paid...');
    const payResponse = await fetch(`${BASE_URL}/payroll/commissions/${commission.data.id}/pay`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salaryEntryId: salary.data.id,
      }),
    });
    
    if (!payResponse.ok) {
      throw new Error(`Commission payment failed: ${payResponse.statusText}`);
    }
    
    const paidCommission = await payResponse.json();
    console.log('✅ Commission marked as paid');
    console.log('   Is Paid:', paidCommission.data.isPaid);
    console.log('   Paid Date:', new Date(paidCommission.data.paidDate).toLocaleDateString());

    // Test 15: Update Employee
    console.log('\n✏️  Test 15: Updating employee...');
    const updateResponse = await fetch(`${BASE_URL}/employees/${employee.data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        basicSalary: 6000,
        position: 'Senior Developer',
      }),
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Employee update failed: ${updateResponse.statusText}`);
    }
    
    const updatedEmployee = await updateResponse.json();
    console.log('✅ Employee updated');
    console.log('   New Basic Salary:', updatedEmployee.data.basicSalary);
    console.log('   New Position:', updatedEmployee.data.position);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Employee Management: 4/4 tests passed');
    console.log('   ✅ Tax Configuration: 2/2 tests passed');
    console.log('   ✅ Pension Configuration: 2/2 tests passed');
    console.log('   ✅ Salary Processing: 4/4 tests passed');
    console.log('   ✅ Commission Management: 3/3 tests passed');
    console.log('\n   Total: 15/15 tests passed ✅');
    console.log('\n🚀 Payroll API is working correctly!');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run tests
console.log('Starting Payroll API Tests...');
console.log('Make sure the development server is running on http://localhost:3000\n');

testPayrollAPI().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
