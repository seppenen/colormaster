/**
 * Хелперы для поля bookingDateTime (дата и время записи клиента).
 *
 * В Firestore значение хранится как ISO string (например 2026-09-12T14:00:00.000Z),
 * но старые записи могут содержать Firestore Timestamp — поддерживаем оба варианта.
 */

/**
 * Приводит значение даты брони к ISO string.
 * Возвращает null, если значение отсутствует или не распознано.
 */
export function normalizeBookingDate(value) {
  if (!value) return null;

  if (typeof value === 'string') {
    return value;
  }

  if (value.toDate && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString();
  }

  return null;
}

/** Приводит значение даты брони к объекту Date или null. */
export function toBookingDate(value) {
  const iso = normalizeBookingDate(value);
  if (!iso) return null;
  const date = new Date(iso);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Значение для <input type="datetime-local"> в локальном времени: YYYY-MM-DDTHH:mm.
 * toISOString() нельзя использовать напрямую — он вернет UTC и сдвинет время.
 */
export function toDateTimeLocalValue(value) {
  const date = toBookingDate(value);
  if (!date) return '';

  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/**
 * Значение из <input type="datetime-local"> ("2026-09-12T14:00") -> ISO string.
 * Строка трактуется как локальное время пользователя.
 */
export function dateTimeLocalToISO(value) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

/** Время по умолчанию при переходе из календаря по клику на дату. */
export const DEFAULT_BOOKING_TIME = '09:00';

/**
 * Строит значение для datetime-local из query-параметра ?date=YYYY-MM-DD.
 * Возвращает '' если параметр отсутствует или некорректен.
 */
export function dateParamToDateTimeLocal(dateParam, time = DEFAULT_BOOKING_TIME) {
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return '';
  const candidate = `${dateParam}T${time}`;
  return isNaN(new Date(candidate).getTime()) ? '' : candidate;
}
