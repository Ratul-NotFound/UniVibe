import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Key, RefreshCw } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error sending password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-primary">UniVibe</h1>
        </div>

        <Card>
          {!sent ? (
            <>
              <div className="mb-6 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Key className="h-6 w-6" />
                </div>
              </div>

              <h2 className="mb-2 text-center text-2xl font-bold">Forgot password?</h2>
              <p className="mb-6 text-center text-zinc-600 dark:text-zinc-400">
                No worries, we'll send you reset instructions.
              </p>

              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="name@diu.edu.bd"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" className="w-full" isLoading={loading}>
                  Reset Password
                </Button>
              </form>
            </>
          ) : (
            <div className="py-4 text-center">
              <div className="mb-6 flex justify-center text-success">
                <RefreshCw className="h-12 w-12 animate-pulse" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">Check your email</h2>
              <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                We've sent a password reset link to <span className="font-semibold">{email}</span>.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSent(false)}
              >
                Try another email
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-semibold text-zinc-600 hover:text-primary dark:text-zinc-400"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
