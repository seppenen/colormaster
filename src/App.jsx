import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, secondaryAuth } from './services/firebase';
import { userService, USER_ROLES } from './services/userService';
import { orderService, ORDER_STATUS } from './services/orderService';
import { companyService } from './services/companyService';
import { initializeCollections } from './initDb';
import { useParams } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Users as UsersIcon, LogOut, Car, ClipboardList, Clock, Search, Printer, Trash2, Camera, X, CheckCircle, AlertTriangle, Eye, Menu } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

// --- Components ---

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-stripe-light">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stripe-blue"></div>
  </div>
);

// --- Pages ---

const CreateCompany = ({ user, onCompanyCreated }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const company = await companyService.createCompany({ name }, user.uid);
      await userService.updateUser(user.uid, { 
        companyId: company.id,
        role: USER_ROLES.ADMIN 
      });
      onCompanyCreated(company);
    } catch (err) {
      console.error(err);
      setError('Ошибка при создании компании');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stripe-light">
      <div className="p-10 stripe-card w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="bg-stripe-blue p-3 rounded-xl shadow-stripe">
            <PlusCircle className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-center text-stripe-dark tracking-tight">Создайте компанию</h1>
        <p className="text-center text-stripe-slate mb-8">Для начала работы необходимо зарегистрировать вашу автомастерскую</p>
        
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-md mb-6 text-sm flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <label className="block text-stripe-dark text-sm font-semibold mb-2">Название автомастерской</label>
            <input 
              type="text" 
              className="stripe-input"
              placeholder="Напр., АвтоГлянец"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full stripe-button-primary py-3"
            disabled={loading}
          >
            {loading ? 'Создание...' : 'Создать и продолжить'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Login = ({ user }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [initStatus, setInitStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleInitCollections = async () => {
    setInitStatus('Инициализация...');
    const success = await initializeCollections();
    if (success) {
      setInitStatus('Готово! Коллекции созданы.');
      setTimeout(() => setInitStatus(''), 3000);
    } else {
      setInitStatus('Ошибка инициализации.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stripe-light">
      <div className="p-10 stripe-card w-full max-w-md">
        <form onSubmit={handleLogin}>
          <div className="flex justify-center mb-8">
            <div className="bg-stripe-blue p-3 rounded-xl shadow-stripe">
              <Car className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-center text-stripe-dark tracking-tight">ColorMaster</h1>
          <p className="text-center text-stripe-slate mb-8">Войдите в свою учетную запись</p>
          
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-md mb-6 text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-stripe-dark text-sm font-semibold mb-2">Электронная почта</label>
            <input 
              type="email" 
              className="stripe-input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-8">
            <label className="block text-stripe-dark text-sm font-semibold mb-2">Пароль</label>
            <input 
              type="password" 
              className="stripe-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full stripe-button-primary py-3 mb-4">
            Войти
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-center text-stripe-slate mb-3">Технический раздел (только для первого запуска)</p>
          <button 
            type="button" 
            onClick={handleInitCollections}
            className="w-full text-xs font-bold text-stripe-blue hover:text-stripe-purple transition-colors py-2 border border-dashed border-gray-200 rounded-md"
          >
            {initStatus || 'Инициализировать базу данных (создать коллекции)'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, userData, company }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.carModel?.toLowerCase().includes(searchLower) ||
      order.carNumber?.toLowerCase().includes(searchLower) ||
      order.clientName?.toLowerCase().includes(searchLower) ||
      order.clientPhone?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (order) => {
    const status = typeof order === 'string' ? order : order.status;
    const isDelayed = typeof order === 'object' && 
                     order.status === ORDER_STATUS.PENDING && 
                     order.status !== ORDER_STATUS.DELIVERED && (() => {
      const lastChange = order.statusChangedAt?.toDate() || order.createdAt?.toDate();
      if (!lastChange) return false;
      const diffDays = Math.floor((new Date() - lastChange) / (1000 * 60 * 60 * 24));
      return diffDays >= 2;
    })();

    const baseClasses = "stripe-badge";
    if (isDelayed) {
      return <span className={`${baseClasses} bg-red-100 text-red-700 font-bold border border-red-200 animate-pulse`}>{status}</span>;
    }

    switch (status) {
      case ORDER_STATUS.PENDING:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-700 font-bold`}>{status}</span>;
      case ORDER_STATUS.IN_PROGRESS:
        return <span className={`${baseClasses} bg-blue-100 text-stripe-blue font-bold`}>{status}</span>;
      case ORDER_STATUS.WAITING_PARTS:
        return <span className={`${baseClasses} bg-orange-100 text-orange-700 font-bold`}>{status}</span>;
      case ORDER_STATUS.READY:
        return <span className={`${baseClasses} bg-emerald-100 text-emerald-700 font-bold`}>{status}</span>;
      case ORDER_STATUS.DELIVERED:
        return <span className={`${baseClasses} bg-purple-100 text-purple-700 font-bold`}>{status}</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-stripe-slate font-bold`}>{status}</span>;
    }
  };

  const checkDelay = (order) => {
    if (order.status === ORDER_STATUS.DELIVERED) return null;
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

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-stripe-blue"></div></div>;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stripe-dark">
            {company ? company.name : 'Панель управления'}
          </h1>
          <p className="text-stripe-slate mt-1 text-sm">Управление и мониторинг активных заказов</p>
        </div>
        <div className="relative group">
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
                      <div className="text-[10px] text-stripe-slate font-mono uppercase tracking-wider">{order.carNumber || 'БЕЗ НОМЕРА'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-stripe-dark">{order.clientName}</div>
                    <div className="text-[11px] text-stripe-slate flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {order.createdAt ? formatDistanceToNow(order.createdAt.toDate(), { addSuffix: true, locale: ru }) : ''}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {getStatusBadge(order)}
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
                <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">Автомобиль</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">Клиент</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">Статус</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">Время</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-stripe-slate uppercase tracking-widest">Действие</th>
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
                  <tr key={order.id} className="hover:bg-stripe-light/50 transition-colors group cursor-pointer" onClick={() => navigate(`/order/${order.id}`)}>
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
                      <div className="flex flex-col space-y-1">
                        {getStatusBadge(order)}
                        {checkDelay(order)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-[11px] text-stripe-slate font-medium flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {order.createdAt ? formatDistanceToNow(order.createdAt.toDate(), { addSuffix: true, locale: ru }) : ''}
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

const CreateOrder = ({ user, userData }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [formData, setFormData] = useState({
    carModel: '',
    carNumber: '',
    clientName: '',
    clientPhone: '',
    description: '',
    price: 0,
    comment: ''
  });

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'carNumber') {
      // Автоматическое форматирование для финского формата ABC-123
      const val = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (val.length > 3) {
        value = val.slice(0, 3) + '-' + val.slice(3, 6);
      } else {
        value = val;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    setPhotos(prev => [...prev, ...validFiles]);
    
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await orderService.createOrder(formData, photos, user, userData.companyId);
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stripe-dark">Создать заказ</h1>
        <p className="text-stripe-slate mt-1 text-sm">Заполните анкету для регистрации нового заказа</p>
      </div>
      
      <form onSubmit={handleSubmit} className="stripe-card p-4 md:p-8 space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 md:gap-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-bold text-stripe-dark">Марка и модель автомобиля *</label>
            <input 
              type="text" name="carModel" required
              className="stripe-input"
              placeholder="например, BMW X5"
              value={formData.carModel} onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-stripe-dark">Рег номер</label>
            <input 
              type="text" name="carNumber"
              className="stripe-input font-mono uppercase"
              placeholder="ABC-123"
              value={formData.carNumber} onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-stripe-dark">ФИО клиента *</label>
            <input 
              type="text" name="clientName" required
              className="stripe-input"
              placeholder="Иван Иванов"
              value={formData.clientName} onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-stripe-dark">Телефон клиента</label>
            <input 
              type="text" name="clientPhone"
              className="stripe-input"
              placeholder="+358 40 123 4567"
              value={formData.clientPhone} onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-bold text-stripe-dark">Описание работ *</label>
          <textarea 
            name="description" required rows="4"
            className="stripe-input resize-none"
            placeholder="Опишите необходимые работы..."
            value={formData.description} onChange={handleInputChange}
          ></textarea>
        </div>

        {userData?.role === USER_ROLES.ADMIN && (
          <div className="space-y-1">
            <label className="block text-sm font-bold text-stripe-dark">Ориентировочная цена (€)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
              <input 
                type="number" name="price"
                className="stripe-input pl-8"
                value={formData.price} onChange={handleInputChange}
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-bold text-stripe-dark">Комментарий сотрудника</label>
          <textarea 
            name="comment" rows="2"
            className="stripe-input resize-none"
            placeholder="Дополнительная информация для внутреннего пользования..."
            value={formData.comment} onChange={handleInputChange}
          ></textarea>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100">
          <label className="block text-sm font-bold text-stripe-dark">Фотографии автомобиля</label>
          <div className="flex flex-wrap gap-3 md:gap-4">
            <label className="flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-stripe-blue hover:bg-stripe-light transition-all group">
              <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 group-hover:text-stripe-blue transition-colors" />
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2 group-hover:text-stripe-blue text-center px-1">Загрузить</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
            {previews.map((preview, index) => (
              <div key={index} className="relative w-28 h-28 sm:w-32 sm:h-32 group animate-in fade-in zoom-in duration-300">
                <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl shadow-stripe-sm border border-gray-100" />
                <button 
                  type="button" onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1.5 shadow-stripe border border-gray-100 hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-stripe-slate italic">Поддерживаются форматы: JPEG, PNG, WEBP. Фотографии сжимаются перед загрузкой.</p>
        </div>

        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <button 
            type="button" onClick={() => navigate('/')}
            className="stripe-button-secondary px-8 w-full sm:w-auto order-2 sm:order-1"
          >
            Отмена
          </button>
          <button 
            type="submit" disabled={loading}
            className="stripe-button-primary px-8 w-full sm:w-auto order-1 sm:order-2"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Создание...
              </div>
            ) : 'Создать заказ'}
          </button>
        </div>
      </form>
    </div>
  );
};

const OrderDetails = ({ user, userData }) => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState('');
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

  const handleDescriptionEdit = () => {
    setEditDescription(order.description);
    setIsEditingDescription(true);
  };

  const handleDescriptionSave = async () => {
    try {
      await orderService.updateOrderDescription(id, editDescription, user);
      const updatedOrder = await orderService.getOrder(id);
      setOrder(updatedOrder);
      setIsEditingDescription(false);
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении описания');
    }
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

    const validFiles = files.filter(file => {
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

  const getStatusBadge = (order) => {
    const status = typeof order === 'string' ? order : order.status;
    const isDelayed = typeof order === 'object' && 
                     order.status === ORDER_STATUS.PENDING && 
                     order.status !== ORDER_STATUS.DELIVERED && (() => {
      const lastChange = order.statusChangedAt?.toDate() || order.createdAt?.toDate();
      if (!lastChange) return false;
      const diffDays = Math.floor((new Date() - lastChange) / (1000 * 60 * 60 * 24));
      return diffDays >= 2;
    })();

    const baseClasses = "stripe-badge";
    if (isDelayed) {
      return <span className={`${baseClasses} bg-red-100 text-red-700 font-bold border border-red-200 animate-pulse`}>{status}</span>;
    }

    switch (status) {
      case ORDER_STATUS.PENDING:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-700 font-bold`}>{status}</span>;
      case ORDER_STATUS.IN_PROGRESS:
        return <span className={`${baseClasses} bg-blue-100 text-stripe-blue font-bold`}>{status}</span>;
      case ORDER_STATUS.WAITING_PARTS:
        return <span className={`${baseClasses} bg-orange-100 text-orange-700 font-bold`}>{status}</span>;
      case ORDER_STATUS.READY:
        return <span className={`${baseClasses} bg-emerald-100 text-emerald-700 font-bold`}>{status}</span>;
      case ORDER_STATUS.DELIVERED:
        return <span className={`${baseClasses} bg-purple-100 text-purple-700 font-bold`}>{status}</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-stripe-slate font-bold`}>{status}</span>;
    }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-stripe-blue"></div></div>;
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
            <p className="text-stripe-slate text-sm">Создан {order.createdAt ? format(order.createdAt.toDate(), 'dd MMMM yyyy HH:mm', { locale: ru }) : ''}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
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
            <h2 className="text-xl font-bold mb-6 text-stripe-dark flex items-center">
              Информация об автомобиле и клиенте
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-1">
                <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">Марка и модель</p>
                <p className="text-lg font-bold text-stripe-dark">{order.carModel}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">Рег номер</p>
                <p className="text-lg font-mono font-bold text-stripe-dark uppercase">{order.carNumber || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">Клиент</p>
                <p className="text-lg font-bold text-stripe-dark">{order.clientName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">Телефон</p>
                <p className="text-lg font-bold text-stripe-dark">{order.clientPhone || '—'}</p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-stripe-slate uppercase font-bold tracking-widest">Описание работ</p>
                {!isEditingDescription && (
                  <button 
                    onClick={handleDescriptionEdit}
                    className="stripe-button-secondary px-4 py-2 text-sm"
                  >
                    Изменить
                  </button>
                )}
              </div>
              
              {isEditingDescription ? (
                <div className="space-y-4">
                  <textarea
                    className="stripe-input min-h-[150px] text-sm"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                  <div className="flex justify-end space-x-3">
                    <button 
                      onClick={() => setIsEditingDescription(false)}
                      className="stripe-button-secondary px-4 py-2 text-xs"
                    >
                      Отмена
                    </button>
                    <button 
                      onClick={handleDescriptionSave}
                      className="stripe-button-primary px-4 py-2 text-xs"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="whitespace-pre-wrap text-stripe-dark leading-relaxed">{order.description}</p>
                </div>
              )}
            </div>
            
            {order.comment && (
              <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start">
                <AlertTriangle className="w-5 h-5 text-indigo-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-[10px] text-indigo-600 uppercase font-bold tracking-widest">Комментарий сотрудника</p>
                  <p className="mt-1 text-indigo-900 text-sm font-medium">{order.comment}</p>
                </div>
              </div>
            )}
          </div>

          <div className="stripe-card p-8 print:hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stripe-dark flex items-center">
                Фотографии
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-stripe-slate bg-gray-100 px-2 py-1 rounded-md">{order.photos?.length || 0} фото</span>
                <label className={`cursor-pointer stripe-button-primary px-3 py-1.5 text-xs ${isUploadingPhotos ? 'opacity-50 cursor-not-allowed' : ''} min-h-[36px]`}>
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
                    <img src={photo} className="w-full h-full object-cover" alt={`Order photo ${index + 1}`} />
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
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Текущий статус</h2>
            <div className="mb-8 flex justify-center">
              {getStatusBadge(order)}
            </div>
            <div className="space-y-3">
              {Object.values(ORDER_STATUS).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full text-left px-4 py-4 rounded-xl transition-all font-bold text-sm border-2 min-h-[56px] ${
                    order.status === status 
                      ? 'bg-stripe-blue border-stripe-blue text-white shadow-stripe' 
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {status}
                    {order.status === status && <CheckCircle className="w-4 h-4" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div className="stripe-card p-8">
              <h2 className="text-xs font-bold text-stripe-slate uppercase tracking-widest mb-4">Стоимость работ</h2>
              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-black text-stripe-dark">{order.price?.toLocaleString('fi-FI')}</span>
                <span className="text-xl font-bold text-stripe-slate">€</span>
              </div>
              <button 
                onClick={handlePriceChange}
                className="mt-6 w-full stripe-button-secondary py-3 text-sm md:text-base font-bold"
              >
                Изменить цену
              </button>
            </div>
          )}

          <div className="stripe-card p-6 overflow-hidden">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-stripe-dark hover:text-stripe-blue transition-colors group"
            >
              <span className="text-xs font-bold uppercase tracking-widest flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                История изменений
              </span>
              <div className={`p-1 rounded-md bg-gray-100 group-hover:bg-stripe-blue group-hover:text-white transition-all transform ${showHistory ? 'rotate-180' : ''}`}>
                <PlusCircle className="w-4 h-4" />
              </div>
            </button>
            
            <div className={`mt-6 space-y-4 overflow-hidden transition-all duration-500 ${showHistory ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {order.history?.map((entry, index) => (
                  <div key={index} className="relative pl-8 animate-in slide-in-from-left duration-300">
                    <div className="absolute left-0 top-1 w-[24px] h-[24px] rounded-full bg-white border-4 border-stripe-blue flex items-center justify-center z-10 shadow-sm"></div>
                    <div>
                      <p className="text-xs font-bold text-stripe-dark">
                        {entry.action === 'ORDER_CREATED' 
                          ? 'Заказ создан' 
                          : entry.action === 'STATUS_CHANGED' 
                            ? `Статус: ${entry.to}` 
                            : entry.action === 'DESCRIPTION_CHANGED'
                              ? 'Изменено описание'
                              : 'Изменена цена'}
                      </p>
                      <p className="text-[10px] text-stripe-slate mt-0.5">
                        {entry.userName} • {entry.timestamp ? (
                          typeof entry.timestamp.toDate === 'function' 
                            ? format(entry.timestamp.toDate(), 'dd MMM HH:mm', { locale: ru }) 
                            : format(new Date(entry.timestamp), 'dd MMM HH:mm', { locale: ru })
                        ) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img src={selectedPhoto} className="max-w-full max-h-full rounded-lg shadow-2xl" />
          <button className="absolute top-4 right-4 text-white"><X className="w-8 h-8" /></button>
        </div>
      )}

      {/* Print View (hidden normally) */}
      <div className="hidden print:block print:bg-white print:text-black">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-widest">Договор / заказ-наряд</h1>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 border-b pb-8">
          <div className="space-y-2">
            <p><span className="font-bold">Клиент:</span> {order.clientName}</p>
            <p><span className="font-bold">Телефон:</span> {order.clientPhone}</p>
          </div>
          <div className="space-y-2">
            <p><span className="font-bold">Автомобиль:</span> {order.carModel}</p>
            <p><span className="font-bold">Рег номер:</span> {order.carNumber}</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-bold mb-2 underline">Описание работ:</h3>
          <p className="whitespace-pre-wrap border p-4 rounded min-h-[150px]">{order.description}</p>
        </div>

        <div className="text-right mb-12">
          <p className="text-xl font-bold">Итого к оплате: {order.price?.toLocaleString('fi-FI')} €</p>
        </div>

        <div className="flex justify-between mt-20">
          <div className="w-1/2">
            <p className="mb-10">Подпись клиента: ___________________</p>
            <p>Дата: {format(new Date(), 'dd.MM.yyyy')}</p>
          </div>
          <div className="w-1/2">
            <p className="mb-10">Подпись представителя мастерской: ___________________</p>
            <p>М.П.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagement = ({ userData }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: USER_ROLES.EMPLOYEE });

  useEffect(() => {
    const fetchUsers = async () => {
      if (!userData?.companyId) return;
      try {
        const data = await userService.getAllUsers(userData.companyId);
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [userData?.companyId]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!userData?.companyId) return;
    try {
      // Create user using secondary auth instance to avoid signing out current admin
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUserData.email, newUserData.password);
      
      await userService.createUser(userCredential.user.uid, {
        name: newUserData.name,
        email: newUserData.email,
        role: newUserData.role,
        companyId: userData.companyId
      });
      
      // Sign out from secondary auth immediately
      await signOut(secondaryAuth);
      
      const updatedUsers = await userService.getAllUsers(userData.companyId);
      setUsers(updatedUsers);
      setShowAddModal(false);
      setNewUserData({ name: '', email: '', password: '', role: USER_ROLES.EMPLOYEE });
    } catch (err) {
      console.error(err);
      alert('Ошибка при создании пользователя: ' + err.message);
    }
  };

  const handleDeleteUser = async (uid) => {
    if (window.confirm('Вы уверены, что хотите удалить пользователя?')) {
      try {
        await userService.deleteUser(uid);
        setUsers(users.filter(u => u.uid !== uid));
      } catch (err) {
        console.error(err);
        alert('Ошибка при удалении пользователя');
      }
    }
  };

  const toggleUserStatus = async (uid, currentStatus) => {
    try {
      await userService.updateUser(uid, { isActive: !currentStatus });
      setUsers(users.map(u => u.uid === uid ? { ...u, isActive: !currentStatus } : u));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-stripe-blue"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stripe-dark">Управление пользователями</h1>
          <p className="text-stripe-slate mt-1 text-sm">Управление доступом сотрудников к системе</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="stripe-button-primary flex items-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Добавить сотрудника
        </button>
      </div>

      <div className="stripe-card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">Имя</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">Роль</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">Статус</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-stripe-slate uppercase tracking-widest">Действие</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.uid} className="hover:bg-stripe-light/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-stripe-blue/10 flex items-center justify-center text-stripe-blue font-bold mr-3 border border-stripe-blue/20">
                      {u.name?.charAt(0)}
                    </div>
                    <div className="text-sm font-bold text-stripe-dark">{u.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-stripe-slate">{u.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`stripe-badge ${u.role === USER_ROLES.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-stripe-slate'}`}>
                    {u.role === USER_ROLES.ADMIN ? 'Админ' : 'Сотрудник'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`stripe-badge ${u.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive !== false ? 'Активен' : 'Заблокирован'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2 items-center">
                  <button 
                    onClick={() => toggleUserStatus(u.uid, u.isActive !== false)}
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-all border min-h-[36px] ${
                      u.isActive !== false 
                        ? 'text-red-500 border-red-100 hover:bg-red-50' 
                        : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                    }`}
                  >
                    {u.isActive !== false ? 'Блок' : 'Разблок'}
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(u.uid)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all border border-transparent hover:border-red-100 min-h-[36px]"
                    title="Удалить из базы"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-stripe-dark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="stripe-card w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stripe-dark tracking-tight">Новый сотрудник</h2>
              <button onClick={() => setShowAddModal(false)} className="text-stripe-slate hover:text-stripe-dark">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-stripe-dark">Имя сотрудника</label>
                <input 
                  type="text" required
                  className="stripe-input"
                  placeholder="Имя Фамилия"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-stripe-dark">Email</label>
                <input 
                  type="email" required
                  className="stripe-input"
                  placeholder="email@colormaster.ru"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-stripe-dark">Пароль</label>
                <input 
                  type="password" required minLength="6"
                  className="stripe-input"
                  placeholder="••••••••"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-stripe-dark">Роль</label>
                <select 
                  className="stripe-input"
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                >
                  <option value={USER_ROLES.EMPLOYEE}>Сотрудник</option>
                  <option value={USER_ROLES.ADMIN}>Администратор</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="stripe-button-secondary w-full"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="stripe-button-primary w-full"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Layout = ({ user, userData, children, company }) => {
  const isAdmin = userData?.role === USER_ROLES.ADMIN;
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navLinkClasses = (isActive) => 
    `flex items-center px-4 py-2.5 rounded-md transition-all font-medium ${
      isActive 
        ? 'bg-white text-stripe-blue shadow-stripe-sm' 
        : 'text-stripe-slate hover:text-stripe-dark hover:bg-gray-100'
    }`;

  const SidebarContent = () => (
    <>
      <div className="p-8 flex items-center space-x-3">
        <div className="bg-stripe-blue p-1.5 rounded-lg shadow-stripe-sm">
          < Car className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stripe-dark leading-none">ColorMaster</h2>
          {company && <p className="text-[10px] uppercase tracking-wider text-stripe-slate font-bold mt-1">{company.name}</p>}
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <Link to="/" onClick={() => setIsSidebarOpen(false)} className={navLinkClasses(window.location.pathname === '/')}>
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Панель управления
        </Link>
        <Link to="/create-order" onClick={() => setIsSidebarOpen(false)} className={navLinkClasses(window.location.pathname === '/create-order')}>
          <PlusCircle className="w-5 h-5 mr-3" />
          Создать заказ
        </Link>
        {isAdmin && (
          <Link to="/users" onClick={() => setIsSidebarOpen(false)} className={navLinkClasses(window.location.pathname === '/users')}>
            <UsersIcon className="w-5 h-5 mr-3" />
            Пользователи
          </Link>
        )}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-white rounded-xl p-4 shadow-stripe-sm border border-gray-100 mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-stripe-blue/10 flex items-center justify-center text-stripe-blue font-bold mr-3 border border-stripe-blue/20">
              {userData?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-stripe-dark truncate">{userData?.name}</p>
              <p className="text-xs text-stripe-slate truncate">{isAdmin ? 'Администратор' : 'Сотрудник'}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => {
            signOut(auth);
            setIsSidebarOpen(false);
          }}
          className="flex items-center w-full px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-md transition-all font-medium"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Выйти
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-stripe-light overflow-hidden relative">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center space-x-3">
          <div className="bg-stripe-blue p-1.5 rounded-lg shadow-stripe-sm">
            <Car className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-stripe-dark">ColorMaster</h2>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-stripe-slate hover:bg-gray-100 rounded-md"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
        w-64 bg-[#f6f9fc] border-r border-gray-200 flex flex-col shrink-0 z-50
      `}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
};

// --- App ---

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        let data = await userService.getUser(user.uid);
        if (!data) {
          // If user doesn't exist in Firestore
          data = {
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role: USER_ROLES.EMPLOYEE
          };
          await userService.createUser(user.uid, data);
        }
        setUserData(data);
        
        if (data.companyId) {
          const compData = await companyService.getCompany(data.companyId);
          setCompany(compData);
        } else {
          setCompany(null);
        }
      } else {
        setUser(null);
        setUserData(null);
        setCompany(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCompanyCreated = (newCompany) => {
    setCompany(newCompany);
    setUserData(prev => ({ ...prev, companyId: newCompany.id, role: USER_ROLES.ADMIN }));
  };

  if (loading) return <Loading />;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login user={user} />} />
        
        <Route path="/" element={
          user ? (
            !company ? (
              <CreateCompany user={user} onCompanyCreated={handleCompanyCreated} />
            ) : (
              <Layout user={user} userData={userData} company={company}>
                <Dashboard user={user} userData={userData} company={company} />
              </Layout>
            )
          ) : <Navigate to="/login" />
        } />

        <Route path="/create-order" element={
          user && company ? (
            <Layout user={user} userData={userData} company={company}>
              <CreateOrder user={user} userData={userData} />
            </Layout>
          ) : <Navigate to="/" />
        } />

        <Route path="/order/:id" element={
          user && company ? (
            <Layout user={user} userData={userData} company={company}>
              <OrderDetails user={user} userData={userData} />
            </Layout>
          ) : <Navigate to="/" />
        } />

        <Route path="/users" element={
          user && company && userData?.role === USER_ROLES.ADMIN ? (
            <Layout user={user} userData={userData} company={company}>
              <UserManagement userData={userData} />
            </Layout>
          ) : <Navigate to="/" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
