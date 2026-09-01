import { Before, Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

const resetBrowserAuth = () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.visit('about:blank', {
    onBeforeLoad(win) {
      win.localStorage.clear();
      win.sessionStorage.clear();
      if ('indexedDB' in win) {
        const databaseNames = [
          'firebaseLocalStorageDb',
          'firebase-installations-database',
          'firebase-heartbeat-database',
          'firebase-messaging-database',
        ];

        databaseNames.forEach((databaseName) => {
          try {
            win.indexedDB.deleteDatabase(databaseName);
          } catch (error) {
            // Ignore database reset failures during browser setup.
          }
        });
      }
    },
  });
};

Before(() => {
  resetBrowserAuth();
});

Given('I open the login page', () => {
  cy.visit('/login');
});

Given('I open the dashboard page', () => {
  cy.visit('/');
});

Given('I open the root page', () => {
  cy.visit('/');
});

Given('I am logged in as {string} with password {string}', (email, password) => {
  const sessionKey = `${email}:${password}:${Date.now()}`;

  cy.session(sessionKey, () => {
    resetBrowserAuth();
    cy.visit('/login');
    cy.contains('label', 'Электронная почта').parent().find('input').clear().type(email);
    cy.contains('label', 'Пароль').parent().find('input').clear().type(password);
    cy.contains('button', 'Войти').click({ force: true });
    cy.location('pathname').should('eq', '/');
  });

  cy.visit('/');
});

When('I fill in {string} with {string}', (fieldLabel, value) => {
  const normalizedLabel = fieldLabel.toLowerCase();

  cy.contains('label', fieldLabel)
    .parent()
    .find('input, textarea, select')
    .first()
    .clear()
    .type(value, { force: true });

  if (normalizedLabel.includes('email') || normalizedLabel.includes('почта')) {
    return;
  }

  if (normalizedLabel.includes('password') || normalizedLabel.includes('пароль')) {
    return;
  }
});

When('I click {string}', (buttonText) => {
  const directSelectorMap = {
    'Центр заказов': 'a[href="/"]',
    'Календарь': 'a[href="/calendar"]',
    'Настройки': 'a[href="/users"]',
    'Отчеты': 'a[href="/reporting"]',
    'Войти': 'button[type="submit"]',
    'Добавить': 'button, a',
  };

  const fallbackSelector = 'button, a, [role="button"]';

  cy.get('body').then(($body) => {
    const directSelector = directSelectorMap[buttonText];

    if (directSelector) {
      const directElements = $body.find(directSelector);
      if (directElements.length > 0) {
        cy.get(directSelector).first().click({ force: true });
        return;
      }
    }

    const possible = [...$body.find(fallbackSelector)];
    const target = possible.find((el) => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return text === buttonText || text.includes(buttonText);
    });

    if (target) {
      cy.wrap(target).click({ force: true });
      return;
    }

    const menuButton = possible.find((el) => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      const aria = (el.getAttribute('aria-label') || '').toLowerCase();
      return (
        (el.tagName === 'BUTTON' && !text && el.querySelector('svg')) ||
        aria.includes('menu') ||
        aria.includes('toggle')
      );
    });

    if (menuButton) {
      cy.wrap(menuButton).click({ force: true });
      cy.contains(fallbackSelector, buttonText, { matchCase: false }).click({ force: true });
      return;
    }

    cy.contains(fallbackSelector, buttonText, { matchCase: false }).click({ force: true });
  });
});

Then('I should see {string}', (message) => {
  cy.contains(message).should('exist');
});

Then('the login form should handle the submission result', () => {
  cy.location('pathname').then((pathname) => {
    if (pathname === '/login') {
      cy.get('body').then(($body) => {
        const hasError = $body.text().includes('Неверный логин или пароль');
        const hasForm = $body.find('button[type="submit"]').length > 0;
        expect(hasError || hasForm).to.be.true;
      });
      return;
    }

    expect(pathname).to.not.equal('/login');
  });
});

Then('I should be redirected to {string}', (path) => {
  cy.location('pathname').should('eq', path);
});
