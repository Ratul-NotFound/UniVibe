import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Shield, CheckCircle, AlertTriangle, LogOut, Info, Sparkles, Lock } from 'lucide-react';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Domain check
    if (!email.endsWith('@diu.edu.bd')) {
      toast.error('Only @diu.edu.bd emails are allowed!');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!agreedToTerms) {
      toast.error('You must agree to the Community Protocol');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update basic profile
      await updateProfile(user, { displayName: name });

      // Send verification email
      await sendEmailVerification(user);

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        isVerified: false,
        onboarded: false,
        role: 'user',
        isBanned: false,
        dailyRequestCount: 0,
        vibePoints: 0,
        uniCoins: 15,
        interests: {},
        createdAt: serverTimestamp(),
      });

      toast.success('Registration successful! Please verify your email.');
      navigate('/verify-email');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 py-8 sm:py-12 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-primary">UniVibe</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Join the DIU student community</p>
        </div>

        <Card>
          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="DIU Email"
              type="email"
              placeholder="name@diu.edu.bd"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-start gap-3 py-2">
                <button 
                  type="button"
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className={`mt-1 h-5 w-5 rounded border transition-all flex items-center justify-center shrink-0 ${agreedToTerms ? 'bg-primary border-primary text-white' : 'border-zinc-300 dark:border-zinc-800'}`}
                >
                  {agreedToTerms && <CheckCircle size={12} className="fill-current" />}
                </button>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                   I have read and agree to the <Link to="/terms" className="text-primary hover:underline">Community Protocol</Link> regarding security and behavior.
                </p>
             </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Already have an account? </span>
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </div>
        </Card>
      </motion.div>

       <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="COMMUNITY PROTOCOL">
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
                    You are solely responsible for maintaining the security of your account credentials. Any activity performed through your account is deemed your responsibility.
                 </p>
              </section>

              <section className="space-y-3">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <LogOut size={14} className="text-rose-500" /> 06. Enforcement & Ban
                 </h4>
                 <p className="text-xs text-zinc-500 leading-relaxed">
                    Violating these protocols results in immediate **Signal Termination**. We reserve the right to suspend or permanently delete accounts that harm the community vibe.
                 </p>
              </section>
           </div>

           <div className="pt-6 border-t border-white/5 text-center">
              <Button onClick={() => { setShowTerms(false); setAgreedToTerms(true); }} className="w-full text-[10px] font-black uppercase tracking-widest">
                 I Understand & Agree
              </Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Signup;
