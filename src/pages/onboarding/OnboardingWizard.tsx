import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { INTEREST_CATEGORIES, DEPARTMENTS, ACADEMIC_YEARS, LOOKING_FOR } from '@/lib/matchAlgorithm';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const OnboardingWizard = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    bio: '',
    department: '',
    year: '',
    lookingFor: '',
    interests: {} as Record<string, string[]>,
    photoURL: '',
  });

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
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        isOnboarded: true,
      });
      toast.success('Profile completed!');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950">
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
                </div>

                <div className="mt-8 flex justify-end">
                  <Button 
                    onClick={nextStep} 
                    disabled={!formData.department || !formData.year || !formData.lookingFor}
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
