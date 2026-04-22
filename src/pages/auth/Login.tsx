import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, hasKeys } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const Login = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      const code = String(error?.code || '');
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        toast.error('Invalid email or password. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Try again in a few minutes.');
      } else {
        toast.error(error.message || 'Unable to sign in right now.');
      }
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
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Welcome back, student!</p>
        </div>

        {!hasKeys && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-2xl bg-amber-500/10 p-4 text-amber-600 dark:bg-amber-500/5 text-xs font-semibold border border-amber-500/20"
          >
            <AlertCircle className="shrink-0" size={18} />
            <p>
              <strong>UI Preview Mode:</strong> Firebase keys are missing. Authenticated actions are disabled, but you can explore the design.
            </p>
          </motion.div>
        )}

        <Card>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="DIU Email"
              type="email"
              placeholder="name@diu.edu.bd"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-zinc-500 hover:text-primary dark:text-zinc-400"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button type="submit" className="w-full" isLoading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">New to UniVibe? </span>
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
