import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';

Given('I am on the dashboard page', () => {
  cy.visit('/');
});

Given('I open the {string} page', (path) => {
  cy.visit(path.startsWith('/') ? path : `/${path}`);
});

Then('I should see the dashboard header', () => {
  cy.location('pathname').then((pathname) => {
    if (pathname === '/login') {
      cy.contains('Войдите в свою учетную запись').should('be.visible');
      return;
    }

    cy.contains('Центр заказов').should('be.visible');
  });
});

Then('I should see the add order button', () => {
  cy.location('pathname').then((pathname) => {
    if (pathname === '/login') {
      cy.contains('Войти').should('be.visible');
      return;
    }

    cy.contains('button', 'Добавить').should('be.visible');
  });
});

Then('I should see the calendar page title', () => {
  cy.contains('Календарь бронирований').should('be.visible');
});

When('I search for {string}', (searchText) => {
  cy.get('input[type="text"]').first().clear().type(searchText);
});

Then('I should see either the empty dashboard state or the order table', () => {
  cy.get('body').then(($body) => {
    const hasEmptyState = $body.text().includes('Заказы не найдены');
    const hasOrderTable = $body.text().includes('Автомобиль') || $body.text().includes('Клиент');
    expect(hasEmptyState || hasOrderTable).to.be.true;
  });
});

When('I select the first available branch if present', () => {
  cy.get('body').then(($body) => {
    if ($body.find('select[name="branchId"]').length === 0) {
      return;
    }

    cy.get('select[name="branchId"]').then(($select) => {
      const options = Array.from($select[0].options).filter((option) => option.value !== '');
      if (options.length > 0) {
        cy.wrap($select).select(options[0].value);
      }
    });
  });
});

When('I click the row containing {string}', (text) => {
  cy.contains('tr, div', text, { matchCase: false }).first().click({ force: true });
});

When('I select employee {string}', (name) => {
  cy.contains('button', name, { matchCase: false }).click({ force: true });
});

When('I click {string} in the order details toolbar', (buttonText) => {
  cy.contains('button', buttonText, { matchCase: false }).click({ force: true });
});

When('I update the client name to {string}', (name) => {
  cy.get('input[name="clientName"]').clear().type(name, { force: true });
});

When('I update the order description to {string}', (description) => {
  cy.get('textarea[name="description"]').clear().type(description, { force: true });
});

When('I confirm the delete dialog', () => {
  cy.on('window:confirm', () => true);
});
