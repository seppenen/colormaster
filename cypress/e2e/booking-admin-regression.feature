Feature: Booking admin regression flow

  Scenario: create edit and delete a booking through dashboard and order details
    Given I am logged in as "alex.seppenen@gmail.com" with password "000000"
    And I open the dashboard page
    When I click "Добавить"
    Then I should see "Создать заказ"
    And I fill in "Марка и модель автомобиля" with "Audi A6"
    And I fill in "ФИО клиента" with "Редактируемый Клиент 2026"
    And I fill in "Дата и время записи" with "2027-03-12T14:00"
    And I fill in "Описание работ" with "Проверка редактирования и удаления брони"
    And I select the first available branch if present
    And I click "Создать заказ"
    Then I should be redirected to "/"
    When I search for "Редактируемый Клиент 2026"
    And I click the row containing "Редактируемый Клиент 2026"
    Then I should see "Редактируемый Клиент 2026"
    When I click "Изменить" in the order details toolbar
    And I update the client name to "Обновленный Клиент 2026"
    And I update the order description to "Описание обновлено в E2E тесте"
    And I click "Сохранить изменения"
    Then I should see "Обновленный Клиент 2026"
    When I click "Удалить"
    And I confirm the delete dialog
    Then I should be redirected to "/"

  Scenario: calendar booking flow opens creation and detail views
    Given I am logged in as "alex.seppenen@gmail.com" with password "000000"
    When I click "Календарь"
    Then I should see "Календарь бронирований"
    And I should see "Создать бронь"
    When I click "Создать бронь"
    Then I should see "Создать заказ"

  Scenario: reporting page shows employee salary summary and payment state
    Given I am logged in as "alex.seppenen@gmail.com" with password "000000"
    And I click "Отчеты"
    Then I should see "Отчеты"
    And I should see "Сотрудники"
    When I select employee "Alex Seppenen"
    Then I should see "Заработок за месяц"
    And I should see "Список работ"
