import React, { useState, useEffect } from 'react';
import { userService, USER_ROLES } from '../services/userService';
import { orderService, ORDER_STATUS } from '../services/orderService';
import { Users, FileText, ChevronLeft, ChevronRight, Euro, Calendar, ExternalLink, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isSameMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { formatDuration } from '../utils/orderUtils';

const Reporting = ({ userData }) => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, ordersData] = await Promise.all([
          userService.getAllUsers(userData.companyId),
          orderService.getOrders(userData.companyId)
        ]);
        
        // If employee has a branch, they should only see users and orders from their branch
        // Note: Admin still sees everything
        let filteredUsers = usersData;
        let filteredOrders = ordersData;
        
        if (userData.role !== USER_ROLES.ADMIN && userData.branchId) {
          filteredUsers = usersData.filter(u => u.branchId === userData.branchId);
          filteredOrders = ordersData.filter(o => o.branchId === userData.branchId);
        }

        setUsers(filteredUsers);
        setOrders(filteredOrders);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userData.companyId]);

  // Months for selection (last 12 months)
  const months = eachMonthOfInterval({
    start: subMonths(new Date(), 11),
    end: new Date(),
  }).reverse();

  const handlePrevMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    // Don't go beyond current month
    if (isSameMonth(selectedMonth, new Date())) return;
    setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)));
  };

  const getWorkerFromHistory = (order) => {
    if (!order.history) return null;
    // Look for who moved to IN_PROGRESS or READY or DELIVERED
    const relevantActions = ['IN_PROGRESS', 'READY', 'DELIVERED', 'STATUS_CHANGED'];
    const workerEntry = order.history.find(h => 
      (h.to === ORDER_STATUS.IN_PROGRESS || h.to === ORDER_STATUS.READY || h.to === ORDER_STATUS.DELIVERED || h.to === ORDER_STATUS.SAVAS_SENT) && h.userId
    );
    return workerEntry ? workerEntry.userId : order.createdBy;
  };

  const getFilteredOrders = (userId) => {
    return orders.filter(order => {
      // Priority 1: explicitly assigned workerId
      // Priority 2: fallback to history tracking
      const workerId = order.workerId || getWorkerFromHistory(order);
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      
      return workerId === userId && isSameMonth(orderDate, selectedMonth);
    });
  };

  const calculateTotalEarnings = (filteredOrders) => {
    return filteredOrders.reduce((sum, order) => sum + (Number(order.workerPrice) || 0), 0);
  };

  const calculateTotalDuration = (userId, filteredOrders) => {
    return filteredOrders.reduce((sum, order) => {
      // Use the specific time recorded for this worker if available
      if (order.workerTimes && order.workerTimes[userId]) {
        return sum + order.workerTimes[userId];
      }
      // Fallback for orders before workerTimes was implemented
      // or if workerTimes doesn't have this user (shouldn't happen with filtered orders)
      return sum + (Number(order.workDuration) || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-stripe-blue"></div>
      </div>
    );
  }

  const selectedUser = users.find(u => u.uid === selectedUserId);
  const filteredOrders = selectedUserId ? getFilteredOrders(selectedUserId) : [];
  const totalEarnings = calculateTotalEarnings(filteredOrders);
  const totalDuration = selectedUserId ? calculateTotalDuration(selectedUserId, filteredOrders) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stripe-dark">Отчеты</h1>
          <p className="text-stripe-slate mt-1 text-sm">Просмотр выработки и заработка сотрудников</p>
        </div>
        
        <div className="flex items-center space-x-4 bg-white p-2 rounded-xl shadow-stripe-sm border border-gray-100">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-50 rounded-lg text-stripe-slate transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 px-2 min-w-[140px] justify-center">
            <Calendar className="w-4 h-4 text-stripe-blue" />
            <span className="text-sm font-bold text-stripe-dark capitalize">
              {format(selectedMonth, 'LLLL yyyy', { locale: ru })}
            </span>
          </div>
          <button 
            onClick={handleNextMonth}
            disabled={isSameMonth(selectedMonth, new Date())}
            className={`p-2 rounded-lg transition-colors ${isSameMonth(selectedMonth, new Date()) ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-50 text-stripe-slate'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-bold text-stripe-slate uppercase tracking-widest px-1">Сотрудники</h2>
          <div className="space-y-2">
              {users.map((user) => {
                const userOrders = getFilteredOrders(user.uid);
                const userEarnings = calculateTotalEarnings(userOrders);
                const userDuration = calculateTotalDuration(user.uid, userOrders);
                
                return (
                  <button
                    key={user.uid}
                    onClick={() => setSelectedUserId(user.uid)}
                    className={`w-full text-left p-4 rounded-xl transition-all border ${
                      selectedUserId === user.uid
                        ? 'bg-white border-stripe-blue shadow-stripe-sm ring-1 ring-stripe-blue/10'
                        : 'bg-[#f6f9fc] border-transparent hover:bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${
                          selectedUserId === user.uid ? 'bg-stripe-blue text-white border-stripe-blue' : 'bg-white text-stripe-blue border-gray-100'
                        }`}>
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${selectedUserId === user.uid ? 'text-stripe-dark' : 'text-stripe-slate'}`}>
                            {user.name}
                          </p>
                          <p className="text-[10px] text-stripe-slate uppercase tracking-wider font-bold">
                            {user.role === USER_ROLES.ADMIN ? 'Админ' : 'Сотрудник'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {userEarnings > 0 && <p className="text-sm font-black text-stripe-dark">€{userEarnings}</p>}
                        {userDuration > 0 && (
                          <p className="text-[10px] text-stripe-slate font-bold flex items-center justify-end">
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            {formatDuration(userDuration)}
                          </p>
                        )}
                        {userOrders.length > 0 && <p className="text-[10px] text-emerald-600 font-bold">{userOrders.length} зак.</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Selected User Details */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedUserId ? (
            <div className="stripe-card p-12 text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-stripe-dark">Выберите сотрудника</h3>
              <p className="text-stripe-slate text-sm mt-1">Для просмотра детальной статистики выберите сотрудника из списка слева</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stripe-card p-6 bg-stripe-blue">
                  <p className="text-[10px] text-blue-100 uppercase font-bold tracking-widest mb-1">Заработок за месяц</p>
                  <div className="flex items-baseline text-white">
                    <span className="text-3xl font-black">€{totalEarnings}</span>
                    <span className="ml-2 text-xs font-bold opacity-80 uppercase tracking-wider">EUR</span>
                  </div>
                </div>
                <div className="stripe-card p-6 bg-white border border-gray-100 shadow-stripe-sm">
                  <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest mb-1">Выполнено заказов</p>
                  <div className="flex items-baseline text-stripe-dark">
                    <span className="text-3xl font-black">{filteredOrders.length}</span>
                    <span className="ml-2 text-xs font-bold text-stripe-slate uppercase tracking-wider">Заказов</span>
                  </div>
                </div>
                <div className="stripe-card p-6 bg-white border border-gray-100 shadow-stripe-sm">
                  <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest mb-1">Всего в работе</p>
                  <div className="flex items-baseline text-stripe-dark">
                    <span className="text-3xl font-black">{formatDuration(totalDuration)}</span>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="stripe-card overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                  <h3 className="text-lg font-bold text-stripe-dark flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-stripe-blue" />
                    Список работ
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  {filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-stripe-slate italic">В этом месяце заказов не найдено</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-stripe-slate uppercase tracking-widest">Заказ</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-stripe-slate uppercase tracking-widest">Дата</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-stripe-slate uppercase tracking-widest">Время</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-stripe-slate uppercase tracking-widest">Статус</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-stripe-slate uppercase tracking-widest">Заработок</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <Link to={`/order/${order.id}`} className="flex flex-col group/link">
                                <span className="text-sm font-bold text-stripe-dark group-hover/link:text-stripe-blue transition-colors flex items-center">
                                  {order.carModel}
                                  <ExternalLink className="w-3 h-3 ml-1.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                </span>
                                <span className="text-xs text-stripe-slate font-mono uppercase">{order.carNumber}</span>
                              </Link>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-stripe-slate">
                                {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'dd.MM.yyyy') : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-stripe-slate font-bold">
                                {formatDuration(order.workerTimes?.[selectedUserId] || order.workDuration)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-600">
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-black text-stripe-dark">€{order.workerPrice || 0}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reporting;
