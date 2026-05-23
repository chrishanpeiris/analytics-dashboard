describe('Dashboard', () => {
  beforeEach(() => {
    cy.login();
  });

  it('loads the overview tab with metric cards', () => {
    cy.get('[data-testid="metric-revenue"]').should('be.visible');
    cy.get('[data-testid="metric-orders"]').should('be.visible');
    cy.get('[data-testid="metric-aov"]').should('be.visible');
    cy.get('[data-testid="metric-customers"]').should('be.visible');
  });

  it('switches to orders tab and shows order rows', () => {
    cy.get('[data-testid="tab-orders"]').click();
    cy.get('[data-testid="order-row"]').should('have.length.greaterThan', 0);
  });

  it('filters orders by status', () => {
    cy.get('[data-testid="tab-orders"]').click();
    cy.get('[data-testid="filter-DELIVERED"]').click();
    // All visible rows should not show PENDING/CANCELLED badges
    cy.get('[data-testid="order-row"]').each(($row) => {
      cy.wrap($row).should('contain.text', 'DELIVERED');
    });
  });

  it('updates the date range with 7d preset and refetches', () => {
    cy.get('[data-testid="preset-7d"]').click();
    // Metric cards should still be visible (data refetches)
    cy.get('[data-testid="metric-revenue"]').should('be.visible');
  });

  it('changes chart period to weekly', () => {
    cy.get('[data-testid="period-WEEKLY"]').click();
    cy.get('[data-testid="period-WEEKLY"]').should('have.class', 'bg-indigo-600');
  });
});

describe('Auth guard', () => {
  it('redirects unauthenticated users to /login', () => {
    localStorage.removeItem('auth_token');
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });
});
