import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Settings, 
  Shield, 
  EyeOff, 
  LogOut, 
  ChevronRight, 
  Lock,
  Bell,
  CheckCircle,
  Smartphone,
  Calendar
} from 'lucide-react';

const PrivacyToggle = ({ label, icon: Icon, value, onChange, description }: any) => (
  <div className="flex items-center justify-between py-4">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900">
        <Icon size={20} className="text-zinc-500" />
      </div>
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="text-[10px] text-zinc-500">{description}</p>
      </div>
    </div>
    <button 
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full p-1 transition-colors ${value ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-800'}`}
    >
      <div className={`h-4 w-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const Profile = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);

  const updatePrivacy = async (field: string, value: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [`privacy.${field}`]: value
      });
      toast.success('Privacy updated');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const updateSettings = async (field: string, value: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { [field]: value });
      toast.success('Settings updated');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 dark:bg-zinc-950">
      {/* Header Profile Section */}
      <div className="bg-white px-6 pt-12 pb-8 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-primary/10">
            {userData?.photoURL ? (
              <img src={userData.photoURL} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400">
                <User size={40} />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black">{userData?.name || 'Loading...'}</h1>
            <p className="text-sm text-zinc-500">{userData?.department} • {userData?.year} Year</p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
              <CheckCircle size={10} /> Verified Student
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Account Settings */}
        <section>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-400">Account</label>
          <Card className="divide-y divide-zinc-50 p-0 dark:divide-zinc-800">
            <PrivacyToggle 
              label="Ghost Mode" 
              icon={EyeOff}
              description="Appear offline and hide your last seen"
              value={userData?.isGhostMode}
              onChange={(v: boolean) => updateSettings('isGhostMode', v)}
            />
            <PrivacyToggle 
              label="Lock Profile" 
              icon={Lock}
              description="Hide your profile from new people"
              value={userData?.isProfileLocked}
              onChange={(v: boolean) => updateSettings('isProfileLocked', v)}
            />
          </Card>
        </section>

        {/* Privacy Controls */}
        <section>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-400">Privacy Controls</label>
          <Card className="divide-y divide-zinc-50 p-0 dark:divide-zinc-800">
            <PrivacyToggle 
              label="Phone Number" 
              icon={Smartphone}
              description="Show phone number to friends only"
              value={userData?.privacy?.phone === 'friends'}
              onChange={(v: boolean) => updatePrivacy('phone', v ? 'friends' : 'private')}
            />
            <PrivacyToggle 
              label="Birth Date" 
              icon={Calendar}
              description="Hide your exact age from everyone"
              value={userData?.privacy?.birthdate === 'private'}
              onChange={(v: boolean) => updatePrivacy('birthdate', v ? 'private' : 'public')}
            />
          </Card>
        </section>

        {/* Other Actions */}
        <section>
          <Card className="p-0 overflow-hidden">
            <button className="flex w-full items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-zinc-500" />
                <span className="text-sm font-bold">Notifications</span>
              </div>
              <ChevronRight size={20} className="text-zinc-300" />
            </button>
            <button className="flex w-full items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-zinc-500" />
                <span className="text-sm font-bold">Safety Center</span>
              </div>
              <ChevronRight size={20} className="text-zinc-300" />
            </button>
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-3 p-4 text-danger hover:bg-danger/5"
            >
              <LogOut size={20} />
              <span className="text-sm font-black">Sign Out</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
