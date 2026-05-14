import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';

const BranchSelector = ({ company, activeBranchId, onBranchChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!company || !company.branches || company.branches.length === 0) {
    return null;
  }

  const activeBranch = activeBranchId === 'all'
    ? { id: 'all', name: 'Все филиалы' }
    : company.branches.find(b => b.id === activeBranchId) || { id: 'all', name: 'Все филиалы' };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between px-4 py-2 
          bg-white border rounded-lg transition-all duration-200 min-w-[160px]
          ${isOpen 
            ? 'border-stripe-blue ring-2 ring-stripe-blue/10 shadow-sm' 
            : 'border-gray-200 hover:border-gray-300 shadow-stripe-sm'}
        `}
      >
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-stripe-blue" />
          <span className="text-sm font-semibold text-stripe-dark truncate max-w-[120px]">
            {activeBranch.name}
          </span>
        </div>
        <ChevronDown className={`ml-2 w-4 h-4 text-stripe-slate transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 py-1.5 bg-white border border-gray-100 rounded-xl shadow-stripe-lg z-50 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => {
              onBranchChange('all');
              setIsOpen(false);
            }}
            className={`
              w-full flex items-center justify-between px-4 py-2 text-sm transition-colors
              ${activeBranchId === 'all' 
                ? 'bg-stripe-blue/5 text-stripe-blue font-bold' 
                : 'text-stripe-slate hover:bg-gray-50 hover:text-stripe-dark'}
            `}
          >
            <span>Все филиалы</span>
            {activeBranchId === 'all' && <Check className="w-4 h-4" />}
          </button>
          
          <div className="h-px bg-gray-100 my-1 mx-2" />
          
          {company.branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => {
                onBranchChange(branch.id);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center justify-between px-4 py-2 text-sm transition-colors
                ${activeBranchId === branch.id 
                  ? 'bg-stripe-blue/5 text-stripe-blue font-bold' 
                  : 'text-stripe-slate hover:bg-gray-50 hover:text-stripe-dark'}
              `}
            >
              <span className="truncate mr-2">{branch.name}</span>
              {activeBranchId === branch.id && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchSelector;
