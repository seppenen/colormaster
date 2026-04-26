import React, { useState, useEffect } from 'react';
import { userService, USER_ROLES } from '../services/userService';
import { secondaryAuth } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { PlusCircle, Trash2, X } from 'lucide-react';

const Users = ({ userData }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: USER_ROLES.EMPLOYEE,
  });

  useEffect(() => {
    const fetchUsers = async () => {
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
  }, [userData.companyId]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newUserData.email,
        newUserData.password
      );

      const userProfile = {
        uid: userCredential.user.uid,
        name: newUserData.name,
        email: newUserData.email,
        role: newUserData.role,
        companyId: userData.companyId,
        isActive: true,
        createdAt: new Date(),
      };

      await userService.createUser(userProfile.uid, userProfile);
      setUsers([...users, userProfile]);
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
        setUsers(users.filter((u) => u.uid !== uid));
      } catch (err) {
        console.error(err);
        alert('Ошибка при удалении пользователя');
      }
    }
  };

  const toggleUserStatus = async (uid, currentStatus) => {
    try {
      await userService.updateUser(uid, { isActive: !currentStatus });
      setUsers(users.map((u) => (u.uid === uid ? { ...u, isActive: !currentStatus } : u)));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-stripe-blue"></div>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stripe-dark">
            Управление пользователями
          </h1>
          <p className="text-stripe-slate mt-1 text-sm">
            Управление доступом сотрудников к системе
          </p>
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
              <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">
                Имя
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">
                Роль
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-stripe-slate uppercase tracking-widest">
                Статус
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-stripe-slate uppercase tracking-widest">
                Действие
              </th>
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
                  <span
                    className={`stripe-badge ${u.role === USER_ROLES.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-stripe-slate'}`}
                  >
                    {u.role === USER_ROLES.ADMIN ? 'Админ' : 'Сотрудник'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`stripe-badge ${u.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                  >
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
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stripe-slate hover:text-stripe-dark"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-stripe-dark">Имя сотрудника</label>
                <input
                  type="text"
                  required
                  className="stripe-input"
                  placeholder="Имя Фамилия"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-stripe-dark">Email</label>
                <input
                  type="email"
                  required
                  className="stripe-input"
                  placeholder="email@company.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-stripe-dark">Пароль</label>
                <input
                  type="password"
                  required
                  minLength="6"
                  className="stripe-input"
                  placeholder="••••••"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-stripe-dark">Роль</label>
                <select
                  className="stripe-input"
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                >
                  <option value={USER_ROLES.EMPLOYEE}>Сотрудник</option>
                  <option value={USER_ROLES.ADMIN}>Администратор</option>
                </select>
              </div>
              <button type="submit" className="w-full stripe-button-primary py-3 pt-4">
                Создать аккаунт
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
