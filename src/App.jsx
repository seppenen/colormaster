import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './services/firebase';
import { userService, USER_ROLES } from './services/userService';
import { companyService } from './services/companyService';

import Loading from './components/Loading';
import Layout from './components/Layout';

// Ленивая загрузка страниц: каждая страница попадает в свой чанк,
// поэтому, например, Login не тянет за собой FullCalendar/Reporting/т.д.
// Это особенно заметно на мобильных — меньше JS для скачивания и разбора при первом заходе.
const Login = lazy(() => import('./pages/Login'));
const CreateCompany = lazy(() => import('./pages/CreateCompany'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateOrder = lazy(() => import('./pages/CreateOrder'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const Users = lazy(() => import('./pages/Users'));
const Reporting = lazy(() => import('./pages/Reporting'));

const getStoredBranchId = () => localStorage.getItem('activeBranchId') || 'all';

const buildDefaultUserData = (firebaseUser) => ({
  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
  email: firebaseUser.email,
  role: USER_ROLES.EMPLOYEE,
});

const withLayout = (page, { company, userData, activeBranchId, handleBranchChange }) => (
  <Layout
    company={company}
    userData={userData}
    isAdmin={userData?.role === USER_ROLES.ADMIN}
    activeBranchId={activeBranchId}
    onBranchChange={handleBranchChange}
  >
    {page}
  </Layout>
);

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [company, setCompany] = useState(null);
  const [activeBranchId, setActiveBranchId] = useState(getStoredBranchId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData || userData.role === USER_ROLES.ADMIN || !userData.branchId) {
      return;
    }

    setActiveBranchId(userData.branchId);
  }, [userData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setUserData(null);
        setCompany(null);
        setLoading(false);
        return;
      }

      try {
        setUser(firebaseUser);

        let userProfile = await userService.getUser(firebaseUser.uid);

        if (!userProfile) {
          userProfile = buildDefaultUserData(firebaseUser);
          await userService.createUser(firebaseUser.uid, userProfile);
        }

        setUserData(userProfile);

        if (userProfile.companyId) {
          const companyData = await companyService.getCompany(userProfile.companyId);
          setCompany(companyData);
        } else {
          setCompany(null);
        }
      } catch (error) {
        console.error('Failed to initialize app state:', error);
        setUser(null);
        setUserData(null);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCompanyCreated = (newCompany) => {
    setCompany(newCompany);
    setUserData((previousUserData) => ({
      ...previousUserData,
      companyId: newCompany.id,
      role: USER_ROLES.ADMIN,
    }));
  };

  const handleBranchChange = (nextBranchId) => {
    setActiveBranchId(nextBranchId);
    localStorage.setItem('activeBranchId', nextBranchId);
  };

  if (loading) {
    return <Loading />;
  }

  const isAuthenticated = Boolean(user);
  const isCompanyReady = Boolean(company);
  const isAdmin = userData?.role === USER_ROLES.ADMIN;

  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login user={user} />} />

          <Route
            path="/"
            element={
              isAuthenticated ? (
                !isCompanyReady ? (
                  <CreateCompany user={user} onCompanyCreated={handleCompanyCreated} />
                ) : (
                  withLayout(
                    <Dashboard
                      user={user}
                      userData={userData}
                      company={company}
                      activeBranchId={activeBranchId}
                      onBranchChange={handleBranchChange}
                    />,
                    { company, userData, activeBranchId, handleBranchChange }
                  )
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/create-order"
            element={
              isAuthenticated && isCompanyReady ? (
                withLayout(
                  <CreateOrder
                    user={user}
                    userData={userData}
                    company={company}
                    activeBranchId={activeBranchId === 'all' ? '' : activeBranchId}
                  />,
                  { company, userData, activeBranchId, handleBranchChange }
                )
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/calendar"
            element={
              isAuthenticated && isCompanyReady ? (
                withLayout(
                  <CalendarPage
                    userData={userData}
                    company={company}
                    activeBranchId={activeBranchId}
                    onBranchChange={handleBranchChange}
                  />,
                  { company, userData, activeBranchId, handleBranchChange }
                )
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/order/:id"
            element={
              isAuthenticated && isCompanyReady ? (
                withLayout(<OrderDetails user={user} userData={userData} company={company} />, {
                  company,
                  userData,
                  activeBranchId,
                  handleBranchChange,
                })
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/users"
            element={
              isAuthenticated && isCompanyReady && isAdmin ? (
                withLayout(<Users userData={userData} company={company} />, {
                  company,
                  userData,
                  activeBranchId,
                  handleBranchChange,
                })
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/reporting"
            element={
              isAuthenticated && isCompanyReady && isAdmin ? (
                withLayout(<Reporting userData={userData} />, {
                  company,
                  userData,
                  activeBranchId,
                  handleBranchChange,
                })
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
