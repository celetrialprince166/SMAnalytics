/**
 * Data Seeding Helper
 * Generates realistic test data for SNM Analytics
 */

import { primaryAccountRepository, secondaryAccountRepository, holderAccountRepository } from '../repositories';
import { employeeRepository } from '../repositories/EmployeeRepository';
import { transactionRepository } from '../repositories/TransactionRepository';
import { salesEntryRepository } from '../repositories/SalesEntryRepository';
import { inventoryMovementRepository } from '../repositories/InventoryMovementRepository';
import { fixedAssetRepository, depreciationEntryRepository } from '../repositories/FixedAssetsRepository';
import { 
  taxConfigurationRepository, 
  pensionConfigurationRepository, 
  salaryEntryRepository,
  commissionRepository 
} from '../repositories/PayrollRepository';
import { clientsService } from '../services/ClientsService';
import { productService } from '../services/ProductService';
import { productRepository } from '../repositories/ProductRepository';

export async function seedAllData() {
  const details: string[] = [];

  try {
    // Clear existing data
    localStorage.clear();
    details.push('Cleared existing data');

    // 1. Seed Accounts
    const accounts = await seedAccounts();
    details.push(`Created ${accounts.holders.length} accounts`);

    // 2. Seed Clients
    const clients = await seedClients();
    details.push(`Created ${clients.length} clients`);

    // 3. Seed Products
    const products = await seedProducts();
    details.push(`Created ${products.length} products`);

    // 4. Seed Employees
    const employees = await seedEmployees();
    details.push(`Created ${employees.length} employees`);

    // 5. Seed Transactions (Account Transactions)
    const transactions = await seedTransactions(accounts);
    details.push(`Created ${transactions.length} account transactions`);

    // 6. Seed Sales
    const sales = await seedSales(products, clients, accounts);
    details.push(`Created ${sales.length} sales entries`);

    // 7. Seed Fixed Assets
    const fixedAssets = await seedFixedAssets(accounts);
    details.push(`Created ${fixedAssets.length} fixed assets`);

    // 8. Seed Payroll (Tax & Pension Config + Salary Entries)
    const payroll = await seedPayroll(employees);
    details.push(`Created ${payroll.salaryEntries} salary entries and ${payroll.commissions} commissions`);

    return {
      success: true,
      message: 'Test data seeded successfully!',
      details,
    };
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}

async function seedAccounts() {
  // Create Primary Accounts
  const assetsPrimary = await primaryAccountRepository.create({
    name: 'Assets',
    type: 'ASSETS',
    description: 'All company assets',
    isActive: true,
  });

  const liabilitiesPrimary = await primaryAccountRepository.create({
    name: 'Liabilities',
    type: 'LIABILITIES',
    description: 'All company liabilities',
    isActive: true,
  });

  const equityPrimary = await primaryAccountRepository.create({
    name: 'Equity',
    type: 'EQUITY',
    description: 'Shareholders equity',
    isActive: true,
  });

  const revenuePrimary = await primaryAccountRepository.create({
    name: 'Revenue',
    type: 'REVENUE',
    description: 'All revenue streams',
    isActive: true,
  });

  const expensesPrimary = await primaryAccountRepository.create({
    name: 'Expenses',
    type: 'EXPENSES',
    description: 'Operating expenses',
    isActive: true,
  });

  // Create primary accounts that ProductService expects
  const inventoryPrimary = await primaryAccountRepository.create({
    name: 'Inventory',
    type: 'ASSETS',
    description: 'Product inventory accounts',
    isActive: true,
  });

  const salesPrimary = await primaryAccountRepository.create({
    name: 'Sales',
    type: 'REVENUE',
    description: 'Product sales accounts',
    isActive: true,
  });

  const costOfSalesPrimary = await primaryAccountRepository.create({
    name: 'Cost of Sales',
    type: 'EXPENSES',
    description: 'Cost of goods sold accounts',
    isActive: true,
  });

  // Create Secondary Accounts
  const cashSec = await secondaryAccountRepository.create({
    name: 'Cash & Bank',
    code: '01-001',
    primaryAccountId: assetsPrimary.id,
    description: 'Cash and bank accounts',
    isActive: true,
  });

  const arSec = await secondaryAccountRepository.create({
    name: 'Accounts Receivable',
    code: '01-002',
    primaryAccountId: assetsPrimary.id,
    description: 'Trade debtors',
    isActive: true,
  });

  const apSec = await secondaryAccountRepository.create({
    name: 'Accounts Payable',
    code: '20-001',
    primaryAccountId: liabilitiesPrimary.id,
    description: 'Trade creditors',
    isActive: true,
  });

  const revenueSec = await secondaryAccountRepository.create({
    name: 'Service Revenue',
    code: '40-001',
    primaryAccountId: revenuePrimary.id,
    description: 'Revenue from services',
    isActive: true,
  });

  const salariesSec = await secondaryAccountRepository.create({
    name: 'Salaries & Wages',
    code: '50-001',
    primaryAccountId: expensesPrimary.id,
    description: 'Employee compensation',
    isActive: true,
  });

  // Create secondary accounts for products (to avoid ProductService creating them)
  const inventorySec = await secondaryAccountRepository.create({
    name: 'Products',
    code: '01-003',
    primaryAccountId: inventoryPrimary.id,
    description: 'Product inventory',
    isActive: true,
  });

  const productSalesSec = await secondaryAccountRepository.create({
    name: 'Product Sales',
    code: '40-002',
    primaryAccountId: salesPrimary.id,
    description: 'Revenue from product sales',
    isActive: true,
  });

  const costOfSalesSec = await secondaryAccountRepository.create({
    name: 'Product Costs',
    code: '50-002',
    primaryAccountId: costOfSalesPrimary.id,
    description: 'Cost of products sold',
    isActive: true,
  });

  // Create Holder Accounts
  const holders = [];

  holders.push(await holderAccountRepository.create({
    name: 'Petty Cash',
    code: '01-001-001',
    secondaryAccountId: cashSec.id,
    description: 'Office petty cash',
    balance: 0,
    isActive: true,
  }));

  holders.push(await holderAccountRepository.create({
    name: 'GCB Bank - Current Account',
    code: '01-001-002',
    secondaryAccountId: cashSec.id,
    description: 'Main operating account',
    balance: 0,
    isActive: true,
  }));

  holders.push(await holderAccountRepository.create({
    name: 'Trade Debtors',
    code: '01-002-001',
    secondaryAccountId: arSec.id,
    description: 'Customer receivables',
    balance: 0,
    isActive: true,
  }));

  holders.push(await holderAccountRepository.create({
    name: 'Trade Creditors',
    code: '20-001-001',
    secondaryAccountId: apSec.id,
    description: 'Supplier payables',
    balance: 0,
    isActive: true,
  }));

  holders.push(await holderAccountRepository.create({
    name: 'Consulting Revenue',
    code: '40-001-001',
    secondaryAccountId: revenueSec.id,
    description: 'Consulting services',
    balance: 0,
    isActive: true,
  }));

  holders.push(await holderAccountRepository.create({
    name: 'Staff Salaries',
    code: '50-001-001',
    secondaryAccountId: salariesSec.id,
    description: 'Employee salaries',
    balance: 0,
    isActive: true,
  }));

  return { holders };
}

async function seedClients() {
  const clients = [];

  const clientData = [
    { name: 'ABC Corporation', email: 'contact@abc.com', phone: '0241234567', type: 'CORPORATE' },
    { name: 'XYZ Limited', email: 'info@xyz.com', phone: '0242345678', type: 'CORPORATE' },
    { name: 'Tech Solutions Ghana', email: 'hello@techsolutions.gh', phone: '0243456789', type: 'CORPORATE' },
    { name: 'Ghana Commercial Bank', email: 'business@gcb.com.gh', phone: '0244567890', type: 'CORPORATE' },
    { name: 'Ministry of Finance', email: 'info@mofep.gov.gh', phone: '0245678901', type: 'GOVERNMENT' },
    { name: 'Vodafone Ghana', email: 'corporate@vodafone.com.gh', phone: '0246789012', type: 'CORPORATE' },
    { name: 'MTN Ghana', email: 'business@mtn.com.gh', phone: '0247890123', type: 'CORPORATE' },
    { name: 'Stanbic Bank', email: 'corporate@stanbic.com.gh', phone: '0248901234', type: 'CORPORATE' },
    { name: 'Unilever Ghana', email: 'contact@unilever.com.gh', phone: '0249012345', type: 'CORPORATE' },
    { name: 'Nestle Ghana', email: 'info@nestle.com.gh', phone: '0240123456', type: 'CORPORATE' },
  ];

  for (const data of clientData) {
    const client = await clientsService.createClient({
      registrationDate: new Date('2023-01-01'),
      status: 'ACTIVE',
      companyName: data.name,
      emailAddress: data.email,
      phoneNumbers: data.phone,
      address: 'Accra, Ghana',
      contactPerson: 'Business Manager',
    });
    clients.push(client);
  }

  return clients;
}

async function seedProducts() {
  const products = [];

  const productData = [
    { name: 'Analytics Software License', price: 5000, category: 'SOFTWARE' },
    { name: 'Training Materials', price: 500, category: 'MATERIALS' },
    { name: 'Consulting Hours Package', price: 2000, category: 'SERVICE' },
    { name: 'Data Visualization Tools', price: 3000, category: 'SOFTWARE' },
    { name: 'Report Templates', price: 800, category: 'MATERIALS' },
    { name: 'API Access', price: 1500, category: 'SOFTWARE' },
    { name: 'Support Package', price: 1200, category: 'SERVICE' },
    { name: 'Custom Development Hours', price: 3500, category: 'SERVICE' },
  ];

  for (const data of productData) {
    const product = await productService.createProduct({
      name: data.name,
      description: `Professional ${data.name.toLowerCase()}`,
      unitPrice: data.price,
      costPrice: data.price * 0.6,
      quantityOnHand: 100,
      reorderLevel: 10,
      category: data.category,
    });
    products.push(product);
  }

  return products;
}

async function seedEmployees() {
  const employees = [];

  const employeeData = [
    { id: 'EMP001', firstName: 'Kwame', surname: 'Mensah', position: 'Senior Consultant', salary: 8000, dept: 'Consulting' },
    { id: 'EMP002', firstName: 'Ama', surname: 'Asante', position: 'Senior Consultant', salary: 8000, dept: 'Consulting' },
    { id: 'EMP003', firstName: 'Kofi', surname: 'Owusu', position: 'Analyst', salary: 5000, dept: 'Analytics' },
    { id: 'EMP004', firstName: 'Akua', surname: 'Boateng', position: 'Analyst', salary: 5000, dept: 'Analytics' },
    { id: 'EMP005', firstName: 'Yaw', surname: 'Adjei', position: 'Developer', salary: 6000, dept: 'Technology' },
    { id: 'EMP006', firstName: 'Abena', surname: 'Osei', position: 'Developer', salary: 6000, dept: 'Technology' },
    { id: 'EMP007', firstName: 'Kwesi', surname: 'Appiah', position: 'Admin Manager', salary: 7000, dept: 'Administration' },
    { id: 'EMP008', firstName: 'Efua', surname: 'Darko', position: 'Sales Manager', salary: 7500, dept: 'Sales' },
  ];

  for (const data of employeeData) {
    const employee = await employeeRepository.create({
      employeeId: data.id,
      firstName: data.firstName,
      surname: data.surname,
      dateOfBirth: new Date('1990-01-01'),
      gender: 'MALE',
      nationality: 'GHANAIAN',
      maritalStatus: 'SINGLE',
      numberOfChildren: 0,
      emailAddress: `${data.firstName.toLowerCase()}.${data.surname.toLowerCase()}@snmanalytics.com`,
      phoneNumber: `024${Math.floor(Math.random() * 10000000)}`,
      position: data.position,
      department: data.dept,
      basicSalary: data.salary,
      entryDate: new Date('2023-01-01'),
      status: 'ACTIVE',
      isActive: true,
    });
    employees.push(employee);
  }

  return employees;
}

// ==================== TRANSACTION SEEDING ====================

async function seedTransactions(accounts: any) {
  const transactions = [];
  const holders = accounts.holders;
  
  // Get specific accounts
  const pettyCash = holders.find((h: any) => h.name === 'Petty Cash');
  const bankAccount = holders.find((h: any) => h.name === 'GCB Bank - Current Account');
  const tradeDebtors = holders.find((h: any) => h.name === 'Trade Debtors');
  const tradeCreditors = holders.find((h: any) => h.name === 'Trade Creditors');
  const revenue = holders.find((h: any) => h.name === 'Consulting Revenue');
  const salaries = holders.find((h: any) => h.name === 'Staff Salaries');

  // Generate transactions over the last 3 months
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // 1. Initial capital injection (3 months ago)
  const capitalDate = new Date(threeMonthsAgo);
  const capitalTxn = await transactionRepository.create({
    date: capitalDate,
    number: await transactionRepository.getNextTransactionNumber(capitalDate),
    description: 'Initial Capital Injection',
    amount: 100000,
    debitAccountId: bankAccount.id,
    creditAccountId: revenue.id,
    reconciled: true,
  });
  await holderAccountRepository.updateBalance(bankAccount.id, 100000, true);
  await holderAccountRepository.updateBalance(revenue.id, 100000, false);
  transactions.push(capitalTxn);

  // 2. Transfer to Petty Cash
  const pettyDate = new Date(capitalDate);
  pettyDate.setDate(pettyDate.getDate() + 1);
  const pettyTxn = await transactionRepository.create({
    date: pettyDate,
    number: await transactionRepository.getNextTransactionNumber(pettyDate),
    description: 'Transfer to Petty Cash',
    amount: 5000,
    debitAccountId: pettyCash.id,
    creditAccountId: bankAccount.id,
    reconciled: true,
  });
  await holderAccountRepository.updateBalance(pettyCash.id, 5000, true);
  await holderAccountRepository.updateBalance(bankAccount.id, 5000, false);
  transactions.push(pettyTxn);

  // 3. Generate monthly transactions
  for (let month = 0; month < 3; month++) {
    const monthDate = new Date(threeMonthsAgo);
    monthDate.setMonth(monthDate.getMonth() + month);
    
    // Office supplies from petty cash
    const suppliesDate = new Date(monthDate);
    suppliesDate.setDate(5);
    const suppliesTxn = await transactionRepository.create({
      date: suppliesDate,
      number: await transactionRepository.getNextTransactionNumber(suppliesDate),
      description: 'Office Supplies - Stationery',
      amount: 350,
      debitAccountId: salaries.id, // Using salaries as expense account
      creditAccountId: pettyCash.id,
      reconciled: false,
    });
    await holderAccountRepository.updateBalance(salaries.id, 350, true);
    await holderAccountRepository.updateBalance(pettyCash.id, 350, false);
    transactions.push(suppliesTxn);

    // Utility payment
    const utilityDate = new Date(monthDate);
    utilityDate.setDate(10);
    const utilityTxn = await transactionRepository.create({
      date: utilityDate,
      number: await transactionRepository.getNextTransactionNumber(utilityDate),
      description: 'Electricity & Water Bill',
      amount: 1200,
      debitAccountId: salaries.id,
      creditAccountId: bankAccount.id,
      reconciled: true,
    });
    await holderAccountRepository.updateBalance(salaries.id, 1200, true);
    await holderAccountRepository.updateBalance(bankAccount.id, 1200, false);
    transactions.push(utilityTxn);

    // Rent payment
    const rentDate = new Date(monthDate);
    rentDate.setDate(1);
    const rentTxn = await transactionRepository.create({
      date: rentDate,
      number: await transactionRepository.getNextTransactionNumber(rentDate),
      description: 'Office Rent - Monthly',
      amount: 5000,
      debitAccountId: salaries.id,
      creditAccountId: bankAccount.id,
      reconciled: true,
    });
    await holderAccountRepository.updateBalance(salaries.id, 5000, true);
    await holderAccountRepository.updateBalance(bankAccount.id, 5000, false);
    transactions.push(rentTxn);

    // Customer payment received
    const paymentDate = new Date(monthDate);
    paymentDate.setDate(15);
    const paymentTxn = await transactionRepository.create({
      date: paymentDate,
      number: await transactionRepository.getNextTransactionNumber(paymentDate),
      description: 'Payment Received from Client',
      amount: 15000,
      debitAccountId: bankAccount.id,
      creditAccountId: tradeDebtors.id,
      reconciled: true,
    });
    await holderAccountRepository.updateBalance(bankAccount.id, 15000, true);
    await holderAccountRepository.updateBalance(tradeDebtors.id, 15000, false);
    transactions.push(paymentTxn);
  }

  return transactions;
}

// ==================== SALES SEEDING ====================

async function seedSales(products: any[], clients: any[], accounts: any) {
  const sales = [];
  const holders = accounts.holders;
  
  const tradeDebtors = holders.find((h: any) => h.name === 'Trade Debtors');
  
  // Generate sales over the last 3 months
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Create 15 sales entries
  for (let i = 0; i < 15; i++) {
    const saleDate = new Date(threeMonthsAgo);
    saleDate.setDate(saleDate.getDate() + (i * 6)); // Every 6 days
    
    const product = products[i % products.length];
    const client = clients[i % clients.length];
    
    const salesValue = product.sellingPrice;
    const costValue = product.costPrice;
    const applyVat = i % 3 === 0; // Apply VAT to every 3rd sale
    const vatRate = 12.5;
    
    let vatAmount = 0;
    let totalWithVat = salesValue;
    if (applyVat) {
      vatAmount = (salesValue * vatRate) / 100;
      totalWithVat = salesValue + vatAmount;
    }

    const salesCode = await salesEntryRepository.getNextSalesCode(saleDate);
    
    // Create cost transaction
    const costTxnNumber = await transactionRepository.getNextTransactionNumber(saleDate);
    await transactionRepository.create({
      date: saleDate,
      number: costTxnNumber,
      description: `Cost of Sales - ${product.name}`,
      amount: costValue,
      debitAccountId: product.costOfSalesAccountId,
      creditAccountId: product.inventoryAccountId,
      reconciled: false,
    });
    await holderAccountRepository.updateBalance(product.costOfSalesAccountId, costValue, true);
    await holderAccountRepository.updateBalance(product.inventoryAccountId, costValue, false);

    // Create sales transaction
    const salesTxnNumber = await transactionRepository.getNextTransactionNumber(saleDate);
    await transactionRepository.create({
      date: saleDate,
      number: salesTxnNumber,
      description: `Sales - ${product.name}${applyVat ? ' (incl. VAT)' : ''}`,
      amount: totalWithVat,
      debitAccountId: tradeDebtors.id,
      creditAccountId: product.salesAccountId,
      reconciled: false,
    });
    await holderAccountRepository.updateBalance(tradeDebtors.id, totalWithVat, true);
    await holderAccountRepository.updateBalance(product.salesAccountId, salesValue, false);

    // Create inventory movement
    await inventoryMovementRepository.create({
      date: saleDate,
      productId: product.id,
      type: 'SALE',
      quantity: 1,
      unitCost: costValue,
      totalCost: costValue,
      referenceNumber: salesCode,
      description: `Sale to ${client.name}`,
    });

    // Create sales entry
    const sale = await salesEntryRepository.create({
      date: saleDate,
      salesCode,
      productId: product.id,
      description: `${product.name} - ${client.name}`,
      salesValue,
      costValue,
      customerAccountId: tradeDebtors.id,
      costTransactionNumber: costTxnNumber,
      salesTransactionNumber: salesTxnNumber,
      applyVat,
      vatRate: applyVat ? vatRate : undefined,
      vatAmount: applyVat ? vatAmount : undefined,
      totalWithVat: applyVat ? totalWithVat : undefined,
    });
    sales.push(sale);
  }

  return sales;
}

// ==================== FIXED ASSETS SEEDING ====================

async function seedFixedAssets(accounts: any) {
  const assets = [];
  const holders = accounts.holders;
  
  const bankAccount = holders.find((h: any) => h.name === 'GCB Bank - Current Account');

  const assetData = [
    {
      category: 'EQUIPMENT' as const,
      description: 'Dell PowerEdge Server',
      cost: 25000,
      life: 5,
      rate: 20,
      residual: 2500,
      monthsAgo: 24,
    },
    {
      category: 'EQUIPMENT' as const,
      description: 'HP LaserJet Printer',
      cost: 3500,
      life: 3,
      rate: 33.33,
      residual: 350,
      monthsAgo: 18,
    },
    {
      category: 'FURNITURE' as const,
      description: 'Office Desks and Chairs (10 sets)',
      cost: 15000,
      life: 10,
      rate: 10,
      residual: 1500,
      monthsAgo: 30,
    },
    {
      category: 'VEHICLE' as const,
      description: 'Toyota Corolla 2022',
      cost: 120000,
      life: 5,
      rate: 20,
      residual: 30000,
      monthsAgo: 12,
    },
    {
      category: 'EQUIPMENT' as const,
      description: 'Conference Room Projector & Screen',
      cost: 5000,
      life: 5,
      rate: 20,
      residual: 500,
      monthsAgo: 6,
    },
  ];

  for (const data of assetData) {
    const acquisitionDate = new Date();
    acquisitionDate.setMonth(acquisitionDate.getMonth() - data.monthsAgo);

    const asset = await fixedAssetRepository.create({
      assetCode: await fixedAssetRepository.getNextAssetCode(),
      acquisitionDate,
      category: data.category,
      description: data.description,
      valueAtCost: data.cost,
      usefulLife: data.life,
      depreciationRate: data.rate,
      depreciationType: 'STRAIGHT_LINE',
      residualValue: data.residual,
      status: 'ACTIVE',
      accumulatedDepreciation: 0,
      netBookValue: data.cost,
      isActive: true,
    });

    // Calculate and create depreciation entries
    const monthlyDepreciation = (data.cost - data.residual) / (data.life * 12);
    let accumulated = 0;

    for (let month = 0; month < data.monthsAgo; month++) {
      const depDate = new Date(acquisitionDate);
      depDate.setMonth(depDate.getMonth() + month + 1);
      
      accumulated += monthlyDepreciation;
      const nbv = data.cost - accumulated;

      await depreciationEntryRepository.create({
        assetId: asset.id,
        period: depDate,
        depreciationAmount: monthlyDepreciation,
        accumulatedDepreciation: accumulated,
        netBookValue: Math.max(nbv, data.residual),
      });
    }

    // Update asset with accumulated depreciation
    await fixedAssetRepository.update(asset.id, {
      accumulatedDepreciation: accumulated,
      netBookValue: Math.max(data.cost - accumulated, data.residual),
    });

    assets.push(asset);
  }

  return assets;
}

// ==================== PAYROLL SEEDING ====================

async function seedPayroll(employees: any[]) {
  // 1. Create Tax Configuration (Ghana 2024 rates)
  await taxConfigurationRepository.create({
    effectiveDate: new Date('2024-01-01'),
    brackets: [
      { id: 'bracket-1', order: 1, amount: 365, rate: 0 },
      { id: 'bracket-2', order: 2, amount: 110, rate: 5 },
      { id: 'bracket-3', order: 3, amount: 130, rate: 10 },
      { id: 'bracket-4', order: 4, amount: 3000, rate: 17.5 },
      { id: 'bracket-5', order: 5, amount: 16395, rate: 25 },
      { id: 'bracket-6', order: 6, amount: 0, rate: 30 }, // Remainder
    ],
    nonResidentRate: 25,
    personalRelief: 365,
    isActive: true,
  });

  // 2. Create Pension Configuration (Ghana SSNIT rates)
  await pensionConfigurationRepository.create({
    effectiveDate: new Date('2024-01-01'),
    tier1EmployerRate: 13,
    tier1EmployeeRate: 5.5,
    tier1PensionRate: 13.5,
    tier1NHISRate: 2.5,
    tier2Rate: 5,
    tier3EmployerRate: 0,
    tier3EmployeeRate: 0,
    tier3MaxAmount: 0,
    isActive: true,
  });

  // 3. Create Salary Entries for last 3 months
  const salaryEntries = [];
  const commissions = [];
  
  const today = new Date();
  
  for (let month = 0; month < 3; month++) {
    const salaryDate = new Date(today);
    salaryDate.setMonth(salaryDate.getMonth() - (2 - month));
    salaryDate.setDate(25); // Pay on 25th of each month

    for (const employee of employees) {
      const basicSalary = employee.basicSalary;
      const allowances = basicSalary * 0.15; // 15% allowances
      const commission = employee.position.includes('Sales') ? basicSalary * 0.1 : 0;
      const grossSalary = basicSalary + allowances + commission;

      // Calculate deductions (simplified)
      const tier1Employee = basicSalary * 0.055; // 5.5%
      const tier2 = basicSalary * 0.05; // 5%
      const tier3Employee = 0;
      const totalSSNIT = tier1Employee + tier2 + tier3Employee;
      
      // Simplified tax calculation
      const taxableIncome = grossSalary - totalSSNIT;
      const incomeTax = taxableIncome * 0.15; // Simplified 15% average
      
      const otherDeductions = 0;
      const totalDeductions = incomeTax + totalSSNIT + otherDeductions;
      const netSalary = grossSalary - totalDeductions;

      const salaryEntry = await salaryEntryRepository.create({
        employeeId: employee.id,
        salaryDate,
        processedDate: salaryDate,
        basicSalary,
        allowances,
        commission,
        grossSalary,
        incomeTax,
        tier1Employee,
        tier2,
        tier3Employee,
        totalSSNIT,
        otherDeductions,
        totalDeductions,
        netSalary,
      });
      salaryEntries.push(salaryEntry);

      // Create commission entry if applicable
      if (commission > 0) {
        const comm = await commissionRepository.create({
          employeeId: employee.id,
          commissionDate: salaryDate,
          amount: commission,
          rate: 10,
          salesAmount: commission * 10,
          remarks: 'Monthly sales commission',
          isPaid: true,
          paidDate: salaryDate,
          salaryEntryId: salaryEntry.id,
        });
        commissions.push(comm);
      }
    }
  }

  return {
    salaryEntries: salaryEntries.length,
    commissions: commissions.length,
  };
}
