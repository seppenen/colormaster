import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, X, Car, User, Phone, Clock, MessageSquare, CalendarDays } from 'lucide-react';
import { orderService, ORDER_STATUS } from '../services/orderService';
import { getStatusBadge, getStatusColor, STATUS_COLORS } from '../utils/orderUtils.jsx';
import { toBookingDate } from '../utils/bookingDate';
import BranchSelector from '../components/BranchSelector';
import { USER_ROLES } from '../services/userService';

const LEGEND = Object.values(ORDER_STATUS).map((status) => ({
  status,
  color: STATUS_COLORS[status],
}));

const CalendarPage = ({ userData, company, activeBranchId, onBranchChange }) => {
  const navigate = useNavigate();
  const isAdmin = userData?.role === USER_ROLES.ADMIN;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchOrders = async () => {
      if (!userData?.companyId) return;
      try {
        const branchId = activeBranchId === 'all' ? null : activeBranchId;
        const data = await orderService.getOrders(userData.companyId, branchId);
        if (!cancelled) {
          setOrders(data);
          setError(false);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [userData?.companyId, activeBranchId]);

  // Заказы без даты записи в календаре не показываем, но приложение не падает.
  const events = useMemo(
    () =>
      orders.reduce((acc, order) => {
        const date = toBookingDate(order.bookingDateTime);
        if (!date) return acc;

        const time = format(date, 'HH:mm');
        const title = [time, order.clientName, order.carModel].filter(Boolean).join(' — ');
        const color = getStatusColor(order.status);

        acc.push({
          id: order.id,
          title,
          start: date.toISOString(),
          backgroundColor: color,
          borderColor: color,
          extendedProps: { order },
        });
        return acc;
      }, []),
    [orders]
  );

  const handleEventClick = (info) => {
    setSelectedOrder(info.event.extendedProps.order);
  };

  const handleDateClick = (info) => {
    navigate(`/create-order?date=${info.dateStr.slice(0, 10)}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-stripe-blue"></div>
        <p className="text-sm text-stripe-slate">Загрузка календаря...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="stripe-card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stripe-dark">
              Календарь бронирований
            </h1>
            <p className="text-stripe-slate mt-1 text-sm">Записи клиентов по дате и времени</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => navigate('/create-order')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-stripe-blue text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-all shadow-stripe-sm min-w-[140px]"
            >
              <Plus className="w-4 h-4" />
              <span>Создать бронь</span>
            </button>
            {isAdmin && (
              <div className="flex-1 md:flex-none min-w-[160px]">
                <BranchSelector
                  company={company}
                  activeBranchId={activeBranchId}
                  onBranchChange={onBranchChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="stripe-card p-4 border-red-100 bg-red-50 text-red-700 text-sm font-medium">
          Не удалось загрузить бронирования
        </div>
      )}

      <div className="stripe-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {LEGEND.map(({ status, color }) => (
              <div key={status} className="flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1.5 ring-1 ring-slate-100">
                <span className="w-3 h-3 rounded-sm shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold text-slate-600">{status}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100">
            <CalendarDays className="w-3.5 h-3.5" />
            {orders.length} броней
          </div>
        </div>
      </div>

      <div className="stripe-card p-3 md:p-5 booking-calendar">
        {!error && events.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CalendarDays className="w-8 h-8 text-gray-200" />
            <p className="text-sm text-stripe-slate italic">Нет бронирований для отображения</p>
          </div>
        )}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={ruLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: isMobile ? 'dayGridMonth,timeGridDay' : 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          selectable={true}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          height="auto"
          expandRows={true}
          nowIndicator={true}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          dayMaxEvents={isMobile ? 2 : 4}
          // Время уже есть в заголовке события — убираем дубль от FullCalendar
          displayEventTime={false}
          // Заливка блока цветом статуса вместо точки в режиме месяца
          eventDisplay="block"
        />
      </div>

      {selectedOrder &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="bg-white rounded-xl shadow-stripe w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between p-6 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-stripe-dark">Детали брони</h3>
                  <div className="mt-2">{getStatusBadge(selectedOrder, isAdmin)}</div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-stripe-slate hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <DetailRow
                  icon={<User className="w-4 h-4" />}
                  label="Клиент"
                  value={selectedOrder.clientName || '—'}
                />
                <DetailRow
                  icon={<Phone className="w-4 h-4" />}
                  label="Телефон"
                  value={selectedOrder.clientPhone || '—'}
                />
                <DetailRow
                  icon={<Car className="w-4 h-4" />}
                  label="Автомобиль"
                  value={
                    [selectedOrder.carModel, selectedOrder.carNumber].filter(Boolean).join(' · ') ||
                    '—'
                  }
                />
                <DetailRow
                  icon={<CalendarDays className="w-4 h-4" />}
                  label="Дата"
                  value={
                    toBookingDate(selectedOrder.bookingDateTime)
                      ? format(toBookingDate(selectedOrder.bookingDateTime), 'd MMMM yyyy', {
                          locale: ru,
                        })
                      : '—'
                  }
                />
                <DetailRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Время"
                  value={
                    toBookingDate(selectedOrder.bookingDateTime)
                      ? format(toBookingDate(selectedOrder.bookingDateTime), 'HH:mm')
                      : '—'
                  }
                />
                <DetailRow
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="Описание работ"
                  value={selectedOrder.description || '—'}
                />
                <DetailRow
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="Комментарий"
                  value={
                    selectedOrder.comments?.length
                      ? selectedOrder.comments[selectedOrder.comments.length - 1].text
                      : selectedOrder.comment || '—'
                  }
                />
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => navigate(`/order/${selectedOrder.id}`)}
                  className="stripe-button-primary w-full"
                >
                  Открыть бронь
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <div className="flex gap-3">
    <span className="text-stripe-slate mt-0.5 shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-stripe-dark whitespace-pre-wrap break-words">
        {value}
      </p>
    </div>
  </div>
);

export default CalendarPage;
