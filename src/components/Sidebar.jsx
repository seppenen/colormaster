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
  FileBarChart,
  CalendarDays,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const Sidebar = ({ 
  company, 
  userData, 
  isAdmin, 
  isSidebarOpen, 
  setIsSidebarOpen, 
}) => {
  const location = useLocation();

  const navLinkClasses = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center px-4 py-2.5 rounded-lg transition-all font-semibold ${
      isActive
        ? 'bg-[#f2f1ff] text-[#0a2540] shadow-[inset_0_0_0_1px_rgba(99,91,255,0.08)]'
        : 'text-[#425466] hover:text-[#0a2540] hover:bg-slate-50'
    }`;
  };

  const SidebarContent = () => (
    <>
      <div className="p-5 pb-4 flex items-center space-x-3">
        <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] p-2.5 rounded-xl shadow-[0_12px_24px_rgba(99,91,255,0.24)]">
          <Car className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0a2540] leading-none">
            Flowly
          </h2>
          {company && (
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#425466] font-bold mt-1">
              {company.name}
            </p>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3.5 space-y-1.5 overflow-y-auto pt-2">
        <Link to="/" onClick={() => setIsSidebarOpen(false)} className={navLinkClasses('/')}>
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Центр заказов
        </Link>
        <Link
          to="/calendar"
          onClick={() => setIsSidebarOpen(false)}
          className={navLinkClasses('/calendar')}
        >
          <CalendarDays className="w-5 h-5 mr-3" />
          Календарь
        </Link>
        {isAdmin && (
          <Link
            to="/users"
            onClick={() => setIsSidebarOpen(false)}
            className={navLinkClasses('/users')}
          >
            <UsersIcon className="w-5 h-5 mr-3" />
            Настройки
          </Link>
        )}
        {isAdmin && (
          <Link
            to="/reporting"
            onClick={() => setIsSidebarOpen(false)}
            className={navLinkClasses('/reporting')}
          >
            <FileBarChart className="w-5 h-5 mr-3" />
            Отчеты
          </Link>
        )}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-white rounded-xl p-4 shadow-[0_6px_16px_rgba(15,23,42,0.04)] border border-slate-200 mb-4">
          <div className="flex items-center">
            <div className="w-11 h-11 rounded-full bg-[#ecebff] flex items-center justify-center text-[#4f46e5] font-bold mr-3 ring-2 ring-[#f3f2ff]">
              {userData?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-[#0a2540] truncate">{userData?.name}</p>
              <p className="text-xs text-[#425466] truncate">
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
          className="flex items-center w-full px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-all font-semibold"
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
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] p-1.5 rounded-lg shadow-[0_10px_20px_rgba(99,91,255,0.18)]">
            <Car className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-[#0a2540]">ColorMaster</h2>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-[#425466] hover:bg-slate-100 rounded-lg"
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
        w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 z-50
      `}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
