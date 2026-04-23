import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { loginUser } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await loginUser(email, password);
      localStorage.setItem('auth_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      localStorage.setItem('user_id', data.userId);
      const from = location.state?.from || '/';
      navigate(from);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface flex items-center justify-center p-4">
      {/* 1-Step tonal shift lift + Ambient floating shadow */}
      <div className="bg-surface-container-lowest p-8 md:p-12 rounded shadow-ambient w-full max-w-md">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tightest text-on-surface mb-2">
          Access Portal
        </h1>
        <p className="text-on-surface-variant mb-6 font-retina">
          Enter your credentials to secure your session.
        </p>

        {error && (
          <div className="bg-[#ffeceb] text-[#c20038] px-4 py-3 rounded mb-6 font-retina text-sm flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleLogin}>
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="name@example.com" 
            aria-label="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button className="w-full mt-4" type="submit">Authenticate</Button>
        </form>

        <p className="mt-6 text-center text-on-surface-variant font-retina text-sm">
          Don't have an account? <Link to="/signup" state={{ from: location.state?.from }} className="text-primary font-bold hover:underline">Create one.</Link>
        </p>
      </div>
    </div>
  );
}
