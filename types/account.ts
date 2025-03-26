// types/account.ts

export interface Account {
    id: string;
    customerId: string;
    type: AccountType;
    balance: number;
  }
  
  export enum AccountType {
    CHECKING = "CHECKING",
    SAVINGS = "SAVINGS",
    CREDIT = "CREDIT"
  }
  
  export interface Transaction {
    id: string;
    accountId: string;
    type: TransactionType;
    date: string;
    amount: number;
    description: string;
  }
  
  export enum TransactionType {
    DEBIT = "DEBIT",
    CREDIT = "CREDIT"
  }
  
  export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    address: Address;
    phoneNumber: string;
    ssn: string;
    accounts: Account[];
  }
  
  export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  }