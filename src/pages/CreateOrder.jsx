import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { userService, USER_ROLES } from '../services/userService';
import { Camera, X, Plus } from 'lucide-react';

const CreateOrder = ({ user, userData, activeBranchId, company }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [formData, setFormData] = useState({
    carModel: '',
    carNumber: '',
    clientName: '',
    clientPhone: '',
    viitenumero: '',
    description: '',
    price: '',
    includeAlv: false,
    branchId: userData?.branchId || activeBranchId || '',
  });

  const handleInputChange = (e) => {
    let { name, value, type, checked } = e.target;
    if (name === 'carNumber') {
      const val = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (val.length > 3) {
        value = val.slice(0, 3) + '-' + val.slice(3, 6);
      } else {
        value = val;
      }
    }
    if (name === 'includeAlv') {
      return; // Мы больше не меняем это через инпут напрямую, будет кнопка
    }
    const finalValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleAddAlv = () => {
    const currentPrice = parseFloat(formData.price);
    if (!isNaN(currentPrice)) {
      const newPrice = (currentPrice * 1.255).toFixed(2);
      setFormData((prev) => ({ ...prev, price: newPrice, includeAlv: true }));
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => file.type.startsWith('image/'));

    setPhotos((prev) => [...prev, ...validFiles]);

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await orderService.createOrder(
        formData,
        photos,
        user,
        userData.companyId,
        userData,
        formData.branchId || null
      );
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stripe-dark">
          Создать заказ
        </h1>
        <p className="text-stripe-slate mt-1 text-sm">
          Заполните анкету для регистрации нового заказа
        </p>
      </div>

      <form onSubmit={handleSubmit} className="stripe-card p-4 md:p-8 space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 md:gap-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-bold text-stripe-dark">
              Марка и модель автомобиля *
            </label>
            <input
              type="text"
              name="carModel"
              required
              className="stripe-input"
              placeholder="например, BMW X5"
              value={formData.carModel}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-stripe-dark">Рег номер</label>
            <input
              type="text"
              name="carNumber"
              className="stripe-input font-mono uppercase"
              placeholder="ABC-123"
              value={formData.carNumber}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-stripe-dark">ФИО клиента *</label>
            <input
              type="text"
              name="clientName"
              required
              className="stripe-input"
              placeholder="Иван Иванов"
              value={formData.clientName}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-stripe-dark">Телефон клиента</label>
            <input
              type="text"
              name="clientPhone"
              className="stripe-input"
              placeholder="+358 40 123 4567"
              value={formData.clientPhone}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-stripe-dark">Viitenumero</label>
            <input
              type="text"
              name="viitenumero"
              className="stripe-input"
              placeholder="123456"
              value={formData.viitenumero}
              onChange={handleInputChange}
            />
          </div>

          {company?.branches && company.branches.length > 0 && (
            <div className="space-y-1">
              <label className="block text-sm font-bold text-stripe-dark">
                Филиал *
              </label>
              <select
                name="branchId"
                required
                className="stripe-input"
                value={formData.branchId}
                onChange={handleInputChange}
              >
                <option value="">Все</option>
                {company.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-bold text-stripe-dark">Описание работ *</label>
          <textarea
            name="description"
            required
            rows="4"
            className="stripe-input resize-none"
            placeholder="Опишите необходимые работы..."
            value={formData.description}
            onChange={handleInputChange}
          ></textarea>
        </div>

        {userData?.role === USER_ROLES.ADMIN && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-stripe-dark">
                Ориентировочная цена (€)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                  €
                </span>
                <input
                  type="number"
                  name="price"
                  className="stripe-input pl-8"
                  value={formData.price}
                  onChange={handleInputChange}
                />
                {formData.includeAlv && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-600 uppercase bg-white pl-1">
                    sis. alv
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleAddAlv}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-stripe-dark rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                + alv (25.5%)
              </button>
              {formData.includeAlv && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, includeAlv: false }))}
                  className="ml-2 text-[10px] text-red-500 hover:text-red-700 font-bold uppercase"
                >
                  убрать пометку
                </button>
              )}
            </div>
          </div>
        )}


        <div className="space-y-4 pt-4 border-t border-gray-100">
          <label className="block text-sm font-bold text-stripe-dark">Фотографии автомобиля</label>
          <div className="flex flex-wrap gap-3 md:gap-4">
            <label className="flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-stripe-blue hover:bg-stripe-light transition-all group">
              <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 group-hover:text-stripe-blue transition-colors" />
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2 group-hover:text-stripe-blue text-center px-1">
                Загрузить
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative w-28 h-28 sm:w-32 sm:h-32 group animate-in fade-in zoom-in duration-300"
              >
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-xl shadow-stripe-sm border border-gray-100"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1.5 shadow-stripe border border-gray-100 hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-stripe-slate italic">
            Поддерживаются форматы: JPEG, PNG, WEBP. Фотографии сжимаются перед загрузкой.
          </p>
        </div>

        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="stripe-button-secondary px-8 w-full sm:w-auto order-2 sm:order-1"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="stripe-button-primary px-8 w-full sm:w-auto order-1 sm:order-2"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Создание...
              </div>
            ) : (
              'Создать заказ'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
