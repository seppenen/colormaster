import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, CalendarDays, Clock, Plus, Search } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

import { ORDER_STATUS, orderService } from '../services/orderService';
import { USER_ROLES } from '../services/userService';
import { toBookingDate } from '../utils/bookingDate';
import { checkDelay, getStatusBadge } from '../utils/orderUtils.jsx';
import BranchSelector from '../components/BranchSelector';

const PAGE_SIZE = 20;

const ORDER_PRIORITY = {
  [ORDER_STATUS.PENDING]: 1,
  [ORDER_STATUS.WAITING_PARTS]: 2,
  [ORDER_STATUS.AVAITING_WORK]: 3,
  [ORDER_STATUS.IN_PROGRESS]: 4,
  [ORDER_STATUS.READY]: 5,
  [ORDER_STATUS.DELIVERED]: 6,
  [ORDER_STATUS.LASKUTETTU]: 7,
};

const getOrderDate = (order) => {
  if (!order?.createdAt) return new Date(0);
  return order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
};

const matchesSearchQuery = (order, searchTerm) => {
  const normalizedQuery = searchTerm.toLowerCase();

  if (!normalizedQuery) return true;

  return [
    order.carModel,
    order.carNumber,
    order.clientName,
    order.clientPhone,
    order.viitenumero,
  ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
};

const sortOrders = (a, b) => {
  const priorityA = ORDER_PRIORITY[a.status] || 99;
  const priorityB = ORDER_PRIORITY[b.status] || 99;

  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }

  return getOrderDate(b) - getOrderDate(a);
};

const Dashboard = ({ user, userData, company, activeBranchId, onBranchChange }) => {
  const isAdmin = userData?.role === USER_ROLES.ADMIN;
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userData?.companyId) return;

      try {
        const branchId = activeBranchId === 'all' ? null : activeBranchId;
        const companyOrders = await orderService.getOrders(userData.companyId, branchId);
        setOrders(companyOrders);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // На мобильных вкладка часто остаётся открытой в фоне часами (свёрнутое приложение).
    // Не дёргаем Firestore, пока страница не видна — экономит трафик/батарею и убирает
    // резкий фетч+ре-рендер большого списка заказов в момент разблокировки телефона.
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [userData?.companyId, activeBranchId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showArchived, activeBranchId]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => matchesSearchQuery(order, searchTerm))
      .filter((order) => {
        if (showArchived) return order.status === ORDER_STATUS.LASKUTETTU;
        return order.status !== ORDER_STATUS.LASKUTETTU;
      })
      .sort(sortOrders);
  }, [orders, searchTerm, showArchived]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-stripe-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stripe-dark">
            {company ? 'Центр заказов' : 'Панель управления'}
          </h1>
          <p className="text-stripe-slate mt-1 text-sm">
            {showArchived
              ? 'Архив завершенных заказов'
              : 'Управление и мониторинг активных заказов'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => navigate('/create-order')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-stripe-blue text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-all shadow-stripe-sm min-w-[120px]"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowArchived((currentValue) => !currentValue)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap min-w-[100px] ${
                  showArchived
                    ? 'bg-stripe-blue text-white'
                    : 'bg-white text-stripe-slate border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {showArchived ? 'Активные' : 'Архив'}
              </button>
            )}

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

          <div className="relative group w-full md:w-auto">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-stripe-blue transition-colors" />
            <input
              type="text"
              placeholder="Поиск по модели, номеру, клиенту..."
              className="stripe-input pl-10 w-full md:w-96"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="stripe-card overflow-hidden">
        <div className="block md:hidden divide-y divide-gray-100">
          {paginatedOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-stripe-slate italic">Заказы не найдены</div>
          ) : (
            paginatedOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/order/${order.id}`)}
                className="p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="bg-stripe-blue/10 p-2 rounded-lg">
                      <Car className="w-5 h-5 text-stripe-blue" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stripe-dark">{order.carModel}</div>
                      <div className="text-[10px] text-stripe-slate font-mono uppercase tracking-wider">
                        {order.carNumber || 'БЕЗ НОМЕРА'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end mt-4">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-stripe-dark">{order.clientName}</div>
                    <div className="text-[10px] text-stripe-blue font-medium">
                      {company?.branches?.find((branch) => branch.id === order.branchId)?.name}
                    </div>
                    <div className="text-[11px] text-stripe-slate flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {order.createdAt
                        ? formatDistanceToNow(order.createdAt.toDate(), {
                            addSuffix: true,
                            locale: ru,
                          })
                        : ''}
                    </div>
                    {toBookingDate(order.bookingDateTime) && (
                      <div className="text-[11px] text-stripe-blue font-semibold flex items-center">
                        <CalendarDays className="w-3 h-3 mr-1" />
                        {format(toBookingDate(order.bookingDateTime), 'd MMM, HH:mm', {
                          locale: ru,
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {getStatusBadge(order, isAdmin)}
                    {checkDelay(order)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">
                  Автомобиль
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">
                  Клиент
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">
                  Филиал
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">
                  Статус
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">
                  Время
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-stripe-slate">
                    <div className="flex flex-col items-center">
                      <Search className="w-8 h-8 text-gray-200 mb-2" />
                      <p>Заказы не найдены</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-stripe-light/50 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/order/${order.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-50 rounded-md mr-3 border border-gray-100 group-hover:bg-white transition-colors">
                          <Car className="w-4 h-4 text-stripe-slate" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-stripe-dark">{order.carModel}</div>
                          <div className="text-xs text-stripe-slate font-mono">{order.carNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-stripe-dark">{order.clientName}</div>
                      <div className="text-xs text-stripe-slate">{order.clientPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stripe-dark">
                        {company?.branches?.find((branch) => branch.id === order.branchId)?.name || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {getStatusBadge(order, isAdmin)}
                        {checkDelay(order)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-[11px] text-stripe-slate font-medium flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {order.createdAt
                          ? formatDistanceToNow(order.createdAt.toDate(), {
                              addSuffix: true,
                              locale: ru,
                            })
                          : ''}
                      </div>
                      {toBookingDate(order.bookingDateTime) && (
                        <div className="text-[11px] text-stripe-blue font-semibold flex items-center mt-1">
                          <CalendarDays className="w-3 h-3 mr-1" />
                          {format(toBookingDate(order.bookingDateTime), 'd MMM, HH:mm', {
                            locale: ru,
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-stripe-sm">
          <div className="text-sm text-stripe-slate">
            Показано {Math.min((safeCurrentPage - 1) * PAGE_SIZE + 1, filteredOrders.length)}-
            {Math.min(safeCurrentPage * PAGE_SIZE, filteredOrders.length)} из {filteredOrders.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-stripe-slate disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Назад
            </button>
            <span className="text-sm font-semibold text-stripe-dark">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-stripe-slate disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Далее
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
