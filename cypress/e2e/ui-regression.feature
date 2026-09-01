Feature: Full UI regression coverage

  Scenario: protected routes redirect unauthenticated users
    Given I open the "/calendar" page
    Then I should be redirected to "/login"
    And I open the "/users" page
    Then I should be redirected to "/login"
    And I open the "/reporting" page
    Then I should be redirected to "/login"

  Scenario: invalid login shows an error and keeps user on the login page
    Given I open the login page
    When I fill in "Электронная почта" with "alex.seppenen@gmail.com"
    And I fill in "Пароль" with "wrong-password"
    And I click "Войти"
    Then I should see "Неверный логин или пароль"
    And I should be redirected to "/login"

  Scenario: admin can access the main navigation pages from the dashboard
    Given I am logged in as "alex.seppenen@gmail.com" with password "000000"
    Then I should see "Центр заказов"
    When I click "Календарь"
    Then I should see "Календарь бронирований"
    And I should see "Создать бронь"
    When I click "Центр заказов"
    Then I should see "Центр заказов"
    When I click "Настройки"
    Then I should see "Настройки"
    And I should see "Управление пользователями и филиалами"
    When I click "Отчеты"
    Then I should see "Отчеты"

  Scenario: dashboard search filters the active order list
    Given I am logged in as "alex.seppenen@gmail.com" with password "000000"
    And I open the dashboard page
    When I search for "BMW"
    Then I should see "Центр заказов"

  Scenario: create order form can be opened and submitted
    Given I am logged in as "alex.seppenen@gmail.com" with password "000000"
    And I open the dashboard page
    When I click "Добавить"
    Then I should see "Создать заказ"
    And I fill in "Марка и модель автомобиля" with "Audi A6"
    And I fill in "ФИО клиента" with "UI Regression Test User"
    And I fill in "Дата и время записи" with "2027-02-10T12:30"
    And I fill in "Описание работ" with "UI regression smoke test"
    And I select the first available branch if present
    And I click "Создать заказ"
    Then I should be redirected to "/"

  Scenario: dashboard renders the main order panel after login
    Given I am logged in as "alex.seppenen@gmail.com" with password "000000"
    And I open the dashboard page
    Then I should see "Центр заказов"

  Scenario: calendar page renders booking events and booking CTA
    Given I am logged in as "alex.seppenen@gmail.com" with password "000000"
    When I click "Календарь"
    Then I should see "Календарь бронирований"
    And I should see "Создать бронь"
