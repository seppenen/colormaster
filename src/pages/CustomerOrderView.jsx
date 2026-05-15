import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { companyService } from '../services/companyService';
import { 
  Camera, 
  Clock, 
  CheckCircle, 
  Info,
  Car,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getStatusBadge } from '../utils/orderUtils.jsx';

const CustomerOrderView = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const orderData = await orderService.getOrder(id);
        setOrder(orderData);
        
        if (orderData && orderData.companyId) {
          const compData = await companyService.getCompany(orderData.companyId);
          setCompany(compData);
        }
      } catch (err) {
        console.error('Error fetching order for customer view:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-stripe-blue"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-stripe p-8 text-center">
          <Info className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-stripe-dark mb-2">Заказ не найден</h1>
          <p className="text-stripe-slate">К сожалению, мы не смогли найти информацию об этом заказе. Пожалуйста, проверьте ссылку или свяжитесь с нами.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {company?.logo ? (
              <img src={company.logo} alt={company.name} className="h-8 w-auto" />
            ) : (
              <div className="bg-stripe-blue p-1.5 rounded-lg shadow-stripe">
                <Car className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="font-bold text-stripe-dark truncate">{company?.name || 'Статус заказа'}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest leading-none mb-1">Номер заказа</span>
             <span className="text-sm font-mono font-bold text-stripe-dark leading-none">{order.carNumber || id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
        {/* Status Card */}
        <div className="bg-stripe-dark rounded-3xl p-8 text-white shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-stripe-blue/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="relative z-10 text-center">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Текущий статус</p>
            <div className="flex justify-center mb-6">
              {getStatusBadge(order, false)}
            </div>
            <p className="text-sm text-gray-300">
              Последнее обновление: {order.updatedAt ? format(order.updatedAt.toDate(), 'dd MMMM, HH:mm', { locale: ru }) : 'Недавно'}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Car Details */}
          <div className="bg-white rounded-3xl p-8 shadow-stripe border border-gray-100">
            <h2 className="text-lg font-bold text-stripe-dark mb-6 flex items-center">
              <Car className="w-5 h-5 mr-3 text-stripe-blue" />
              Автомобиль
            </h2>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest mb-1">Марка и модель</p>
                <p className="text-xl font-bold text-stripe-dark">{order.carModel}</p>
              </div>
              <div>
                <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest mb-1">Регистрационный номер</p>
                <p className="text-xl font-mono font-bold text-stripe-dark uppercase">{order.carNumber || '—'}</p>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-white rounded-3xl p-8 shadow-stripe border border-gray-100">
            <h2 className="text-lg font-bold text-stripe-dark mb-6 flex items-center">
              <Info className="w-5 h-5 mr-3 text-stripe-blue" />
              Мастерская
            </h2>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest mb-1">Название</p>
                <p className="text-xl font-bold text-stripe-dark">{company?.name}</p>
              </div>
              {order.branchId && company?.branches && (
                <div>
                  <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest mb-1">Филиал</p>
                  <p className="text-xl font-bold text-stripe-dark">
                    {company.branches.find(b => b.id === order.branchId)?.name || 'Основной'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-3xl p-8 shadow-stripe border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-stripe-dark flex items-center">
              <Camera className="w-5 h-5 mr-3 text-stripe-blue" />
              Фотографии
            </h2>
            <span className="text-xs font-bold text-stripe-slate bg-gray-50 px-3 py-1 rounded-full">
              {order.photos?.length || 0}
            </span>
          </div>
          
          {order.photos && order.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {order.photos.map((photo, index) => (
                <div 
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-2xl border border-gray-50 cursor-zoom-in hover:scale-[1.02] transition-transform shadow-sm"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img src={photo} alt={`Car photo ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
              <Camera className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-stripe-slate font-medium text-sm">Фотографии еще не добавлены</p>
            </div>
          )}
        </div>

        {/* Comments/Staff Notes (Optional: Only if there are public-facing comments or you want to show all) */}
        {/* For now, let's show comments as "Статус работ" if requested */}
        {order.comments && order.comments.length > 0 && (
          <div className="bg-white rounded-3xl p-8 shadow-stripe border border-gray-100">
            <h2 className="text-lg font-bold text-stripe-dark mb-6 flex items-center">
              <MessageSquare className="w-5 h-5 mr-3 text-stripe-blue" />
              Комментарии сотрудников
            </h2>
            <div className="space-y-4">
              {order.comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-stripe-blue uppercase tracking-wider">{comment.userName}</span>
                    <span className="text-[10px] text-stripe-slate">
                      {comment.timestamp?.toDate
                        ? format(comment.timestamp.toDate(), 'dd.MM.yy HH:mm', { locale: ru })
                        : format(new Date(comment.timestamp), 'dd.MM.yy HH:mm', { locale: ru })}
                    </span>
                  </div>
                  <p className="text-stripe-dark text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <img src={selectedPhoto} className="max-w-full max-h-full object-contain rounded-lg" alt="Enlarged" />
        </div>
      )}
    </div>
  );
};

export default CustomerOrderView;
