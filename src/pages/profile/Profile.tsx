import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, doc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Shield, 
  EyeOff, 
  LogOut, 
  ChevronRight, 
  Lock,
  Bell,
  CheckCircle,
  Smartphone,
  Calendar,
  Save
} from 'lucide-react';

const GENDERS = ['Male', 'Female', 'Other'];
const ENGAGEMENT_TYPES = ['Club', 'Lab', 'Job', 'Office', 'Freelance', 'None'];

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
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: userData?.username || '',
    phone: userData?.phone || '',
    birthDate: userData?.birthDate || '',
    gender: userData?.gender || '',
    hometown: userData?.hometown || '',
    currentCity: userData?.currentCity || '',
    engagementType: userData?.engagementType || '',
    engagementDetails: userData?.engagementDetails || '',
  });

  const normalizeUsername = (value: string) => value.trim().toLowerCase();
  const normalizePhone = (value: string) => value.replace(/\D/g, '');

  const isBirthDateValid = (value: string) => {
    if (!value) return false;
    const birth = new Date(value);
    if (Number.isNaN(birth.getTime())) return false;

    const now = new Date();
    if (birth > now) return false;

    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age -= 1;
    }

    return age >= 16;
  };

  React.useEffect(() => {
    setProfileForm({
      username: userData?.username || '',
      phone: userData?.phone || '',
      birthDate: userData?.birthDate || '',
      gender: userData?.gender || '',
      hometown: userData?.hometown || '',
      currentCity: userData?.currentCity || '',
      engagementType: userData?.engagementType || '',
      engagementDetails: userData?.engagementDetails || '',
    });
  }, [userData]);

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

  const handleProfileSave = async () => {
    if (!user) return;

    const usernameLower = normalizeUsername(profileForm.username);
    const phoneNormalized = normalizePhone(profileForm.phone);

    if (!/^[a-z0-9._]{3,20}$/.test(usernameLower)) {
      toast.error('Username must be 3-20 chars and use only letters, numbers, dot, or underscore.');
      return;
    }

    if (phoneNormalized.length < 10 || phoneNormalized.length > 15) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    if (!isBirthDateValid(profileForm.birthDate)) {
      toast.error('Please provide a valid birth date (minimum age 16).');
      return;
    }

    if (!profileForm.gender) {
      toast.error('Please select a gender.');
      return;
    }

    setSavingProfile(true);
    try {
      const usersRef = collection(db, 'users');
      const [usernameSnap, phoneSnap] = await Promise.all([
        getDocs(query(usersRef, where('usernameLower', '==', usernameLower), limit(1))),
        getDocs(query(usersRef, where('phoneNormalized', '==', phoneNormalized), limit(1))),
      ]);

      const usernameTaken = usernameSnap.docs.some((d) => d.id !== user.uid);
      if (usernameTaken) {
        toast.error('Username is already taken. Please choose another one.');
        return;
      }

      const phoneTaken = phoneSnap.docs.some((d) => d.id !== user.uid);
      if (phoneTaken) {
        toast.error('Phone number is already used by another account.');
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        username: profileForm.username.trim(),
        usernameLower,
        phone: profileForm.phone.trim(),
        phoneNormalized,
        birthDate: profileForm.birthDate,
        gender: profileForm.gender,
        hometown: profileForm.hometown.trim(),
        currentCity: profileForm.currentCity.trim(),
        engagementType: profileForm.engagementType,
        engagementDetails: profileForm.engagementDetails.trim(),
      });

      toast.success('Profile details updated');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Failed to update profile details');
    } finally {
      setSavingProfile(false);
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
        <section>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-400">Profile Details</label>
          <Card className="space-y-4">
            <Input
              label="Username"
              placeholder="e.g. ratul_09"
              value={profileForm.username}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Phone Number"
                placeholder="e.g. 017XXXXXXXX"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <Input
                label="Birth Date"
                type="date"
                value={profileForm.birthDate}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, birthDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Gender</label>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setProfileForm((prev) => ({ ...prev, gender: g }))}
                    className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${profileForm.gender === g ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Hometown"
                placeholder="Where are you from?"
                value={profileForm.hometown}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, hometown: e.target.value }))}
              />
              <Input
                label="Current City"
                placeholder="Where do you live now?"
                value={profileForm.currentCity}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, currentCity: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Engagement Type</label>
              <div className="flex flex-wrap gap-2">
                {ENGAGEMENT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setProfileForm((prev) => ({ ...prev, engagementType: type }))}
                    className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${profileForm.engagementType === type ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {profileForm.engagementType && profileForm.engagementType !== 'None' && (
              <Input
                label="Engagement Details"
                placeholder="Club/lab/company/role"
                value={profileForm.engagementDetails}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, engagementDetails: e.target.value }))}
              />
            )}

            <div className="flex justify-end">
              <Button onClick={handleProfileSave} isLoading={savingProfile}>
                <Save className="mr-2 h-4 w-4" />
                Save Profile Details
              </Button>
            </div>
          </Card>
        </section>

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
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Profile;
