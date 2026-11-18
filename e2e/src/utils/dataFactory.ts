import type { CheckoutDetails, User } from '@data/types';

/** Unique, collision-free suffix so parallel workers never share data. */
export function uniqueId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
}

/** Valid register payload: password has 8+ chars, a letter and a number (backend rule). */
export function buildUser(overrides: Partial<User> = {}): User {
  const id = uniqueId();
  return {
    firstName: 'QA',
    lastName: `User${id}`,
    email: `qa.user+${id}@example.com`,
    password: `Pass${id}`,
    ...overrides,
  };
}

export function buildCheckoutDetails(overrides: Partial<CheckoutDetails> = {}): CheckoutDetails {
  return {
    customerName: 'QA Automation',
    email: `qa.user+${uniqueId()}@example.com`,
    phone: '0771234567',
    line1: 'No. 12, Kandy Road',
    city: 'Dambulla',
    postalCode: '21100',
    ...overrides,
  };
}
