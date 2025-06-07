// parabank.spec.ts
import { test, expect } from '@playwright/test';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser();

// Suite de tests pour l'API ParaBank
test.describe('ParaBank API Tests', () => {

  const getAccounts = async (request) => {
    const response = await request.get('https://parabank.parasoft.com/parabank/services/bank/customers/13100/accounts', {
      headers: {
        'accept': 'application/xml'
      }
    });
    expect(response.status()).toBe(200);
    const responseBody = await response.text();
    const data = parser.parse(responseBody);

    // Gérer à la fois un seul compte et plusieurs comptes
    let accounts = data.accounts.account;
    if (!Array.isArray(accounts)) {
      accounts = [accounts];
    }
    return accounts;
  };

  test('GET customer accounts retourne les bonnes données', async ({ request }) => {
    const accounts = await getAccounts(request);

    expect(accounts.length).toBeGreaterThan(0);
    expect(accounts[0].customerId).toBe(13100);
    expect(['CHECKING', 'SAVINGS']).toContain(accounts[0].type);
  });

  test('Le solde de chaque compte doit être positif', async ({ request }) => {
    const accounts = await getAccounts(request);

    for (const account of accounts) {
      const balance = parseFloat(account.balance);
      expect(balance).toBeGreaterThan(0);
    }
  });

  test('Le client possède au moins un compte bancaire', async ({ request }) => {
    const accounts = await getAccounts(request);
    expect(accounts.length).toBeGreaterThan(0);
  });

  test('Tous les comptes appartiennent au bon client', async ({ request }) => {
    const accounts = await getAccounts(request);

    for (const account of accounts) {
      expect(account.customerId).toBe(13100);
    }
  });

  test('Type de compte est valide (CHECKING ou SAVINGS)', async ({ request }) => {
    const accounts = await getAccounts(request);

    for (const account of accounts) {
      expect(['CHECKING', 'SAVINGS']).toContain(account.type);
    }
  });

});
