import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, CreditCard, Loader } from 'lucide-react';
import { Button } from '../components/UI/Button';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../services/api';

export default function AccountPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfile(data);
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-surface py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tightest text-on-surface mb-2 uppercase">
            Account Profile
          </h1>
          <p className="text-on-surface-variant font-retina text-lg">
            Manage your personal details and security preferences.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded shadow-ambient border border-outline-variant/15 p-8 mb-8 relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/50 z-10">
              <Loader className="spin-icon text-primary" size={32} />
            </div>
          )}
          
          {error && !loading && (
            <div className="bg-[#ffeceb] text-[#c20038] px-4 py-3 rounded mb-6 font-retina text-sm">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {!loading && profile && (
            <>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 uppercase text-3xl font-bold">
                  {profile.fullName ? profile.fullName.charAt(0) : <User size={40} />}
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-extrabold text-on-surface uppercase tracking-wider">{profile.fullName || 'No Name'}</h2>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-on-surface-variant font-retina mt-2">
                    <Mail size={16} /> {profile.email}
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-success font-retina mt-1">
                    <Shield size={16} /> Account Verified
                  </div>
                </div>
              </div>
              
              <div className="border-t border-outline-variant/15 pt-8">
                <h3 className="font-extrabold text-lg text-on-surface mb-6 uppercase tracking-wider">Payment Methods</h3>
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded border border-outline-variant/15">
                  <div className="flex items-center gap-3">
                    <CreditCard size={20} className="text-on-surface-variant" />
                    <span className="font-mono text-on-surface font-bold tracking-widest">•••• •••• •••• 4242</span>
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Primary</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={handleSignOut}>Sign Out</Button>
          <Button className="w-full sm:w-auto">Update Profile</Button>
        </div>
      </div>
    </div>
  );
}
