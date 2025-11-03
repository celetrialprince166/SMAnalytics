// Test script to create a transaction via API

async function testCreateTransaction() {
  try {
    const response = await fetch('http://localhost:3000/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: new Date().toISOString(),
        debitAccountId: 'f8e7d6c5-b4a3-9281-7065-443322110000', // Replace with actual account ID
        creditAccountId: 'f8e7d6c5-b4a3-9281-7065-443322110001', // Replace with actual account ID
        amount: 100,
        description: 'Test transaction from script',
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Transaction created successfully!');
      console.log('Transaction number:', data.data.number);
      console.log('Transaction ID:', data.data.id);
    } else {
      console.log('❌ Error creating transaction:');
      console.log(data);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testCreateTransaction();
