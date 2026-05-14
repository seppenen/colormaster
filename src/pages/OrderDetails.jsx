import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService, ORDER_STATUS } from '../services/orderService';
import { userService, USER_ROLES } from '../services/userService';
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
  Euro,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getStatusBadge, formatDuration } from '../utils/orderUtils.jsx';

const OrderDetails = ({ user, userData, company }) => {
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
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [currentTimeInWork, setCurrentTimeInWork] = useState(0);
  const [users, setUsers] = useState([]);
  const [isEditingWorkerPrice, setIsEditingWorkerPrice] = useState(false);
  const [workerPriceData, setWorkerPriceData] = useState({
    price: '',
    workerId: ''
  });
  const isAdmin = userData?.role === USER_ROLES.ADMIN;

  useEffect(() => {
    let interval;
    if (order?.status === ORDER_STATUS.IN_PROGRESS && order?.workStartedAt) {
      const startTime = order.workStartedAt.toDate ? order.workStartedAt.toDate() : new Date(order.workStartedAt);
      
      const updateTimer = () => {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        setCurrentTimeInWork(diff);
      };
      
      updateTimer();
      interval = setInterval(updateTimer, 60000); // Update every minute
    } else {
      setCurrentTimeInWork(0);
    }
    return () => clearInterval(interval);
  }, [order?.status, order?.workStartedAt]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getOrder(id);
        setOrder(data);
        if (data) {
          setWorkerPriceData({
            price: data.workerPrice || '',
            workerId: data.workerId || ''
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();

    if (isAdmin) {
      const fetchUsers = async () => {
        try {
          const allUsers = await userService.getAllUsers(userData.companyId);
          setUsers(allUsers);
        } catch (err) {
          console.error('Error fetching users:', err);
        }
      };
      fetchUsers();
    }
  }, [id, isAdmin, userData?.companyId]);

  useEffect(() => {
    // Initial fetch for comments is handled by the order fetch
  }, [order]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === order.status) return;
    try {
      await orderService.updateOrderStatus(id, newStatus, user, userData);
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
        await orderService.updateOrderPrice(id, Number(newPrice), user, userData);
        const updatedOrder = await orderService.getOrder(id);
        setOrder(updatedOrder);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleWorkerPriceChange = async () => {
    const { price, workerId } = workerPriceData;
    const selectedWorker = users.find(u => u.uid === workerId);
    const workerName = selectedWorker ? selectedWorker.name : '';

    try {
      await orderService.updateWorkerPrice(
        id, 
        Number(price), 
        workerId, 
        workerName, 
        user, 
        userData
      );
      const updatedOrder = await orderService.getOrder(id);
      setOrder(updatedOrder);
      setIsEditingWorkerPrice(false);
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении зарплаты');
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
      branchId: order.branchId || '',
    });
    setIsEditingDetails(true);
  };

  const handleSaveDetails = async () => {
    try {
      await orderService.updateOrderDetails(id, editFormData, user, userData);
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

  const getHistoryText = (item) => {
    switch (item.action) {
      case 'ORDER_CREATED':
        return 'Заказ создан';
      case 'STATUS_CHANGED':
        return `Статус изменен: ${item.to}`;
      case 'PRICE_CHANGED':
        return `Цена изменена: €${item.from || 0} → €${item.to}`;
      case 'WORKER_PRICE_CHANGED':
        return `Зарплата ${item.workerName ? '(' + item.workerName + ') ' : ''}изменена: €${item.from || 0} → €${item.to}`;
      case 'DETAILS_CHANGED':
        return 'Детали заказа обновлены';
      case 'DESCRIPTION_CHANGED':
        return 'Описание обновлено';
      case 'PHOTOS_ADDED':
        return `Добавлено фото: ${item.count}`;
      case 'PHOTO_DELETED':
        return 'Фото удалено';
      default:
        return item.status || 'Статус обновлен';
    }
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
      await orderService.addOrderPhotos(id, validFiles, user, userData);
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
        await orderService.deleteOrderPhoto(id, photoUrl, user, userData);
        const updatedOrder = await orderService.getOrder(id);
        setOrder(updatedOrder);
      } catch (err) {
        console.error(err);
        alert('Ошибка при удалении фотографии');
      }
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim()) return;
    try {
      await orderService.addOrderComment(id, newCommentText, user, userData);
      const updatedOrder = await orderService.getOrder(id);
      setOrder(updatedOrder);
      setNewCommentText('');
      setIsAddingComment(false);
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении комментария');
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      await orderService.updateOrderComment(id, commentId, editingCommentText, user, userData);
      const updatedOrder = await orderService.getOrder(id);
      setOrder(updatedOrder);
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (err) {
      console.error(err);
      alert('Ошибка при обновлении комментария');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Удалить этот комментарий?')) {
      try {
        await orderService.deleteOrderComment(id, commentId, user, userData);
        const updatedOrder = await orderService.getOrder(id);
        setOrder(updatedOrder);
      } catch (err) {
        console.error(err);
        alert('Ошибка при удалении комментария');
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
            <h1 className="text-3xl font-bold tracking-tight text-stripe-dark">
              {order.carNumber || 'Без номера'}
            </h1>
            <p className="text-stripe-slate text-sm">
              Создан{' '}
              {order.createdAt
                ? format(order.createdAt.toDate(), 'dd MMMM yyyy HH:mm', { locale: ru })
                : ''}
              {order.branchId && company?.branches && (
                <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider">
                  {company.branches.find(b => b.id === order.branchId)?.name || 'Филиал'}
                </span>
              )}
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
                  {company?.branches && company.branches.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">
                        Филиал
                      </label>
                      <select
                        name="branchId"
                        className="stripe-input text-sm"
                        value={editFormData.branchId || ''}
                        onChange={handleEditInputChange}
                      >
                        <option value="">Без филиала</option>
                        {company.branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                      {order.branchId && (
                        <p className="text-[10px] text-indigo-500 mt-1">
                          Текущий филиал: {company.branches.find(b => b.id === order.branchId)?.name || 'Неизвестно'}
                        </p>
                      )}
                    </div>
                  )}
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

            <div className="mt-6 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-indigo-500 mr-3" />
                  <p className="text-[10px] text-indigo-600 uppercase font-bold tracking-widest">
                    Комментарии
                  </p>
                </div>
                {!isAddingComment && (
                  <button
                    onClick={() => setIsAddingComment(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1" />
                    Добавить
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Legacy single comment support */}
                {order.comment && (!order.comments || order.comments.length === 0) && (
                  <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                    <p className="text-indigo-900 text-sm font-medium leading-relaxed">
                      {order.comment}
                    </p>
                    <p className="mt-2 text-[10px] text-indigo-400 italic">
                      Старый формат комментария
                    </p>
                  </div>
                )}

                {/* List of comments */}
                {order.comments && order.comments.length > 0 ? (
                  order.comments.map((comment) => (
                    <div key={comment.id} className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm group">
                      {editingCommentId === comment.id ? (
                        <div className="space-y-3">
                          <textarea
                            className="w-full bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                              Отмена
                            </button>
                            <button
                              onClick={() => handleUpdateComment(comment.id)}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              Обновить
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">
                              {comment.userName}
                            </span>
                            <span className="text-[10px] text-indigo-400">
                              {comment.timestamp?.toDate
                                ? format(comment.timestamp.toDate(), 'dd.MM.yy HH:mm', { locale: ru })
                                : format(new Date(comment.timestamp), 'dd.MM.yy HH:mm', { locale: ru })}
                            </span>
                          </div>
                          <p className="text-indigo-900 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                            {comment.text}
                          </p>
                          {(isAdmin || user.uid === comment.userId) && (
                            <div className="flex space-x-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditingCommentText(comment.text);
                                }}
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600 flex items-center"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Изменить
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-[10px] font-bold text-red-300 hover:text-red-500 flex items-center"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Удалить
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  !order.comment && (
                    <p className="text-indigo-400 text-sm italic text-center py-2">
                      Комментариев пока нет
                    </p>
                  )
                )}

                {/* New comment form */}
                {isAddingComment && (
                  <div className="mt-4 bg-white p-4 rounded-lg border-2 border-indigo-200 shadow-md animate-in slide-in-from-top-2 duration-200">
                    <textarea
                      className="w-full bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none"
                      placeholder="Напишите комментарий..."
                      autoFocus
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                    />
                    <div className="flex justify-end space-x-2 mt-3">
                      <button
                        onClick={() => {
                          setIsAddingComment(false);
                          setNewCommentText('');
                        }}
                        className="px-4 py-2 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleAddComment}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        Отправить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
            <div className="mb-8 flex justify-center">{getStatusBadge(order, isAdmin)}</div>
            <div className="space-y-3">
              {Object.values(ORDER_STATUS)
                .filter((status) => status !== ORDER_STATUS.LASKUTETTU || isAdmin)
                .map((status) => (
                  <button
                    key={status}
                    disabled={!isAdmin && status === ORDER_STATUS.LASKUTETTU}
                    onClick={() => handleStatusChange(status)}
                    className={`w-full text-left px-4 py-4 rounded-xl transition-all font-bold text-sm border-2 min-h-[56px] ${
                      order.status === status
                        ? 'bg-stripe-blue/10 border-stripe-blue text-stripe-blue'
                        : 'bg-stripe-darker border-transparent text-gray-500 hover:text-gray-300 hover:bg-stripe-darker/80'
                    } ${!isAdmin && status === ORDER_STATUS.LASKUTETTU ? 'opacity-50 cursor-not-allowed' : ''}`}
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

          <div className="space-y-4">
            {isAdmin && (
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
                <button
                  onClick={handlePriceChange}
                  className="mt-6 text-stripe-blue text-xs font-bold hover:underline flex items-center"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Изменить сумму
                </button>
              </div>
            )}

            <div className="stripe-card p-8 bg-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4">
                <div className="bg-blue-50 p-2 rounded-lg">
                  {isAdmin ? <Edit2 className="w-5 h-5 text-blue-500" /> : <Euro className="w-5 h-5 text-blue-500" />}
                </div>
              </div>
              <h2 className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest mb-1">
                Зарплата работника
              </h2>
              {isEditingWorkerPrice ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <label className="text-[10px] text-stripe-slate uppercase font-bold">Сумма (€)</label>
                    <input
                      type="number"
                      className="stripe-input text-lg font-bold"
                      value={workerPriceData.price}
                      onChange={(e) => setWorkerPriceData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-stripe-slate uppercase font-bold">Сотрудник</label>
                    <select
                      className="stripe-input text-sm"
                      value={workerPriceData.workerId}
                      onChange={(e) => setWorkerPriceData(prev => ({ ...prev, workerId: e.target.value }))}
                    >
                      <option value="">Выберите сотрудника</option>
                      {users.map(u => (
                        <option key={u.uid} value={u.uid}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={handleWorkerPriceChange}
                      className="flex-1 bg-stripe-blue text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setIsEditingWorkerPrice(false)}
                      className="flex-1 bg-gray-100 text-stripe-slate py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline group-hover:scale-[1.02] transition-transform origin-left">
                    <span className="text-4xl font-black text-stripe-dark">€{order.workerPrice || '0'}</span>
                    <span className="ml-2 text-xs font-bold text-stripe-slate uppercase tracking-wider">
                      EUR
                    </span>
                  </div>
                  {order.workerName && (
                    <p className="mt-2 text-xs font-bold text-stripe-blue bg-blue-50 px-2 py-1 rounded-md inline-block">
                      {order.workerName}
                    </p>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditingWorkerPrice(true)}
                      className="mt-6 text-stripe-blue text-xs font-bold hover:underline flex items-center"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Изменить зарплату
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="stripe-card p-8 bg-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4">
                <div className="bg-orange-50 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
              </div>
              <h2 className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest mb-1">
                Время в работе
              </h2>
              <div className="flex items-baseline group-hover:scale-[1.02] transition-transform origin-left">
                <span className="text-4xl font-black text-stripe-dark">
                  {formatDuration((order.workDuration || 0) + currentTimeInWork)}
                </span>
              </div>
              {order.status === ORDER_STATUS.IN_PROGRESS && (
                <p className="mt-6 text-emerald-600 text-xs font-bold flex items-center animate-pulse">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                  Сейчас в работе: {order.history?.find(h => h.to === ORDER_STATUS.IN_PROGRESS)?.userName || ''}
                </p>
              )}
            </div>
            
            {/* Show worker breakdown if multiple workers */}
            {order.workerTimes && Object.keys(order.workerTimes).length > 0 && (
              <div className="stripe-card p-6 bg-gray-50/30 border-dashed">
                <h3 className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest mb-3">Распределение времени</h3>
                <div className="space-y-2">
                  {Object.entries(order.workerTimes).map(([workerId, duration]) => {
                    const workerHistory = order.history?.find(h => h.userId === workerId);
                    return (
                      <div key={workerId} className="flex justify-between items-center">
                        <span className="text-xs text-stripe-slate">{workerHistory?.userName || 'Сотрудник'}</span>
                        <span className="text-xs font-bold text-stripe-dark">{formatDuration(duration)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="stripe-card p-6 bg-gray-50/50 border-dashed">
            <h2 className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest mb-4">
              История изменений
            </h2>
            <div className="space-y-6">
              {((showHistory ? order.history : order.history?.slice(0, 3)) || [])
                .sort((a, b) => {
                  const timeA = a.timestamp?.seconds || 0;
                  const timeB = b.timestamp?.seconds || 0;
                  return timeB - timeA;
                })
                .map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="mt-1 bg-white p-1.5 rounded-full border border-gray-100 shadow-sm mr-3">
                    <Clock className="w-3 h-3 text-stripe-blue" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-stripe-dark leading-tight">
                      {getHistoryText(item)}
                    </p>
                    <div className="flex items-center mt-1">
                      <p className="text-[10px] text-stripe-slate">{item.userName} </p>
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
      {selectedPhoto && createPortal(
        <div
          className="fixed inset-0 bg-stripe-dark/95 z-[9999] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[10000]"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-10 h-10" />
          </button>
          <img
            src={selectedPhoto}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in duration-300 relative z-[10000]"
            alt="Enlarged order photo"
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default OrderDetails;
