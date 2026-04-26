import React, { useState } from 'react';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { companyService } from '../services/companyService';
import { userService, USER_ROLES } from '../services/userService';

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
        role: USER_ROLES.ADMIN,
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
        <h1 className="text-3xl font-bold mb-2 text-center text-stripe-dark tracking-tight">
          Создайте компанию
        </h1>
        <p className="text-center text-stripe-slate mb-8">
          Для начала работы необходимо зарегистрировать вашу автомастерскую
        </p>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-md mb-6 text-sm flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <label className="block text-stripe-dark text-sm font-semibold mb-2">
              Название автомастерской
            </label>
            <input
              type="text"
              className="stripe-input"
              placeholder="Напр., АвтоГлянец"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full stripe-button-primary py-3" disabled={loading}>
            {loading ? 'Создание...' : 'Создать и продолжить'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCompany;
