// parabank.spec.ts
import { test, expect } from '@playwright/test';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser();

// Suite de tests pour l'API ParaBank
test.describe('ParaBank API Tests', () => {

  const TARGET_BALANCE = 1000;
  const accountId = 14898;

  test.beforeEach(async ({ request }) => {
    const res = await request.get(`https://parabank.parasoft.com/parabank/services/bank/accounts/${accountId}`, {
      headers: { accept: 'application/xml' }
    });

    const data = parser.parse(await res.text());
    const currentBalance = parseFloat(data.account.balance);

    const delta = TARGET_BALANCE - currentBalance;

    if (delta > 0) {
      await request.post(`https://parabank.parasoft.com/parabank/services/bank/deposit?accountId=${accountId}&amount=${delta}`, {
        headers: { accept: 'application/xml' }
      });
    } else if (delta < 0) {
      await request.post(`https://parabank.parasoft.com/parabank/services/bank/withdraw?accountId=${accountId}&amount=${-delta}`, {
        headers: { accept: 'application/xml' }
      });
    }
  });


  // account id: 14898
  const getAccounts = async (request) => {
    const response = await request.get('https://parabank.parasoft.com/parabank/services/bank/customers/13544/accounts', {
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
    expect(accounts[0].customerId).toBe(13544);
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
      expect(account.customerId).toBe(13544);
    }
  });

  test('Type de compte est valide (CHECKING ou SAVINGS)', async ({ request }) => {
    const accounts = await getAccounts(request);

    for (const account of accounts) {
      expect(['CHECKING', 'SAVINGS']).toContain(account.type);
    }
  });

  test('Ajout d\'argent au compte met à jour le solde', async ({ request }) => {
    const accountId = 14898;
  
    // Obtenir le solde actuel
    const resBefore = await request.get(`https://parabank.parasoft.com/parabank/services/bank/accounts/${accountId}`, {
      headers: { accept: 'application/xml' }
    });
    expect(resBefore.status()).toBe(200);
    const beforeData = parser.parse(await resBefore.text());
    const initialBalance = parseFloat(beforeData.account.balance);
  
    // Effectuer un dépôt
    const depositAmount = 125;
    const depositRes = await request.post(`https://parabank.parasoft.com/parabank/services/bank/deposit?accountId=${accountId}&amount=${depositAmount}`, {
      headers: { accept: 'application/xml' }
    });
    expect(depositRes.status()).toBe(200);
  
    // Obtenir le nouveau solde
    const resAfter = await request.get(`https://parabank.parasoft.com/parabank/services/bank/accounts/${accountId}`, {
      headers: { accept: 'application/xml' }
    });
    const afterData = parser.parse(await resAfter.text());
    const newBalance = parseFloat(afterData.account.balance);
  
    expect(newBalance).toBeCloseTo(initialBalance + depositAmount, 2);
  });
  

  test('Retrait d\'argent diminue le solde du compte', async ({ request }) => {
    const accountId = 14898;
  
    const resBefore = await request.get(`https://parabank.parasoft.com/parabank/services/bank/accounts/${accountId}`, {
      headers: { accept: 'application/xml' }
    });
    const beforeData = parser.parse(await resBefore.text());
    const initialBalance = parseFloat(beforeData.account.balance);
  
    const withdrawAmount = 50;
    const withdrawRes = await request.post(`https://parabank.parasoft.com/parabank/services/bank/withdraw?accountId=${accountId}&amount=${withdrawAmount}`, {
      headers: { accept: 'application/xml' }
    });
    expect(withdrawRes.status()).toBe(200);
  
    const resAfter = await request.get(`https://parabank.parasoft.com/parabank/services/bank/accounts/${accountId}`, {
      headers: { accept: 'application/xml' }
    });
    const afterData = parser.parse(await resAfter.text());
    const newBalance = parseFloat(afterData.account.balance);
  
    expect(newBalance).toBeCloseTo(initialBalance - withdrawAmount, 2);
  });
  
  test('Une transaction de type Credit est créée après un dépôt', async ({ request }) => {
    const accountId = 14898;
    const depositAmount = 125;
  
    await request.post(`https://parabank.parasoft.com/parabank/services/bank/deposit?accountId=${accountId}&amount=${depositAmount}`, {
      headers: { accept: 'application/xml' }
    });
  
    const res = await request.get(`https://parabank.parasoft.com/parabank/services/bank/accounts/${accountId}/transactions`, {
      headers: { accept: 'application/xml' }
    });
    const data = parser.parse(await res.text());
    const transactions = Array.isArray(data.transactions.transaction)
      ? data.transactions.transaction
      : [data.transactions.transaction];
  
    const latest = transactions[transactions.length - 1];
    expect(latest.type).toBe('Credit');
    expect(parseFloat(latest.amount)).toBeCloseTo(depositAmount, 2);
  });
  
  test('Une transaction de type Debit est créée après un retrait', async ({ request }) => {
    const accountId = 14898;
    const withdrawAmount = 50;
  
    await request.post(`https://parabank.parasoft.com/parabank/services/bank/withdraw?accountId=${accountId}&amount=${withdrawAmount}`, {
      headers: { accept: 'application/xml' }
    });
  
    const res = await request.get(`https://parabank.parasoft.com/parabank/services/bank/accounts/${accountId}/transactions`, {
      headers: { accept: 'application/xml' }
    });
    const data = parser.parse(await res.text());
    const transactions = Array.isArray(data.transactions.transaction)
      ? data.transactions.transaction
      : [data.transactions.transaction];
  
    const latest = transactions[transactions.length - 1];
    expect(latest.type).toBe('Debit');
    expect(parseFloat(latest.amount)).toBeCloseTo(withdrawAmount, 2);
  });
  

  test('Un retrait supérieur au solde entraîne un solde négatif (comportement non sécurisé)', async ({ request }) => {
    const accountId = 14898;
  
    const resBefore = await request.get(`https://parabank.parasoft.com/parabank/services/bank/accounts/${accountId}`, {
      headers: { accept: 'application/xml' }
    });
    const data = parser.parse(await resBefore.text());
    const balance = parseFloat(data.account.balance);
  
    const excessiveAmount = balance + 500;
    const res = await request.post(`https://parabank.parasoft.com/parabank/services/bank/withdraw?accountId=${accountId}&amount=${excessiveAmount}`, {
      headers: { accept: 'application/xml' }
    });
  
    expect(res.status()).toBe(200); // On accepte qu'il retourne 200
  
    const resAfter = await request.get(`https://parabank.parasoft.com/parabank/services/bank/accounts/${accountId}`, {
      headers: { accept: 'application/xml' }
    });
    const afterData = parser.parse(await resAfter.text());
    const newBalance = parseFloat(afterData.account.balance);
  
    expect(newBalance).toBeLessThan(0); // Vérification logique : le solde ne devrait pas être négatif dans un système réel
  });
  
  
});
