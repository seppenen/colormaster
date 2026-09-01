Feature: Authentication flow

  Scenario: login page loads correctly
    Given I open the login page
    Then I should see "Войдите в свою учетную запись"
    And I should see "Войти"

  Scenario: unauthenticated user is redirected away from home page
    Given I open the root page
    Then I should be redirected to "/login"

  Scenario: wrong password shows an error message
    Given I open the login page
    When I fill in "Электронная почта" with "alex.seppenen@gmail.com"
    And I fill in "Пароль" with "wrong-password"
    And I click "Войти"
    Then I should see "Неверный логин или пароль"

  Scenario: user fills credentials and submits the login form
    Given I open the login page
    When I fill in "Электронная почта" with "alex.seppenen@gmail.com"
    And I fill in "Пароль" with "000000"
    And I click "Войти"
    Then the login form should handle the submission result

  Scenario: admin can open the settings page
    Given I am logged in as "alex.seppenen@gmail.com" with password "000000"
    Then I should see "Центр заказов"
    When I click "Настройки"
    Then I should see "Настройки"
    And I should see "Управление пользователями и филиалами"

  Scenario: admin can open the reporting page
    Given I am logged in as "alex.seppenen@gmail.com" with password "000000"
    Then I should see "Центр заказов"
    When I click "Отчеты"
    Then I should see "Отчеты"
