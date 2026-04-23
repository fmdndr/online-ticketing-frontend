import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { registerUser } from '../services/api';

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await registerUser(email, password, name);
      localStorage.setItem('auth_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      localStorage.setItem('user_id', data.userId);
      const from = location.state?.from || '/';
      navigate(from);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface flex items-center justify-center p-4">
      {/* 1-Step tonal shift lift + Ambient floating shadow */}
      <div className="bg-surface-container-lowest p-8 md:p-12 rounded shadow-ambient w-full max-w-md">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tightest text-on-surface mb-2">
          Create Identity
        </h1>
        <p className="text-on-surface-variant mb-6 font-retina">
          Register a new account to secure event access.
        </p>

        {error && (
          <div className="bg-[#ffeceb] text-[#c20038] px-4 py-3 rounded mb-6 font-retina text-sm flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSignup}>
          <Input 
            label="Full Name" 
            type="text" 
            placeholder="Alexander Socratic" 
            aria-label="Name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
          <Button className="w-full mt-4" type="submit">Create Account</Button>
        </form>

        <p className="mt-6 text-center text-on-surface-variant font-retina text-sm">
          Already have an account? <Link to="/login" state={{ from: location.state?.from }} className="text-primary font-bold hover:underline">Authenticate here.</Link>
        </p>
      </div>
    </div>
  );
}
