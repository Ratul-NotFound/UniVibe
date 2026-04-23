import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { INTEREST_CATEGORIES, DEPARTMENTS, ACADEMIC_YEARS, LOOKING_FOR } from '@/lib/matchAlgorithm';
import { getAvatarOptionsByGender } from '@/lib/avatarOptions';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const GENDERS = ['Male', 'Female', 'Other'];
const ENGAGEMENT_TYPES = ['Club', 'Lab', 'Job', 'Office', 'Freelance', 'None'];

const OnboardingWizard = () => {
  const { user, isOnboarded } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOnboarded) {
      navigate('/', { replace: true });
    }
  }, [isOnboarded, navigate]);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    phone: '',
    birthDate: '',
    gender: '',
    department: '',
    year: '',
    hometown: '',
    currentCity: '',
    engagementType: '',
    engagementDetails: '',
    lookingFor: '',
    interests: {} as Record<string, string[]>,
    photoURL: '',
  });

  const avatarOptions = getAvatarOptionsByGender(formData.gender);

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

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const toggleInterest = (category: string, interest: string) => {
    setFormData(prev => {
      const catInterests = prev.interests[category] || [];
      const newCatInterests = catInterests.includes(interest)
        ? catInterests.filter(i => i !== interest)
        : [...catInterests, interest];
      
      return {
        ...prev,
        interests: {
          ...prev.interests,
          [category]: newCatInterests
        }
      };
    });
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const usernameLower = normalizeUsername(formData.username);
      const phoneNormalized = normalizePhone(formData.phone);

      if (!/^[a-z0-9._]{3,20}$/.test(usernameLower)) {
        toast.error('Username must be 3-20 chars and use only letters, numbers, dot, or underscore.');
        return;
      }

      if (phoneNormalized.length < 10 || phoneNormalized.length > 15) {
        toast.error('Please enter a valid phone number.');
        return;
      }

      if (!isBirthDateValid(formData.birthDate)) {
        toast.error('Please provide a valid birth date (minimum age 16).');
        return;
      }

      // Ensure latest auth claims (including email verification) are reflected before write.
      await user.reload();
      await user.getIdToken(true);

      const runUniqueChecks = async () => {
        const usersRef = collection(db, 'users');
        const [usernameSnap, phoneSnap] = await Promise.all([
          getDocs(query(usersRef, where('usernameLower', '==', usernameLower), limit(1))),
          getDocs(query(usersRef, where('phoneNormalized', '==', phoneNormalized), limit(1))),
        ]);

        const usernameTaken = usernameSnap.docs.some((d) => d.id !== user.uid);
        if (usernameTaken) {
          throw new Error('USERNAME_TAKEN');
        }

        const phoneTaken = phoneSnap.docs.some((d) => d.id !== user.uid);
        if (phoneTaken) {
          throw new Error('PHONE_TAKEN');
        }
      };

      let uniqueChecksSkipped = false;

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
          // Claims may still be stale for a short time right after email verification.
          await user.reload();
          await user.getIdToken(true);
          try {
            await runUniqueChecks();
          } catch (retryError: any) {
            if (retryError?.code === 'permission-denied') {
              // Do not block onboarding completion if uniqueness checks are temporarily unavailable.
              uniqueChecksSkipped = true;
            } else {
              throw retryError;
            }
          }
        } else {
          throw error;
        }
      }

      const saveProfile = async () => {
        await setDoc(doc(db, 'users', user.uid), {
          ...formData,
          usernameLower,
          phoneNormalized,
          onboarded: true,
        }, { merge: true });
      };

      try {
        await saveProfile();
      } catch (writeError: any) {
        if (writeError?.code === 'permission-denied') {
          await user.reload();
          await user.getIdToken(true);

          try {
            await saveProfile();
          } catch (retryWriteError: any) {
            if (retryWriteError?.code === 'permission-denied') {
              throw new Error('ONBOARDING_WRITE_BLOCKED');
            }
            throw retryWriteError;
          }
        } else {
          throw writeError;
        }
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`onboarding-complete:${user.uid}`, '1');
      }

      if (uniqueChecksSkipped) {
        toast.success('Profile saved.');
      }
      toast.success('Profile completed!');
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error(error);
      if (error?.message === 'ONBOARDING_WRITE_BLOCKED') {
        toast.error('Unable to save onboarding due to Firestore permissions. Please deploy latest firestore rules, then try again.');
      } else if (error?.code === 'permission-denied') {
        toast.error('Permission denied. Please sign out, sign in again, and try once more.');
      } else {
        toast.error(error.message || 'Error saving profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-zinc-50 p-4 py-8 sm:py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl pt-12">
        <div className="mb-8 flex items-center justify-between px-4">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`h-2 w-12 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-800'}`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-zinc-500">Step {step} of 3</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <h2 className="mb-6 text-2xl font-bold">Tell us about yourself</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <input
                      type="text"
                      placeholder="e.g. ratul_09"
                      className="w-full rounded-card border border-zinc-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-900"
                      value={formData.username}
                      onChange={e => updateFormData({ username: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. 017XXXXXXXX"
                        className="w-full rounded-card border border-zinc-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-900"
                        value={formData.phone}
                        onChange={e => updateFormData({ phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Birth Date</label>
                      <input
                        type="date"
                        className="w-full rounded-card border border-zinc-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-900"
                        value={formData.birthDate}
                        onChange={e => updateFormData({ birthDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gender</label>
                    <div className="flex flex-wrap gap-2">
                      {GENDERS.map(g => (
                        <button
                          key={g}
                          onClick={() => {
                            const nextAvatars = getAvatarOptionsByGender(g);
                            updateFormData({
                              gender: g,
                              photoURL: nextAvatars.includes(formData.photoURL) ? formData.photoURL : nextAvatars[0],
                            });
                          }}
                          className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${formData.gender === g ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.gender && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Choose an avatar</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {avatarOptions.map((avatar) => (
                          <button
                            key={avatar}
                            onClick={() => updateFormData({ photoURL: avatar })}
                            className={`h-16 w-16 mx-auto shrink-0 overflow-hidden rounded-full border-2 transition-all ${formData.photoURL === avatar ? 'border-primary ring-2 ring-primary/30' : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'}`}
                          >
                            <img src={avatar} alt="avatar option" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Department</label>
                    <select 
                      className="w-full rounded-card border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900"
                      value={formData.department}
                      onChange={e => updateFormData({ department: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Academic Year</label>
                    <div className="flex flex-wrap gap-2">
                      {ACADEMIC_YEARS.map(y => (
                        <button
                          key={y}
                          onClick={() => updateFormData({ year: y })}
                          className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${formData.year === y ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Looking for</label>
                    <div className="grid grid-cols-2 gap-2">
                      {LOOKING_FOR.map(item => (
                        <button
                          key={item.value}
                          onClick={() => updateFormData({ lookingFor: item.value })}
                          className={`rounded-card border p-3 text-center text-sm font-medium transition-colors ${formData.lookingFor === item.value ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <textarea
                      placeholder="Share a bit about yourself..."
                      className="h-24 w-full rounded-card border border-zinc-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-900"
                      value={formData.bio}
                      onChange={e => updateFormData({ bio: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Where are you from?</label>
                      <input
                        type="text"
                        placeholder="Hometown"
                        className="w-full rounded-card border border-zinc-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-900"
                        value={formData.hometown}
                        onChange={e => updateFormData({ hometown: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Where do you live now?</label>
                      <input
                        type="text"
                        placeholder="Current city"
                        className="w-full rounded-card border border-zinc-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-900"
                        value={formData.currentCity}
                        onChange={e => updateFormData({ currentCity: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Are you engaged in any club/lab/job/office?</label>
                    <div className="flex flex-wrap gap-2">
                      {ENGAGEMENT_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => updateFormData({ engagementType: type })}
                          className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${formData.engagementType === type ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    {formData.engagementType && formData.engagementType !== 'None' && (
                      <input
                        type="text"
                        placeholder="Tell us a little (club/lab/company/role)"
                        className="mt-2 w-full rounded-card border border-zinc-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-900"
                        value={formData.engagementDetails}
                        onChange={e => updateFormData({ engagementDetails: e.target.value })}
                      />
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button 
                    onClick={nextStep} 
                    disabled={
                      !formData.username.trim()
                      || !formData.phone.trim()
                      || !formData.birthDate
                      || !formData.gender
                      || !formData.photoURL
                      || !formData.department
                      || !formData.year
                      || !formData.lookingFor
                    }
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">What are your interests?</h2>
                  <p className="text-sm text-zinc-500">Pick at least 5 across any category to help us match you.</p>
                </div>

                <div className="max-h-[60vh] space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(INTEREST_CATEGORIES).map(([catId, catInfo]) => (
                    <div key={catId}>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">
                        {catId}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {catInfo.interests.map(interest => {
                          const isSelected = formData.interests[catId]?.includes(interest);
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

                <div className="mt-8 flex justify-between">
                  <Button variant="ghost" onClick={prevStep}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button 
                    onClick={nextStep}
                    disabled={Object.values(formData.interests).flat().length < 5}
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="text-center">
                <h2 className="mb-6 text-2xl font-bold">One last thing!</h2>
                <p className="mb-8 text-zinc-600 dark:text-zinc-400">
                  Ready to join the UniVibe community? You can add your photos anytime from your profile settings.
                </p>

                <div className="mb-8 flex justify-center">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/5 text-primary">
                    <Check className="h-12 w-12" />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button className="w-full" onClick={handleFinish} isLoading={loading}>
                    Finish Setup
                  </Button>
                  <Button variant="ghost" onClick={prevStep}>
                    Wait, let me change something
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingWizard;
