import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { LogOut, Mail, RefreshCw } from 'lucide-react';

const VerifyEmail = () => {
  const { user, isVerified } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isVerified) {
      // Already verified — go straight to onboarding (not /, which
      // would just bounce back to /onboarding anyway if not yet onboarded).
      navigate('/onboarding');
    }
  }, [isVerified, navigate]);

  const handleResend = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await sendEmailVerification(user);
      toast.success('Verification email sent!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error sending email');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  const handleIHaveVerified = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await user.reload();
      await user.getIdToken(true);

      if (user.emailVerified) {
        await setDoc(doc(db, 'users', user.uid), { isVerified: true }, { merge: true });
        toast.success('Email verified! Let\'s set up your profile.');
        navigate('/onboarding');
      } else {
        toast.error('Email is not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Could not refresh verification status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 py-8 sm:py-12 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-primary">UniVibe</h1>
        </div>

        <Card className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h2 className="mb-2 text-2xl font-bold">Verify your email</h2>
          <p className="mb-8 text-zinc-600 dark:text-zinc-400">
            We've sent a verification link to <span className="font-semibold text-zinc-900 dark:text-zinc-100">{user?.email}</span>. 
            Please check your inbox and follow the instructions to continue.
          </p>

          <div className="space-y-3">
            <Button
              className="w-full"
              variant="primary"
              onClick={handleIHaveVerified}
              isLoading={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              I've verified my email
            </Button>

            <Button
              className="w-full"
              variant="outline"
              onClick={handleResend}
              isLoading={loading}
            >
              Resend verification email
            </Button>

            <Button
              className="w-full"
              variant="ghost"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400">
            Note: It might take a few minutes for the email to arrive. Don't forget to check your spam folder!
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
