import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService, ORDER_STATUS } from '../services/orderService';
import { USER_ROLES } from '../services/userService';
import {
  ClipboardList,
  Edit2,
  Trash2,
  Printer,
  Camera,
  PlusCircle,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getStatusBadge } from '../utils/orderUtils.jsx';

const OrderDetails = ({ user, userData }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editFormData, setEditFormData] = useState({
    carModel: '',
    carNumber: '',
    clientName: '',
    clientPhone: '',
    viitenumero: '',
    description: '',
  });
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const isAdmin = userData?.role === USER_ROLES.ADMIN;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getOrder(id);
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === order.status) return;
    try {
      await orderService.updateOrderStatus(id, newStatus, user);
      const updatedOrder = await orderService.getOrder(id);
      setOrder(updatedOrder);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePriceChange = async () => {
    const newPrice = prompt('Введите новую цену:', order.price);
    if (newPrice !== null && !isNaN(newPrice)) {
      try {
        await orderService.updateOrderPrice(id, Number(newPrice), user);
        const updatedOrder = await orderService.getOrder(id);
        setOrder(updatedOrder);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEditDetails = () => {
    setEditFormData({
      carModel: order.carModel || '',
      carNumber: order.carNumber || '',
      clientName: order.clientName || '',
      clientPhone: order.clientPhone || '',
      viitenumero: order.viitenumero || '',
      description: order.description || '',
    });
    setIsEditingDetails(true);
  };

  const handleSaveDetails = async () => {
    try {
      await orderService.updateOrderDetails(id, editFormData, user);
      const updatedOrder = await orderService.getOrder(id);
      setOrder(updatedOrder);
      setIsEditingDetails(false);
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении деталей');
    }
  };

  const handleEditInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'carNumber') {
      const val = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (val.length > 3) {
        value = val.slice(0, 3) + '-' + val.slice(3, 6);
      } else {
        value = val;
      }
    }
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteOrder = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ? Это действие необратимо.')) {
      try {
        await orderService.deleteOrder(id);
        navigate('/');
      } catch (err) {
        console.error(err);
        alert('Ошибка при удалении заказа');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith('image/');
      return isImage;
    });

    if (validFiles.length !== files.length) {
      alert('Некоторые файлы были отклонены. Разрешены только изображения.');
    }

    if (validFiles.length === 0) return;

    setIsUploadingPhotos(true);
    try {
      await orderService.addOrderPhotos(id, validFiles, user);
      const updatedOrder = await orderService.getOrder(id);
      setOrder(updatedOrder);
    } catch (err) {
      console.error(err);
      alert('Ошибка при загрузке фотографий');
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const handleDeletePhoto = async (photoUrl, e) => {
    e.stopPropagation();
    if (!isAdmin) return;

    if (window.confirm('Удалить эту фотографию?')) {
      try {
        await orderService.deleteOrderPhoto(id, photoUrl, user);
        const updatedOrder = await orderService.getOrder(id);
        setOrder(updatedOrder);
      } catch (err) {
        console.error(err);
        alert('Ошибка при удалении фотографии');
      }
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-stripe-blue"></div>
      </div>
    );
  if (!order) return <div className="text-center py-12 stripe-card">Заказ не найден</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 print:m-0 print:p-0">
      {/* Action Bar (hidden when printing) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <div className="bg-stripe-blue p-2.5 rounded-xl shadow-stripe">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stripe-dark">Детали</h1>
            <p className="text-stripe-slate text-sm">
              Создан{' '}
              {order.createdAt
                ? format(order.createdAt.toDate(), 'dd MMMM yyyy HH:mm', { locale: ru })
                : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {!isEditingDetails && (
            <button
              onClick={handleEditDetails}
              className="stripe-button-secondary flex items-center w-full sm:w-auto px-4 py-2"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Изменить
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handleDeleteOrder}
              className="stripe-button-secondary border-red-100 text-red-600 hover:bg-red-50 flex items-center w-full sm:w-auto px-4 py-2"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </button>
          )}
          <button
            onClick={handlePrint}
            className="stripe-button-secondary flex items-center w-full sm:w-auto px-4 py-2"
          >
            <Printer className="w-4 h-4 mr-2" />
            Печать
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="stripe-card p-8 print:border-none print:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stripe-dark flex items-center">
                Информация об автомобиле и клиенте
              </h2>
            </div>

            {isEditingDetails ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">
                      Марка и модель
                    </label>
                    <input
                      type="text"
                      name="carModel"
                      className="stripe-input text-sm"
                      value={editFormData.carModel}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">
                      Рег номер
                    </label>
                    <input
                      type="text"
                      name="carNumber"
                      className="stripe-input font-mono uppercase text-sm"
                      value={editFormData.carNumber}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">
                      Клиент
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      className="stripe-input text-sm"
                      value={editFormData.clientName}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">
                      Телефон
                    </label>
                    <input
                      type="text"
                      name="clientPhone"
                      className="stripe-input text-sm"
                      value={editFormData.clientPhone}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">
                      Viitenumero
                    </label>
                    <input
                      type="text"
                      name="viitenumero"
                      className="stripe-input text-sm"
                      value={editFormData.viitenumero}
                      onChange={handleEditInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">
                    Описание работ
                  </label>
                  <textarea
                    name="description"
                    className="stripe-input min-h-[150px] text-sm resize-none"
                    value={editFormData.description}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-50">
                  <button
                    onClick={() => setIsEditingDetails(false)}
                    className="stripe-button-secondary px-6 py-2"
                  >
                    Отмена
                  </button>
                  <button onClick={handleSaveDetails} className="stripe-button-primary px-6 py-2">
                    Сохранить изменения
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">
                      Марка и модель
                    </p>
                    <p className="text-lg font-bold text-stripe-dark">{order.carModel}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">
                      Рег номер
                    </p>
                    <p className="text-lg font-mono font-bold text-stripe-dark uppercase">
                      {order.carNumber || '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">
                      Клиент
                    </p>
                    <p className="text-lg font-bold text-stripe-dark">{order.clientName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">
                      Телефон
                    </p>
                    <p className="text-lg font-bold text-stripe-dark">{order.clientPhone || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">
                      Viitenumero
                    </p>
                    <p className="text-lg font-bold text-stripe-dark">{order.viitenumero || '—'}</p>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-50">
                  <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest mb-2">
                    Описание работ
                  </p>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="whitespace-pre-wrap text-stripe-dark leading-relaxed">
                      {order.description}
                    </p>
                  </div>
                </div>
              </>
            )}

            {order.comment && (
              <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start">
                <AlertTriangle className="w-5 h-5 text-indigo-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-[10px] text-indigo-600 uppercase font-bold tracking-widest">
                    Комментарий сотрудника
                  </p>
                  <p className="mt-1 text-indigo-900 text-sm font-medium">{order.comment}</p>
                </div>
              </div>
            )}
          </div>

          <div className="stripe-card p-8 print:hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stripe-dark flex items-center">Фотографии</h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-stripe-slate bg-gray-100 px-2 py-1 rounded-md">
                  {order.photos?.length || 0} фото
                </span>
                <label
                  className={`cursor-pointer stripe-button-primary px-3 py-1.5 text-xs ${isUploadingPhotos ? 'opacity-50 cursor-not-allowed' : ''} min-h-[36px]`}
                >
                  {isUploadingPhotos ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white mr-2"></div>
                  ) : (
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {isUploadingPhotos ? '...' : 'Добавить'}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhotos}
                  />
                </label>
              </div>
            </div>
            {order.photos && order.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {order.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-xl border border-gray-100 cursor-zoom-in hover:shadow-stripe transition-all hover:scale-[1.02] group"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo}
                      className="w-full h-full object-cover"
                      alt={`Order photo ${index + 1}`}
                    />
                    {isAdmin && (
                      <button
                        onClick={(e) => handleDeletePhoto(photo, e)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                        title="Удалить фото"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                <Camera className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-stripe-slate font-medium">Фотографии отсутствуют</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status & Price */}
        <div className="space-y-8 print:hidden">
          <div className="stripe-card p-8 bg-stripe-dark">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
              Текущий статус
            </h2>
            <div className="mb-8 flex justify-center">{getStatusBadge(order)}</div>
            <div className="space-y-3">
              {Object.values(ORDER_STATUS).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full text-left px-4 py-4 rounded-xl transition-all font-bold text-sm border-2 min-h-[56px] ${
                    order.status === status
                      ? 'bg-stripe-blue/10 border-stripe-blue text-stripe-blue'
                      : 'bg-stripe-darker border-transparent text-gray-500 hover:text-gray-300 hover:bg-stripe-darker/80'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-3 ${order.status === status ? 'bg-stripe-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-700'}`}
                    ></div>
                    {status}
                    {order.status === status && <CheckCircle className="w-4 h-4 ml-auto" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="stripe-card p-8 bg-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <h2 className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest mb-1">
              Сумма заказа
            </h2>
            <div className="flex items-baseline group-hover:scale-[1.02] transition-transform origin-left">
              <span className="text-4xl font-black text-stripe-dark">€{order.price || '0'}</span>
              <span className="ml-2 text-xs font-bold text-stripe-slate uppercase tracking-wider">
                EUR
              </span>
            </div>
            {isAdmin && (
              <button
                onClick={handlePriceChange}
                className="mt-6 text-stripe-blue text-xs font-bold hover:underline flex items-center"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Изменить сумму
              </button>
            )}
          </div>

          <div className="stripe-card p-6 bg-gray-50/50 border-dashed">
            <h2 className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest mb-4">
              История изменений
            </h2>
            <div className="space-y-6">
              {(showHistory ? order.history : order.history?.slice(-3)).map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="mt-1 bg-white p-1.5 rounded-full border border-gray-100 shadow-sm mr-3">
                    <Clock className="w-3 h-3 text-stripe-blue" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-stripe-dark leading-tight">
                      {item.status || 'Статус обновлен'}
                    </p>
                    <div className="flex items-center mt-1">
                      <p className="text-[10px] text-stripe-slate">{item.userName}</p>
                      <span className="mx-1.5 text-gray-300">•</span>
                      <p className="text-[10px] text-stripe-slate">
                        {item.timestamp ? format(item.timestamp.toDate(), 'dd.MM, HH:mm') : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {order.history?.length > 3 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full py-2 text-xs font-bold text-stripe-blue hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100"
                >
                  {showHistory ? 'Скрыть историю' : `Показать всё (${order.history.length})`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-stripe-dark/95 z-50 flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-10 h-10" />
          </button>
          <img
            src={selectedPhoto}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in duration-300"
            alt="Enlarged order photo"
          />
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
