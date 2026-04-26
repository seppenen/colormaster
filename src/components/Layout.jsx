import React, { useState } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, company, userData, isAdmin }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-stripe-light overflow-hidden relative">
      <Sidebar
        company={company}
        userData={userData}
        isAdmin={isAdmin}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
