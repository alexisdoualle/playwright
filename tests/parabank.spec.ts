// parabank.spec.ts
import { test, expect } from '@playwright/test';

test.describe('ParaBank API Tests', () => {
  test('GET customer accounts returns correct data', async ({ request }) => {
    // Make API request to get accounts for customer 13655
    const response = await request.get('https://parabank.parasoft.com/parabank/services/bank/customers/13655/accounts', {
      headers: {
        'accept': 'application/xml'
      }
    });

    // Verify response status
    expect(response.status()).toBe(200);
    
    // Convert response to text to check XML content
    const responseBody = await response.text();
    
    // Basic checks on XML content
    expect(responseBody).toContain('<accounts>');
    expect(responseBody).toContain('<customerId>13655</customerId>');
    
    // More specific assertions could be done with XML parsing
    // For simple verification, we can check for expected values
    expect(responseBody).toContain('<type>CHECKING</type>');
    
    // Check headers
    const headers = response.headers();
    expect(headers['content-type']).toContain('application/xml');
  });

  test('Account balance should be positive', async ({ request }) => {
    const response = await request.get('https://parabank.parasoft.com/parabank/services/bank/customers/13655/accounts', {
      headers: {
        'accept': 'application/xml'
      }
    });
    
    const responseBody = await response.text();
    
    // Extract balance value using regex
    // Note: In a real test, you'd probably want to use a proper XML parser
    const balanceMatch = responseBody.match(/<balance>([^<]+)<\/balance>/);
    if (balanceMatch && balanceMatch[1]) {
      const balance = parseFloat(balanceMatch[1]);
      expect(balance).toBeGreaterThan(0);
      console.log(`Current balance: $${balance}`);
    } else {
      throw new Error('Balance not found in response');
    }
  });
});