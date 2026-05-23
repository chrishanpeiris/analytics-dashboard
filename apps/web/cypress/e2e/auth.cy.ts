describe('Login page', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('shows the login form', () => {
    cy.get('[data-testid="input-email"]').should('be.visible');
    cy.get('[data-testid="input-password"]').should('be.visible');
    cy.get('[data-testid="btn-login"]').should('be.visible');
  });

  it('shows an error for invalid credentials', () => {
    cy.get('[data-testid="input-email"]').type('wrong@example.com');
    cy.get('[data-testid="input-password"]').type('wrongpassword');
    cy.get('[data-testid="btn-login"]').click();
    cy.get('[data-testid="login-error"]').should('be.visible');
  });

  it('redirects to /dashboard on successful login', () => {
    cy.login();
    cy.url().should('include', '/dashboard');
  });
});
