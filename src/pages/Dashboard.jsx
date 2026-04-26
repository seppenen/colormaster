import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService, ORDER_STATUS } from '../services/orderService';
import { userService, USER_ROLES } from '../services/userService';
import { Car, Clock, Search, Eye, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getStatusBadge, checkDelay } from '../utils/orderUtils.jsx';

const Dashboard = ({ user, userData, company }) => {
  const isAdmin = userData?.role === USER_ROLES.ADMIN;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userData?.companyId) return;
      try {
        const data = await orderService.getOrders(userData.companyId);
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userData?.companyId]);

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      order.carModel?.toLowerCase().includes(searchLower) ||
      order.carNumber?.toLowerCase().includes(searchLower) ||
      order.clientName?.toLowerCase().includes(searchLower) ||
      order.clientPhone?.toLowerCase().includes(searchLower) ||
      order.viitenumero?.toLowerCase().includes(searchLower);

    if (showArchived) {
      return matchesSearch && order.status === ORDER_STATUS.LASKUTETTU;
    } else {
      return matchesSearch && order.status !== ORDER_STATUS.LASKUTETTU;
    }
  });

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-stripe-blue"></div>
      </div>
    );

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stripe-dark">
            {company ? company.name : 'Панель управления'}
          </h1>
          <p className="text-stripe-slate mt-1 text-sm">
            {showArchived
              ? 'Архив завершенных заказов'
              : 'Управление и мониторинг активных заказов'}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {userData?.role === USER_ROLES.ADMIN && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                showArchived
                  ? 'bg-stripe-blue text-white'
                  : 'bg-white text-stripe-slate border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {showArchived ? 'Показать активные' : 'Архив'}
            </button>
          )}
          <div className="relative group w-full md:w-auto">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-stripe-blue transition-colors" />
            <input
              type="text"
              placeholder="Поиск по модели, номеру, клиенту..."
              className="stripe-input pl-10 w-full md:w-96"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="stripe-card overflow-hidden">
        {/* Mobile List View (Cards) */}
        <div className="block md:hidden divide-y divide-gray-100">
          {filteredOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-stripe-slate italic">Заказы не найдены</div>
          ) : (
            filteredOrders.map((order) => (
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
                    <div className="text-[11px] text-stripe-slate flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {order.createdAt
                        ? formatDistanceToNow(order.createdAt.toDate(), {
                            addSuffix: true,
                            locale: ru,
                          })
                        : ''}
                    </div>
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

        {/* Desktop Table View */}
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
                  Статус
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">
                  Время
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-stripe-slate uppercase tracking-widest">
                  Действие
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-stripe-slate">
                    <div className="flex flex-col items-center">
                      <Search className="w-8 h-8 text-gray-200 mb-2" />
                      <p>Заказы не найдены</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
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
                          <div className="text-sm font-semibold text-stripe-dark">
                            {order.carModel}
                          </div>
                          <div className="text-xs text-stripe-slate font-mono">
                            {order.carNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-stripe-dark">{order.clientName}</div>
                      <div className="text-xs text-stripe-slate">{order.clientPhone}</div>
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="text-stripe-slate hover:text-stripe-blue p-2 hover:bg-white rounded-md transition-all">
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
