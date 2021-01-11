describe('Select Server Page Tests', () => {
  it('Redirects to Select Server', () => {
    cy.visit('http://localhost:3000');

    cy.url().should('include', '/selectserver');
  });

  it('Connect Button is visible but disabled', () => {
    cy.visit('http://localhost:3000/selectserver');

    // Buttons should contain the text "connect"
    cy.get('form')
      .get('button[type="submit"]')
      .contains('connect', { matchCase: false });

    // Since the text field is blank, the form buttons should be disabled
    cy.get('form').get('button[type="submit"]').should('be.disabled');
  });

  it('Server input is vislble, and contains label', () => {
    // Input box should have a label "Server address"
    cy.get('form').contains('server address', { matchCase: false });
  });

  it('Server input is clickable, and typeable', () => {
    // Input box should have a label "Server address"
    cy.get('form')
      .get('input[type="url"]')
      .click()
      .type('https://demo.jellyfin.org/unstable');
  });

  it('Connect button is now clickable', () => {
    cy.get('form').get('button[type="submit"]').should('not.be.disabled');
  });

  it('On pressing connect, attempt to connect to server. (Version Too Low)', () => {
    cy.get('form').get('button[type="submit"]').click();

    cy.intercept('https://demo.jellyfin.org/unstable/System/Info/Public', {
      Version: '10.6.0'
    }).as('responseVersionTooLow');

    cy.wait('@responseVersionTooLow');

    cy.contains('Server version needs to be 10.7.0 or higher', {
      matchCase: false
    });
  });

  it('On pressing connect, attempt to connect to server. (No Server Found)', () => {
    cy.intercept('https://demo.jellyfin.org/unstable/System/Info/Public', {
      statusCode: 500
    }).as('responseServerNotFound');

    cy.get('form').get('button[type="submit"]').click();

    cy.wait('@responseServerNotFound');

    cy.contains('Server not found', {
      matchCase: false
    });
  });

  it('On a successful connection, redirect to /login', () => {
    // This test may sometimes fail if we are unable to get to the demo server
    cy.intercept('https://demo.jellyfin.org/unstable/System/Info/Public').as(
      'responseSuccess'
    );

    cy.get('form').get('button[type="submit"]').click();

    cy.wait('@responseSuccess');

    cy.url().should('include', '/login');
  });
});
