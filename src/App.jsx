import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { userService, USER_ROLES } from './services/userService';
import { companyService } from './services/companyService';

// Components
import Loading from './components/Loading';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import CreateCompany from './pages/CreateCompany';
import Dashboard from './pages/Dashboard';
import CreateOrder from './pages/CreateOrder';
import OrderDetails from './pages/OrderDetails';
import Users from './pages/Users';

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
            role: USER_ROLES.EMPLOYEE,
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
    setUserData((prev) => ({ ...prev, companyId: newCompany.id, role: USER_ROLES.ADMIN }));
  };

  if (loading) return <Loading />;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login user={user} />} />

        <Route
          path="/"
          element={
            user ? (
              !company ? (
                <CreateCompany user={user} onCompanyCreated={handleCompanyCreated} />
              ) : (
                <Layout
                  company={company}
                  userData={userData}
                  isAdmin={userData?.role === USER_ROLES.ADMIN}
                >
                  <Dashboard user={user} userData={userData} company={company} />
                </Layout>
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/create-order"
          element={
            user && company ? (
              <Layout
                company={company}
                userData={userData}
                isAdmin={userData?.role === USER_ROLES.ADMIN}
              >
                <CreateOrder user={user} userData={userData} />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/order/:id"
          element={
            user && company ? (
              <Layout
                company={company}
                userData={userData}
                isAdmin={userData?.role === USER_ROLES.ADMIN}
              >
                <OrderDetails user={user} userData={userData} />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/users"
          element={
            user && company && userData?.role === USER_ROLES.ADMIN ? (
              <Layout
                company={company}
                userData={userData}
                isAdmin={userData?.role === USER_ROLES.ADMIN}
              >
                <Users userData={userData} />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
