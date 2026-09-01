Feature: Dashboard, calendar and order creation flow

  Scenario: dashboard route is protected for unauthenticated users
    Given I open the root page
    Then I should be redirected to "/login"

  Scenario: authenticated user can use the main app flow
    Given I open the login page
    When I fill in "Электронная почта" with "alex.seppenen@gmail.com"
    And I fill in "Пароль" with "000000"
    And I click "Войти"
    Then I should see "Центр заказов"
    And I should see "Добавить"
    When I click "Календарь"
    Then I should see "Календарь бронирований"
    And I should see "Создать бронь"
    When I open the dashboard page
    And I click "Добавить"
    Then I should see "Создать заказ"
    And I fill in "Марка и модель автомобиля" with "BMW X5"
    And I fill in "ФИО клиента" with "Тестовый Клиент"
    And I fill in "Дата и время записи" with "2027-01-10T10:30"
    And I fill in "Описание работ" with "Тестовая запись для UI проверки"
    And I select the first available branch if present
    And I click "Создать заказ"
    Then I should be redirected to "/"
