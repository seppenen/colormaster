import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  LayoutDashboard,
  PlusCircle,
  Users as UsersIcon,
  LogOut,
  Car,
  Menu,
  X,
} from 'lucide-react';

const Sidebar = ({ company, userData, isAdmin, isSidebarOpen, setIsSidebarOpen }) => {
  const location = useLocation();

  const navLinkClasses = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center px-4 py-2.5 rounded-md transition-all font-medium ${
      isActive
        ? 'bg-white text-stripe-blue shadow-stripe-sm'
        : 'text-stripe-slate hover:text-stripe-dark hover:bg-gray-100'
    }`;
  };

  const SidebarContent = () => (
    <>
      <div className="p-8 flex items-center space-x-3">
        <div className="bg-stripe-blue p-1.5 rounded-lg shadow-stripe-sm">
          <Car className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stripe-dark leading-none">
            ColorMaster
          </h2>
          {company && (
            <p className="text-[10px] uppercase tracking-wider text-stripe-slate font-bold mt-1">
              {company.name}
            </p>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <Link to="/" onClick={() => setIsSidebarOpen(false)} className={navLinkClasses('/')}>
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Панель управления
        </Link>
        <Link
          to="/create-order"
          onClick={() => setIsSidebarOpen(false)}
          className={navLinkClasses('/create-order')}
        >
          <PlusCircle className="w-5 h-5 mr-3" />
          Создать заказ
        </Link>
        {isAdmin && (
          <Link
            to="/users"
            onClick={() => setIsSidebarOpen(false)}
            className={navLinkClasses('/users')}
          >
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
              <p className="text-xs text-stripe-slate truncate">
                {isAdmin ? 'Администратор' : 'Сотрудник'}
              </p>
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
    <>
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
      <aside
        className={`
        fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
        w-64 bg-[#f6f9fc] border-r border-gray-200 flex flex-col shrink-0 z-50
      `}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
