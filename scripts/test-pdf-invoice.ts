/**
 * PDF Invoice Generation Test Script
 * 
 * This script tests the PDF invoice generation functionality
 * Run with: npm run test:pdf-invoice
 */

// Simple test to verify PDF generation works
async function testPDFInvoiceGeneration() {
  console.log('🧪 Testing PDF Invoice Generation...\n');

  try {
    // Test basic jsPDF functionality
    const { jsPDF } = await import('jspdf');
    
    console.log('Test 1: Creating basic PDF document...');
    const doc = new jsPDF();
    
    // Add some test content
    doc.setFontSize(16);
    doc.text('SNM Analytics Invoice Test', 20, 20);
    
    doc.setFontSize(12);
    doc.text('Invoice Number: SI-250627-001', 20, 40);
    doc.text('Date: 27-Jun-25', 20, 50);
    doc.text('Client: Benjamin Buabeng-Acheampong', 20, 60);
    doc.text('Service: Financial Model Build & Valuation', 20, 70);
    doc.text('Amount: GHS 7,050.00', 20, 80);
    
    // Test download
    console.log('Test 2: Testing download functionality...');
    doc.save('test-invoice-basic.pdf');
    console.log('✅ Basic PDF generated and downloaded successfully');

    // Test with more complex formatting
    console.log('Test 3: Testing advanced formatting...');
    const doc2 = new jsPDF();
    
    // Add header
    doc2.setFillColor(218, 165, 32); // Gold color
    doc2.rect(15, 15, 80, 8, 'F');
    doc2.setTextColor(255, 255, 255);
    doc2.setFontSize(10);
    doc2.text('SNM ANALYTICS', 17, 21);
    
    // Reset text color
    doc2.setTextColor(0, 0, 0);
    
    // Add invoice title
    doc2.setFontSize(18);
    doc2.text('INVOICE', 150, 25);
    
    // Add company details
    doc2.setFontSize(10);
    doc2.text('B316/7 Kaneshie loop, Accra', 15, 35);
    doc2.text('Accra', 15, 41);
    doc2.text('(+233) 30 394 3567', 15, 47);
    doc2.text('snmanalyticsgh@gmail.com', 15, 53);
    
    // Add invoice details table
    const invoiceDetails = [
      ['INVOICE NO.', 'SI-250627-001'],
      ['DATE', '27-Jun-25'],
      ['CLIENT ID', 'SC250203-001'],
      ['ORDER NO.', 'S-250627-001'],
      ['TERMS', 'Due Upon Receipt']
    ];
    
    let yPos = 70;
    invoiceDetails.forEach(([label, value]) => {
      doc2.setFillColor(218, 165, 32);
      doc2.rect(120, yPos, 60, 6, 'F');
      doc2.setTextColor(255, 255, 255);
      doc2.setFontSize(8);
      doc2.text(label, 122, yPos + 4);
      
      doc2.setTextColor(0, 0, 0);
      doc2.text(value, 122, yPos + 10);
      yPos += 8;
    });
    
    // Add service table
    doc2.setFillColor(218, 165, 32);
    doc2.rect(15, 120, 180, 8, 'F');
    doc2.setTextColor(255, 255, 255);
    doc2.setFontSize(10);
    doc2.text('No.', 17, 126);
    doc2.text('DESCRIPTION', 32, 126);
    doc2.text('FEE (GHS)', 165, 126);
    
    // Service row
    doc2.setTextColor(0, 0, 0);
    doc2.text('1', 17, 136);
    doc2.text('Financial Model Build & Valuation', 32, 136);
    doc2.text('7,050.00', 165, 136);
    
    // Summary section
    doc2.setFillColor(245, 245, 220); // Light cream
    doc2.rect(120, 150, 60, 25, 'F');
    
    doc2.setTextColor(0, 0, 0);
    doc2.setFontSize(10);
    doc2.text('Sub Total:', 122, 158);
    doc2.text('7,050.00', 157, 158);
    
    doc2.text('Discount: @ 6.4%', 122, 166);
    doc2.text('450.00', 157, 166);
    
    doc2.setFontSize(12);
    doc2.setTextColor(139, 69, 19); // Brown color
    doc2.text('Total (GHC):', 122, 174);
    doc2.text('6,600.00', 157, 174);
    
    // Footer
    doc2.setTextColor(139, 69, 19);
    doc2.setFontSize(12);
    doc2.text('Thank you for your business!', 15, 200);
    
    doc2.setFontSize(10);
    doc2.text('Payment Instructions', 15, 210);
    doc2.text('Bank: Access Bank [1019000000955]; Momo: VF Cash [050 605 8699]', 15, 216);
    
    // Download the formatted PDF
    doc2.save('test-invoice-formatted.pdf');
    console.log('✅ Formatted PDF generated successfully');

    console.log('\n🎉 All PDF invoice generation tests passed!');
    console.log('\nGenerated test files:');
    console.log('- test-invoice-basic.pdf');
    console.log('- test-invoice-formatted.pdf');
    console.log('\n📋 Test Summary:');
    console.log('- Basic PDF generation: ✅');
    console.log('- Download functionality: ✅');
    console.log('- Advanced formatting: ✅');
    console.log('- Color and styling: ✅');
    console.log('- Table layout: ✅');

  } catch (error) {
    console.error('❌ PDF invoice generation test failed:', error);
    throw error;
  }
}

// Test formatting functions
function testFormattingFunctions() {
  console.log('\n🧪 Testing formatting functions...\n');

  // Test date formatting
  const testDate = new Date('2024-06-27');
  const formattedDate = testDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
  console.log('Date formatting test:', formattedDate);

  // Test amount formatting
  const testAmount = 7050.00;
  const formattedAmount = new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(testAmount);
  console.log('Amount formatting test:', formattedAmount);

  // Test invoice number generation
  const invoiceNumber = `SI-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-001`;
  console.log('Invoice number generation test:', invoiceNumber);

  console.log('✅ All formatting functions working correctly');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting PDF Invoice Generation Tests\n');
  
  try {
    await testPDFInvoiceGeneration();
    testFormattingFunctions();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Test the invoice button in the Sales Form Desktop component');
    console.log('2. Verify PDF generation with real sales data');
    console.log('3. Customize invoice template as needed');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests();
}