import React from 'react';
import { ORDER_STATUS } from '../services/orderService';
import { AlertTriangle, Info } from 'lucide-react';

export const getStatusBadge = (order, isAdmin = false) => {
  const status = typeof order === 'string' ? order : order.status;
  
  // If status is Lasku OK but user is not admin, show as Delivered or something else?
  // User said "Lasku ok status visible only to admin". 
  // If we just return null or generic, it might be confusing.
  // But usually "visible only to admin" means exactly that.
  if (status === ORDER_STATUS.LASKUTETTU && !isAdmin) {
    return (
      <span className="stripe-badge bg-purple-100 text-purple-700 font-bold">
        {ORDER_STATUS.DELIVERED}
      </span>
    );
  }

  const isDelayed =
    typeof order === 'object' &&
    order.status === ORDER_STATUS.PENDING &&
    order.status !== ORDER_STATUS.DELIVERED &&
    order.status !== ORDER_STATUS.LASKUTETTU &&
    (() => {
      const lastChange = order.statusChangedAt?.toDate() || order.createdAt?.toDate();
      if (!lastChange) return false;
      const diffDays = Math.floor((new Date() - lastChange) / (1000 * 60 * 60 * 24));
      return diffDays >= 2;
    })();

  const baseClasses = 'stripe-badge';
  if (isDelayed) {
    return (
      <span
        className={`${baseClasses} bg-red-100 text-red-700 font-bold border border-red-200 animate-pulse`}
      >
        {status}
      </span>
    );
  }

  switch (status) {
    case ORDER_STATUS.PENDING:
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-700 font-bold`}>{status}</span>
      );
    case ORDER_STATUS.IN_PROGRESS:
      return (
        <span className={`${baseClasses} bg-blue-100 text-stripe-blue font-bold`}>{status}</span>
      );
    case ORDER_STATUS.WAITING_PARTS:
      return (
        <span className={`${baseClasses} bg-orange-100 text-orange-700 font-bold`}>{status}</span>
      );
    case ORDER_STATUS.READY:
      return (
        <span className={`${baseClasses} bg-emerald-100 text-emerald-700 font-bold`}>{status}</span>
      );
    case ORDER_STATUS.DELIVERED:
      return (
        <span className={`${baseClasses} bg-purple-100 text-purple-700 font-bold`}>{status}</span>
      );
    case ORDER_STATUS.LASKUTETTU:
      return <span className={`${baseClasses} bg-gray-200 text-gray-700 font-bold`}>{status}</span>;
    default:
      return (
        <span className={`${baseClasses} bg-gray-100 text-stripe-slate font-bold`}>{status}</span>
      );
  }
};

export const checkDelay = (order) => {
  if (order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.LASKUTETTU)
    return null;
  if (order.status !== ORDER_STATUS.PENDING) return null;

  const lastChange = order.statusChangedAt?.toDate() || order.createdAt?.toDate();
  if (!lastChange) return null;

  const diffDays = Math.floor((new Date() - lastChange) / (1000 * 60 * 60 * 24));
  if (diffDays >= 2) {
    return (
      <div className="flex items-center text-red-600 text-xs font-bold animate-pulse">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Задержка {diffDays} дн.
      </div>
    );
  }
  return null;
};

export const formatDuration = (ms) => {
  if (!ms || ms < 0) return '0ч';
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return `${hours}:${minutes.toString().padStart(2, '0')}ч`;
};

export const getUpdateIndicator = (order) => {
  if (!order.history || order.history.length === 0) return null;

  const hasUpdates = order.history.some(entry => 
    ['DETAILS_CHANGED', 'PRICE_CHANGED', 'WORKER_PRICE_CHANGED', 'DESCRIPTION_CHANGED'].includes(entry.action)
  );

  if (hasUpdates) {
    return (
      <div className="flex items-center text-stripe-blue bg-stripe-blue/10 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" title="Данные были обновлены">
        <Info className="w-3 h-3 mr-1" />
        Обновлено
      </div>
    );
  }

  return null;
};
