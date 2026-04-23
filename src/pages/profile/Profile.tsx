import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, doc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import ProfileCard from '@/components/profile/ProfileCard';
import { useSafety } from '@/hooks/useSafety';
import { isPwaInstalled, requestPwaInstallPrompt } from '@/components/layout/PwaInstallPrompt';
import { toast } from 'react-hot-toast';
import { DEPARTMENTS, ACADEMIC_YEARS, LOOKING_FOR, INTEREST_CATEGORIES } from '@/lib/matchAlgorithm';
import { getAvatarOptionsByGender } from '@/lib/avatarOptions';
import { 
  User, 
  Shield, 
  EyeOff, 
  LogOut, 
  ChevronRight, 
  Lock,
  Bell,
  Download,
  CheckCircle,
  Smartphone,
  Calendar,
  Save,
  Eye,
  AlertTriangle,
  Sparkles,
  Coins,
  Info,
  MessageCircle,
  Zap
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
  const { unblockUser } = useSafety();
  const [savingProfile, setSavingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSafetyCenterOpen, setIsSafetyCenterOpen] = useState(false);
  const [unblockingUid, setUnblockingUid] = useState<string | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: userData?.username || '',
    phone: userData?.phone || '',
    birthDate: userData?.birthDate || '',
    gender: userData?.gender || '',
    department: userData?.department || '',
    year: userData?.year || '',
    lookingFor: userData?.lookingFor || '',
    bio: userData?.bio || '',
    hometown: userData?.hometown || '',
    currentCity: userData?.currentCity || '',
    engagementType: userData?.engagementType || '',
    engagementDetails: userData?.engagementDetails || '',
    interests: (userData?.interests || {}) as Record<string, string[]>,
    photoURL: userData?.photoURL || user?.photoURL || '',
  });

  const avatarOptions = getAvatarOptionsByGender(profileForm.gender);

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
      department: userData?.department || '',
      year: userData?.year || '',
      lookingFor: userData?.lookingFor || '',
      bio: userData?.bio || '',
      hometown: userData?.hometown || '',
      currentCity: userData?.currentCity || '',
      engagementType: userData?.engagementType || '',
      engagementDetails: userData?.engagementDetails || '',
      interests: (userData?.interests || {}) as Record<string, string[]>,
      photoURL: userData?.photoURL || user?.photoURL || '',
    });
  }, [userData]);

  const toggleInterest = (category: string, interest: string) => {
    setProfileForm((prev) => {
      const catInterests = prev.interests[category] || [];
      const newCatInterests = catInterests.includes(interest)
        ? catInterests.filter((i) => i !== interest)
        : [...catInterests, interest];

      return {
        ...prev,
        interests: {
          ...prev.interests,
          [category]: newCatInterests,
        },
      };
    });
  };

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
    const currentUsernameLower = normalizeUsername(userData?.username || '');
    const currentPhoneNormalized = normalizePhone(userData?.phone || '');
    const usernameChanged = usernameLower !== currentUsernameLower;
    const phoneChanged = phoneNormalized !== currentPhoneNormalized;

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

    if (!profileForm.department || !profileForm.year || !profileForm.lookingFor) {
      toast.error('Please complete department, academic year, and looking for.');
      return;
    }

    if (Object.values(profileForm.interests).flat().length < 5) {
      toast.error('Please select at least 5 interests.');
      return;
    }

    setSavingProfile(true);
    try {
      if (usernameChanged || phoneChanged) {
        const runUniqueChecks = async () => {
          const usersRef = collection(db, 'users');
          const queryTasks: Promise<any>[] = [];

          if (usernameChanged) {
            queryTasks.push(getDocs(query(usersRef, where('usernameLower', '==', usernameLower), limit(1))));
          }

          if (phoneChanged) {
            queryTasks.push(getDocs(query(usersRef, where('phoneNormalized', '==', phoneNormalized), limit(1))));
          }

          const queryResults = await Promise.all(queryTasks);
          let resultIndex = 0;

          if (usernameChanged) {
            const usernameSnap = queryResults[resultIndex++];
            const usernameTaken = usernameSnap.docs.some((d: any) => d.id !== user.uid);
            if (usernameTaken) {
              throw new Error('USERNAME_TAKEN');
            }
          }

          if (phoneChanged) {
            const phoneSnap = queryResults[resultIndex++];
            const phoneTaken = phoneSnap.docs.some((d: any) => d.id !== user.uid);
            if (phoneTaken) {
              throw new Error('PHONE_TAKEN');
            }
          }
        };

        try {
          await runUniqueChecks();
        } catch (error: any) {
          if (error?.message === 'USERNAME_TAKEN') {
            toast.error('Username is already taken. Please choose another one.');
            return;
          }

          if (error?.message === 'PHONE_TAKEN') {
            toast.error('Phone number is already used by another account.');
            return;
          }

          if (error?.code === 'permission-denied') {
            await user.reload();
            await user.getIdToken(true);
            await runUniqueChecks();
          } else {
            throw error;
          }
        }
      }

      await updateDoc(doc(db, 'users', user.uid), {
        username: profileForm.username.trim(),
        usernameLower,
        phone: profileForm.phone.trim(),
        phoneNormalized,
        birthDate: profileForm.birthDate,
        gender: profileForm.gender,
        department: profileForm.department,
        year: profileForm.year,
        lookingFor: profileForm.lookingFor,
        bio: profileForm.bio.trim(),
        hometown: profileForm.hometown.trim(),
        currentCity: profileForm.currentCity.trim(),
        engagementType: profileForm.engagementType,
        engagementDetails: profileForm.engagementDetails.trim(),
        interests: profileForm.interests,
        photoURL: profileForm.photoURL,
      });

      toast.success('Profile details updated');
      setIsEditing(false);
    } catch (error: any) {
      console.error(error);
      if (error?.code === 'permission-denied') {
        toast.error('Permission denied while checking username/phone. Please sign out, sign in again, and try once more.');
        return;
      }
      toast.error(error?.message || 'Failed to update profile details');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const handleUnblock = async (targetUid: string) => {
    setUnblockingUid(targetUid);
    await unblockUser(targetUid);
    setUnblockingUid(null);
  };

  const handleInstallApp = async () => {
    if (isPwaInstalled()) {
      toast.success('UniVibe is already installed on this device.');
      return;
    }

    // Attempt direct install if prompt is captured
    const prompt = (window as any).deferredPwaPrompt;
    if (prompt) {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          (window as any).deferredPwaPrompt = null;
        }
        return;
      } catch (err) {
        console.error('PWA prompt failed:', err);
      }
    }

    requestPwaInstallPrompt();
    toast('Install prompt is ready. Check the banner at the bottom.', { icon: '📲' });
  };

  const previewUser = {
    ...userData,
    name: userData?.name || user?.displayName || 'You',
    year: userData?.year || profileForm.year || '',
    department: userData?.department || profileForm.department || '',
    lookingFor: userData?.lookingFor || profileForm.lookingFor || '',
    bio: userData?.bio || profileForm.bio || '',
    interests: userData?.interests || profileForm.interests || {},
    photoURL: profileForm.photoURL || userData?.photoURL || user?.photoURL || '',
  };

  return (
    <div className="min-h-screen bg-[#020202] pb-24">
      {/* Header Profile Section */}
      <div className="relative overflow-hidden bg-zinc-900 px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-10 border-b border-white/[0.06]">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-secondary/5 blur-3xl" />

        <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-8">
          {/* Avatar Container with Premium Glow */}
          <div className="group relative">
            <div className="absolute -inset-1.5 animate-pulse rounded-full bg-gradient-to-tr from-primary via-secondary to-primary opacity-20 blur-md group-hover:opacity-40 transition-opacity" />
            <div className="relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-white dark:ring-zinc-900 shadow-2xl">
              <div className="absolute inset-0 rounded-full border-[3px] border-primary/20" />
              {userData?.photoURL ? (
                <img src={userData.photoURL} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-zinc-300 dark:bg-zinc-800">
                  <User size={48} />
                </div>
              )}
            </div>
            {/* Status Indicator (Always online for self) */}
            <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-white bg-emerald-500 shadow-lg dark:border-zinc-900" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-1 sm:items-start sm:gap-2">
              <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                {userData?.name || user?.displayName || 'Student'}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {userData?.username && (
                  <p className="text-sm font-bold text-primary">@{userData.username}</p>
                )}
                <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {userData?.department} • {userData?.year} Year
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
                <CheckCircle size={12} className="fill-emerald-500/20" /> Verified Student
              </div>

              <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-1.5 dark:bg-zinc-800/50 ring-1 ring-zinc-200/50 dark:ring-white/5 shadow-soft">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 leading-none">Vibe Points</p>
                    <p className="text-sm font-black text-zinc-900 dark:text-white line-height-1">
                      {Number((userData as any)?.vibePoints ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-1.5 dark:bg-zinc-800/50 ring-1 ring-zinc-200/50 dark:ring-white/5 shadow-soft">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Coins size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 leading-none">UniCoins</p>
                    <p className="text-sm font-black text-zinc-900 dark:text-white line-height-1">
                      {Number((userData as any)?.uniCoins ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Profile Details</label>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-80"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
          
          <Card className={`${isEditing ? 'space-y-4' : 'p-0 overflow-hidden'}`}>
            {isEditing ? (
              <>
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
                        onClick={() => {
                          const nextAvatars = getAvatarOptionsByGender(g);
                          setProfileForm((prev) => ({
                            ...prev,
                            gender: g,
                            photoURL: nextAvatars.includes(prev.photoURL) ? prev.photoURL : nextAvatars[0],
                          }));
                        }}
                        className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${profileForm.gender === g ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {profileForm.gender && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Choose Avatar</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {avatarOptions.map((avatar) => (
                        <button
                          key={avatar}
                          onClick={() => setProfileForm((prev) => ({ ...prev, photoURL: avatar }))}
                          className={`h-16 w-16 mx-auto shrink-0 overflow-hidden rounded-full border-2 transition-all ${profileForm.photoURL === avatar ? 'border-primary ring-2 ring-primary/30' : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'}`}
                        >
                          <img src={avatar} alt="avatar option" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Department</label>
                  <select
                    className="w-full rounded-card border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Academic Year</label>
                  <div className="flex flex-wrap gap-2">
                    {ACADEMIC_YEARS.map((y) => (
                      <button
                        key={y}
                        onClick={() => setProfileForm((prev) => ({ ...prev, year: y }))}
                        className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${profileForm.year === y ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Looking For</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LOOKING_FOR.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setProfileForm((prev) => ({ ...prev, lookingFor: item.value }))}
                        className={`rounded-card border p-3 text-center text-sm font-medium transition-colors ${profileForm.lookingFor === item.value ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400'}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Bio</label>
                  <textarea
                    placeholder="Share a bit about yourself..."
                    className="h-24 w-full rounded-card border border-zinc-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-900"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                  />
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Interests (select at least 5)</label>
                  <div className="max-h-64 space-y-4 overflow-y-auto pr-2">
                    {Object.entries(INTEREST_CATEGORIES).map(([catId, catInfo]) => (
                      <div key={catId}>
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">{catId}</h4>
                        <div className="flex flex-wrap gap-2">
                          {catInfo.interests.map((interest) => {
                            const isSelected = profileForm.interests[catId]?.includes(interest);
                            return (
                              <button
                                key={interest}
                                onClick={() => toggleInterest(catId, interest)}
                                className={`rounded-pill px-3 py-1.5 text-xs font-semibold transition-all ${isSelected ? 'bg-primary text-white ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-950' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
                              >
                                {interest}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleProfileSave} isLoading={savingProfile}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Details
                  </Button>
                </div>
              </>
            ) : (
              <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                <div className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Bio</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 italic">
                    {userData?.bio || "No bio set yet. Click Edit Profile to tell others about yourself!"}
                  </p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-zinc-50 dark:divide-zinc-800">
                  <div className="p-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Looking For</p>
                    <p className="text-xs font-bold text-primary">{userData?.lookingFor || "N/A"}</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Interests</p>
                    <p className="text-xs font-bold">{Object.values(userData?.interests || {}).flat().length} Selected</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full py-4 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors"
                >
                  Edit Profile Details
                </button>
              </div>
            )}
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
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex w-full items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <Eye size={20} className="text-zinc-500" />
                <span className="text-sm font-bold">View My Profile</span>
              </div>
              <ChevronRight size={20} className="text-zinc-300" />
            </button>
            <button className="flex w-full items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-zinc-500" />
                <span className="text-sm font-bold">Notifications</span>
              </div>
              <ChevronRight size={20} className="text-zinc-300" />
            </button>
            <button
              onClick={handleInstallApp}
              className="flex w-full items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <Download size={20} className="text-zinc-500" />
                <span className="text-sm font-bold">Install App</span>
              </div>
              <ChevronRight size={20} className="text-zinc-300" />
            </button>
            <button
              onClick={() => setIsSafetyCenterOpen(true)}
              className="flex w-full items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-zinc-500" />
                <span className="text-sm font-bold">Safety Center</span>
              </div>
              <ChevronRight size={20} className="text-zinc-300" />
            </button>
            <button
              onClick={() => setIsTermsModalOpen(true)}
              className="flex w-full items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-zinc-500" />
                <span className="text-sm font-bold">Terms & Community Protocol</span>
              </div>
              <ChevronRight size={20} className="text-zinc-300" />
            </button>
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="flex w-full items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <Info size={20} className="text-zinc-500" />
                <span className="text-sm font-bold">About UniVibe</span>
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

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="My Profile Preview"
        maxWidthClass="max-w-3xl"
      >
        <div className="h-[75vh] md:h-[80vh]">
          <ProfileCard user={previewUser} />
        </div>
      </Modal>

      <Modal isOpen={isSafetyCenterOpen} onClose={() => setIsSafetyCenterOpen(false)} title="Safety Center">
        <div className="space-y-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/40">
            <p className="flex items-start gap-2 text-xs font-medium text-amber-800 dark:text-amber-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              If someone makes you uncomfortable, block and report from Discovery/Chat immediately.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold">Quick Safety Controls</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={userData?.isGhostMode ? 'primary' : 'outline'}
                onClick={() => updateSettings('isGhostMode', !userData?.isGhostMode)}
              >
                {userData?.isGhostMode ? 'Ghost Mode: On' : 'Ghost Mode: Off'}
              </Button>
              <Button
                variant={userData?.isProfileLocked ? 'primary' : 'outline'}
                onClick={() => updateSettings('isProfileLocked', !userData?.isProfileLocked)}
              >
                {userData?.isProfileLocked ? 'Profile Locked' : 'Profile Unlocked'}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold">Blocked Users</h3>
            {userData?.blockedUsers?.length ? (
              <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                {userData.blockedUsers.map((uid) => (
                  <div key={uid} className="flex items-center justify-between rounded-xl border border-zinc-200 p-2 dark:border-zinc-700">
                    <span className="truncate text-xs text-zinc-600 dark:text-zinc-300">{uid}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnblock(uid)}
                      isLoading={unblockingUid === uid}
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No blocked users yet.</p>
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} title="THE MANIFESTO">
        <div className="space-y-10 py-6 max-h-[70vh] overflow-y-auto no-scrollbar px-2">
           {/* Hero Branding */}
           <div className="text-center">
              <div className="h-24 w-24 mx-auto bg-gradient-to-tr from-primary to-rose-400 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/30 rotate-6 mb-8 relative">
                 <Sparkles size={48} className="text-white" />
                 <div className="absolute -top-2 -right-2 h-8 w-8 bg-black rounded-full border border-white/10 flex items-center justify-center text-[10px] font-black text-white">3.0</div>
              </div>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">UniVibe</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 mt-3 font-mono">Connecting Campus Frequencies</p>
           </div>

           {/* Core Philosophy */}
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Philosophy</h3>
                 <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed font-medium text-center italic">
                 "In a world of noise, we help you find the frequency that matters."
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed text-center px-4">
                 UniVibe was built on the belief that university life shouldn't be lived through a screen, but *facilitated* by it. We've stripped away the vanity metrics of traditional social media to focus on what actually counts: **Live Presence, Genuine Vibes, and Shared Interests.**
              </p>
           </div>

           {/* Core Pillars */}
           <div className="grid grid-cols-1 gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">The Nexus Pillars</h3>
              {[
                { 
                  title: 'Zero Vanity', 
                  desc: 'No follower counts, no public like totals. Your influence is measured by the quality of your signals.',
                  icon: EyeOff 
                },
                { 
                  title: 'Privacy First', 
                  desc: 'With Ghost Mode and locked identities, you control exactly who sees your pulse and when.',
                  icon: Shield 
                },
                { 
                  title: 'Real Interaction', 
                  desc: 'From Vibe Portals to Arena Battles, every feature is designed to spark a conversation.',
                  icon: MessageCircle 
                }
              ].map((p, i) => (
                <div key={i} className="p-5 rounded-3xl bg-zinc-900/50 border border-white/[0.03] flex gap-5 items-start group hover:bg-zinc-900 transition-all">
                   <div className="h-10 w-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
                      <p.icon size={20} />
                   </div>
                   <div className="flex-1">
                      <h4 className="text-xs font-black uppercase tracking-widest text-white mb-1.5">{p.title}</h4>
                      <p className="text-[10px] font-medium text-zinc-500 leading-normal">{p.desc}</p>
                   </div>
                </div>
              ))}
           </div>

           {/* The Tech Stack */}
           <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                 <Zap size={14} /> System Intel
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Architecture</span>
                    <span className="text-[10px] font-black text-white uppercase">React + RTDB Nexus</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Encryption</span>
                    <span className="text-[10px] font-black text-white uppercase">End-to-End Frequency</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Deployment</span>
                    <span className="text-[10px] font-black text-white uppercase">v3.2.1-Production</span>
                 </div>
              </div>
           </div>

           {/* Footer Credits */}
           <div className="text-center space-y-4 pt-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
                 Designed for the next generation of campus leaders.
              </p>
              <div className="flex justify-center gap-6 opacity-30">
                 <span className="h-1 w-1 rounded-full bg-white" />
                 <span className="h-1 w-1 rounded-full bg-white" />
                 <span className="h-1 w-1 rounded-full bg-white" />
              </div>
              <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">
                 © 2026 UniVibe Studio · All Rights Reserved
              </p>
           </div>
        </div>
      </Modal>

      <Modal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} title="COMMUNITY PROTOCOL">
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto no-scrollbar px-2">
           <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Notice of Compliance</p>
              <p className="text-xs text-zinc-300 leading-relaxed italic">
                 By accessing the UniVibe frequency, you agree to the following campus safety standards and legal frameworks.
              </p>
           </div>

           <div className="space-y-8">
              <section className="space-y-3">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-500" /> 01. Verified Entry
                 </h4>
                 <p className="text-xs text-zinc-500 leading-relaxed">
                    UniVibe is a closed-circuit network. Only verified **university emails** (@diu.edu.bd) are permitted. This ensures community safety and prevents outsider intrusion, automated spam, or external harassment.
                 </p>
              </section>

              <section className="space-y-3">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <Shield size={14} className="text-primary" /> 02. The Guardian Protocol
                 </h4>
                 <p className="text-xs text-zinc-500 leading-relaxed">
                    Your data is yours. All messages are **end-to-end encrypted**. The UniVibe administration does not access, use, or sell personal data for commercial purposes. Your contact info (email/number) is strictly hidden and only decrypted if a serious violation (harassment, criminal activity) is reported and verified by the safety board.
                 </p>
              </section>

              <section className="space-y-3">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-500" /> 03. Zero Tolerance Code
                 </h4>
                 <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                    <ul className="text-[11px] text-zinc-400 space-y-2 list-disc pl-4 font-medium uppercase tracking-tight">
                       <li>No harassment, bullying, or targeted aggression.</li>
                       <li>No 18+ (Adult), explicit, or NSFW content.</li>
                       <li>No hate speech, discrimination, or tribalism.</li>
                       <li>No solicitation, commercial spam, or fraud.</li>
                       <li>No impersonation of faculty or other students.</li>
                    </ul>
                 </div>
              </section>

              <section className="space-y-3">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" /> 04. Content Rights
                 </h4>
                 <p className="text-xs text-zinc-500 leading-relaxed">
                    You retain ownership of the content you post (signals, polls). However, by posting, you grant UniVibe a non-exclusive, royalty-free license to host and display your content within the platform ecosystem.
                 </p>
              </section>

              <section className="space-y-3">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <Lock size={14} className="text-zinc-400" /> 05. Account Responsibility
                 </h4>
                 <p className="text-xs text-zinc-500 leading-relaxed">
                    You are solely responsible for maintaining the security of your account credentials. Any activity performed through your account is deemed your responsibility. Notify us immediately if you detect unauthorized access.
                 </p>
              </section>

              <section className="space-y-3">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <LogOut size={14} className="text-rose-500" /> 06. Enforcement & Ban
                 </h4>
                 <p className="text-xs text-zinc-500 leading-relaxed">
                    Violating these protocols results in immediate **Signal Termination**. We reserve the right to suspend or permanently delete accounts that harm the community vibe or violate university standards.
                 </p>
              </section>

              <section className="space-y-3">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <Info size={14} className="text-zinc-400" /> 07. Service Continuity
                 </h4>
                 <p className="text-xs text-zinc-500 leading-relaxed">
                    UniVibe is a living platform. We may modify features, uptime availability, or these terms at any time to improve the campus experience.
                 </p>
              </section>
           </div>

           <div className="pt-8 border-t border-white/5 text-center">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-relaxed">
                 High Frequency · High Safety · High Connection
              </p>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
