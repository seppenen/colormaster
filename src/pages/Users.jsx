import React, { useState, useEffect } from 'react';
import { userService, USER_ROLES } from '../services/userService';
import { companyService } from '../services/companyService';
import { secondaryAuth } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { PlusCircle, Trash2, X, MapPin, Building2, Save, Pencil } from 'lucide-react';

const Users = ({ userData, company: initialCompany, onUpdateCompany }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(initialCompany);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [editingBranchName, setEditingBranchName] = useState('');
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: USER_ROLES.EMPLOYEE,
    branchId: '',
  })
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserData, setEditUserData] = useState({
    name: '',
    role: USER_ROLES.EMPLOYEE,
    branchId: '',
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
        branchId: newUserData.branchId || null,
        companyId: userData.companyId,
        isActive: true,
        createdAt: new Date(),
      };

      await userService.createUser(userProfile.uid, userProfile);
      setUsers([...users, userProfile]);
      setShowAddModal(false);
      setNewUserData({ name: '', email: '', password: '', role: USER_ROLES.EMPLOYEE, branchId: '' });
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

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    setIsUpdatingCompany(true);
    try {
      const branches = company.branches || [];
      const newBranch = {
        id: Date.now().toString(),
        name: newBranchName.trim(),
        createdAt: new Date(),
      };
      const updatedBranches = [...branches, newBranch];
      await companyService.updateCompany(company.id, { branches: updatedBranches });
      const updatedCompany = { ...company, branches: updatedBranches };
      setCompany(updatedCompany);
      if (onUpdateCompany) onUpdateCompany(updatedCompany);
      setNewBranchName('');
      setShowBranchModal(false);
    } catch (err) {
      console.error(err);
      alert('Ошибка при добавлении филиала');
    } finally {
      setIsUpdatingCompany(false);
    }
  };

  const handleUpdateBranch = async (branchId) => {
    if (!editingBranchName.trim()) return;
    
    setIsUpdatingCompany(true);
    try {
      const updatedBranches = (company.branches || []).map(b => 
        b.id === branchId ? { ...b, name: editingBranchName.trim() } : b
      );
      await companyService.updateCompany(company.id, { branches: updatedBranches });
      const updatedCompany = { ...company, branches: updatedBranches };
      setCompany(updatedCompany);
      if (onUpdateCompany) onUpdateCompany(updatedCompany);
      setEditingBranchId(null);
    } catch (err) {
      console.error(err);
      alert('Ошибка при обновлении филиала');
    } finally {
      setIsUpdatingCompany(false);
    }
  };

  const handleDeleteBranch = async (branchId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот филиал? Заказы этого филиала не будут удалены, но не будут отображаться при фильтрации по нему.')) return;

    setIsUpdatingCompany(true);
    try {
      const updatedBranches = (company.branches || []).filter(b => b.id !== branchId);
      await companyService.updateCompany(company.id, { branches: updatedBranches });
      const updatedCompany = { ...company, branches: updatedBranches };
      setCompany(updatedCompany);
      if (onUpdateCompany) onUpdateCompany(updatedCompany);
    } catch (err) {
      console.error(err);
      alert('Ошибка при удалении филиала');
    } finally {
      setIsUpdatingCompany(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: editUserData.name,
        role: editUserData.role,
        branchId: editUserData.branchId || null,
      };
      await userService.updateUser(editingUser.uid, updateData);
      setUsers(users.map(u => u.uid === editingUser.uid ? { ...u, ...updateData } : u));
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert('Ошибка при обновлении пользователя');
    }
  };

  const handleEditClick = (u) => {
    setEditingUser(u);
    setEditUserData({
      name: u.name,
      role: u.role,
      branchId: u.branchId || '',
    });
    setShowEditModal(true);
  };

  const branches = company.branches || [];

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
            Настройки
          </h1>
          <p className="text-stripe-slate mt-1 text-sm">
            Управление пользователями и филиалами
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBranchModal(true)}
            className="bg-white text-stripe-dark border border-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center shadow-sm"
          >
            <MapPin className="w-4 h-4 mr-2 text-stripe-blue" />
            Управление филиалами
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="stripe-button-primary flex items-center shadow-stripe-sm"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Добавить сотрудника
          </button>
        </div>
      </div>

      <div className="stripe-card overflow-hidden">
        {/* Mobile View: List of Cards */}
        <div className="block md:hidden divide-y divide-gray-100">
          {users.length === 0 ? (
            <div className="px-6 py-12 text-center text-stripe-slate italic">Сотрудники не найдены</div>
          ) : (
            users.map((u) => (
              <div key={u.uid} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-stripe-blue/10 flex items-center justify-center text-stripe-blue font-bold mr-3 border border-stripe-blue/20">
                      {u.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stripe-dark">{u.name}</div>
                      <div className="text-xs text-stripe-slate">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`stripe-badge text-[10px] ${u.role === USER_ROLES.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-stripe-slate'}`}
                    >
                      {u.role === USER_ROLES.ADMIN ? 'Админ' : 'Сотрудник'}
                    </span>
                    <span
                      className={`stripe-badge text-[10px] ${u.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {u.isActive !== false ? 'Активен' : 'Заблокирован'}
                    </span>
                    <span className="stripe-badge text-[10px] bg-blue-50 text-stripe-blue">
                      {u.branchId ? branches.find(b => b.id === u.branchId)?.name || '???' : 'Все филиалы'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleEditClick(u)}
                    className="flex-1 text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition-all border text-stripe-slate border-gray-100 bg-gray-50/50"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => toggleUserStatus(u.uid, u.isActive !== false)}
                    className={`flex-1 text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition-all border ${
                      u.isActive !== false
                        ? 'text-red-500 border-red-100 bg-red-50/30'
                        : 'text-emerald-600 border-emerald-100 bg-emerald-50/30'
                    }`}
                  >
                    {u.isActive !== false ? 'Заблокировать' : 'Разблокировать'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.uid)}
                    className="px-4 py-2.5 text-red-400 bg-red-50/30 border border-red-100 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <table className="hidden md:table min-w-full divide-y divide-gray-100">
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
                Филиал
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
                  <div className="text-sm text-stripe-slate">
                    {u.branchId ? branches.find(b => b.id === u.branchId)?.name || '???' : 'Все'}
                  </div>
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
                    onClick={() => handleEditClick(u)}
                    className="p-2 text-stripe-slate hover:text-stripe-blue hover:bg-stripe-light rounded-md transition-all border border-transparent hover:border-stripe-blue/10 min-h-[36px]"
                    title="Редактировать"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
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

      {showBranchModal && (
        <div className="fixed inset-0 bg-stripe-dark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="stripe-card w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stripe-dark tracking-tight flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-stripe-blue" />
                Список филиалов
              </h2>
              <button
                onClick={() => setShowBranchModal(false)}
                className="text-stripe-slate hover:text-stripe-dark"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              {company.branches && company.branches.length > 0 ? (
                company.branches.map((branch) => (
                  <div key={branch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                    <div className="flex items-center flex-1 mr-2">
                      <div className="bg-white p-1.5 rounded-md border border-gray-200 mr-3 shadow-sm flex-shrink-0">
                        <Building2 className="w-4 h-4 text-stripe-blue" />
                      </div>
                      {editingBranchId === branch.id ? (
                        <input
                          type="text"
                          autoFocus
                          className="bg-white border border-stripe-blue/30 rounded px-2 py-1 text-sm font-bold text-stripe-dark w-full outline-none focus:ring-1 focus:ring-stripe-blue/50"
                          value={editingBranchName}
                          onChange={(e) => setEditingBranchName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateBranch(branch.id);
                            if (e.key === 'Escape') setEditingBranchId(null);
                          }}
                        />
                      ) : (
                        <span className="text-sm font-bold text-stripe-dark">{branch.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {editingBranchId === branch.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateBranch(branch.id)}
                            className="text-emerald-500 hover:text-emerald-600 p-1"
                            title="Сохранить"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingBranchId(null)}
                            className="text-stripe-slate hover:text-stripe-dark p-1"
                            title="Отмена"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingBranchId(branch.id);
                              setEditingBranchName(branch.name);
                            }}
                            className="text-stripe-slate hover:text-stripe-blue p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Переименовать"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteBranch(branch.id)}
                            className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-stripe-slate italic text-sm border-2 border-dashed border-gray-100 rounded-xl">
                  Филиалы еще не добавлены
                </div>
              )}
            </div>

            <form onSubmit={handleAddBranch} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stripe-slate uppercase tracking-wider px-1">
                  Добавить новый филиал
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    className="stripe-input"
                    placeholder="Название филиала (напр. Филиал Север)"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={isUpdatingCompany}
                    className="bg-stripe-blue text-white p-2.5 rounded-lg hover:bg-stripe-blue/90 transition-colors disabled:opacity-50 shadow-stripe-sm"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-stripe-dark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="stripe-card w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stripe-dark tracking-tight">Редактировать сотрудника</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-stripe-slate hover:text-stripe-dark"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-stripe-dark">Имя сотрудника</label>
                <input
                  type="text"
                  required
                  className="stripe-input"
                  placeholder="Имя Фамилия"
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-stripe-dark">Роль</label>
                <select
                  className="stripe-input"
                  value={editUserData.role}
                  onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                >
                  <option value={USER_ROLES.EMPLOYEE}>Сотрудник</option>
                  <option value={USER_ROLES.ADMIN}>Администратор</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-stripe-dark">Филиал</label>
                <select
                  className="stripe-input"
                  value={editUserData.branchId}
                  onChange={(e) => setEditUserData({ ...editUserData, branchId: e.target.value })}
                >
                  <option value="">Все филиалы (Админ)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full stripe-button-primary py-3 pt-4">
                Сохранить изменения
              </button>
            </form>
          </div>
        </div>
      )}

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
              <div className="space-y-1">
                <label className="block text-sm font-bold text-stripe-dark">Филиал</label>
                <select
                  className="stripe-input"
                  value={newUserData.branchId}
                  onChange={(e) => setNewUserData({ ...newUserData, branchId: e.target.value })}
                >
                  <option value="">Все филиалы (Админ)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
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
