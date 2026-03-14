const { validatePaymentChannelCreate } = require('./packages/xrpl/src/models/transactions/paymentChannelCreate');

try {
  // Test invalid Destination (should show better error message)
  validatePaymentChannelCreate({
    Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
    TransactionType: 'PaymentChannelCreate',
    Amount: '10000',
    Destination: 10, // Invalid - should be a string
    SettleDelay: 86400,
    PublicKey: '32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A'
  });
} catch (error) {
  console.log('Destination error:', error.message);
}

try {
  // Test invalid DestinationTag (should show better error message)
  validatePaymentChannelCreate({
    Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
    TransactionType: 'PaymentChannelCreate',
    Amount: '10000',
    Destination: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
    SettleDelay: 86400,
    PublicKey: '32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A',
    DestinationTag: '10' // Invalid - should be a number
  });
} catch (error) {
  console.log('DestinationTag error:', error.message);
}

console.log('Test completed successfully!');