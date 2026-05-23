// Custom Cypress commands

Cypress.Commands.add('login', (email = 'admin@example.com', password = 'demo1234') => {
  cy.visit('/login');
  cy.get('[data-testid="input-email"]').clear().type(email);
  cy.get('[data-testid="input-password"]').clear().type(password);
  cy.get('[data-testid="btn-login"]').click();
  cy.url().should('include', '/dashboard');
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
    }
  }
}
