import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';
import api from '../../utils/api';

export default function AdminProfile() {
  const { user, login } = useAppContext();
  
  // Profile details states
  const [name, setName] = useState(user?.name || localStorage.getItem('userName') || 'System Admin');
  const [email, setEmail] = useState(user?.email || 'admin@mic.edu');
  const [phone, setPhone] = useState(user?.phone || '9500011000');
  
  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const lastLogin = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await api.put('/admin/profile', { name, email, phone });
      
      // Update global context state
      const updatedUser = { ...user, name, email, phone };
      login(updatedUser, localStorage.getItem('token'));
      
      toast.success('Profile details updated successfully.');
    } catch (err) {
      toast.error('Failed to update profile details.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.put('/admin/change-password', { password: newPassword });
      toast.success('Password changed successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Failed to change password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="flex-1 w-full overflow-y-auto p-5 md:p-8 xl:p-10 bg-surface">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header row */}
        <div className="border-b border-outline-variant/15 pb-5">
          <h1 className="font-display font-bold text-2xl text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">account_circle</span>
            System Administrator Profile
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Manage your personal profile details, inspect system login parameters, and change account passwords.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* 1. Profile Photo & Metadata Card */}
          <div className="space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-card flex flex-col items-center text-center">
              
              {/* Photo placeholder with initials */}
              <div className="w-24 h-24 rounded-3xl brand-gradient text-white flex items-center justify-center font-display font-extrabold text-3xl shadow-2xl relative mb-4">
                {name.slice(0, 1)}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-surface-container-lowest" />
              </div>

              <h3 className="font-display font-extrabold text-lg text-on-surface leading-tight">{name}</h3>
              <p className="font-mono text-xs text-primary font-bold uppercase mt-1">ADM001</p>
              
              <div className="w-full border-t border-outline-variant/10 mt-5 pt-5 space-y-3.5 text-left font-body text-xs text-on-surface-variant">
                <div>
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-0.5">Role</span>
                  <span className="font-semibold text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">admin_panel_settings</span>
                    System Administrator
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-0.5">Last Login Session</span>
                  <span className="font-semibold text-on-surface font-mono">{lastLogin}</span>
                </div>
              </div>

            </div>
          </div>

          {/* 2. Main forms */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Edit details form */}
            <form onSubmit={handleUpdateProfile} className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-card space-y-4">
              <h3 className="font-display font-bold text-sm text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <span className="material-symbols-outlined text-primary">manage_accounts</span>
                Update Profile details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Email ID</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Mobile Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-5 py-2.5 rounded-xl brand-gradient text-white font-label font-bold text-xs shadow-brand-sm hover:shadow-brand transition-all"
                >
                  {updatingProfile ? 'Saving details...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>

            {/* Change password form */}
            <form onSubmit={handleChangePassword} className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-card space-y-4">
              <h3 className="font-display font-bold text-sm text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <span className="material-symbols-outlined text-primary">key</span>
                Change Account Password
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-label text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-5 py-2.5 rounded-xl brand-gradient text-white font-label font-bold text-xs shadow-brand-sm hover:shadow-brand transition-all"
                >
                  {updatingPassword ? 'Changing password...' : 'Update Password'}
                </button>
              </div>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
}
