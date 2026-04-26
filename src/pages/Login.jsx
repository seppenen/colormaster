import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Car, AlertTriangle } from 'lucide-react';

const Login = ({ user }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stripe-light">
      <div className="p-10 stripe-card w-full max-w-md">
        <form onSubmit={handleLogin}>
          <div className="flex justify-center mb-8">
            <div className="bg-stripe-blue p-3 rounded-xl shadow-stripe">
              <Car className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-center text-stripe-dark tracking-tight">
            My Order Management
          </h1>
          <p className="text-center text-stripe-slate mb-8">Войдите в свою учетную запись</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-md mb-6 text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-stripe-dark text-sm font-semibold mb-2">
              Электронная почта
            </label>
            <input
              type="email"
              className="stripe-input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-8">
            <label className="block text-stripe-dark text-sm font-semibold mb-2">Пароль</label>
            <input
              type="password"
              className="stripe-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full stripe-button-primary py-3 mb-4">
            Войти
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
