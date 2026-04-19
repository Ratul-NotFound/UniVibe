import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, Star, RotateCcw, Info } from 'lucide-react';
import { useDiscovery } from '@/hooks/useDiscovery';
import ProfileCard from '@/components/profile/ProfileCard';
import { Button } from '@/components/ui/Button';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'react-hot-toast';

const Discovery = () => {
  const { profiles, loading, error, refresh, likeProfile, passProfile } = useDiscovery();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSlowLoadingHint, setShowSlowLoadingHint] = useState(false);

  React.useEffect(() => {
    if (!loading) {
      setShowSlowLoadingHint(false);
      return;
    }

    const timer = setTimeout(() => setShowSlowLoadingHint(true), 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Motion values for swipe gestures
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

  const currentProfile = profiles[currentIndex];

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentProfile) return;

    if (direction === 'right') {
      const result = await likeProfile(currentProfile);
      if (result.isMatch) {
        toast.success(`It's a match with ${currentProfile.name}!`, { icon: '🎉' });
      } else {
        toast.success(`Liked ${currentProfile.name}!`, { icon: '❤️' });
      }
    } else {
      await passProfile(currentProfile);
    }

    setCurrentIndex(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 p-6 dark:bg-zinc-950">
        <div className="mb-8 flex items-center justify-between">
           <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
           <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="mx-auto w-full max-w-[400px]">
           <ProfileSkeleton />
           <div className="mt-12 flex justify-center gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-14 w-14 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-900" />)}
           </div>
           {showSlowLoadingHint && (
            <div className="mt-8 text-center">
              <p className="text-xs text-zinc-500">Still loading profiles. You can refresh now.</p>
              <Button onClick={() => refresh()} variant="outline" className="mt-3">Retry Loading</Button>
            </div>
           )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-danger">Oops! Something went wrong</h2>
        <p className="mt-2 text-zinc-600">{error}</p>
        <Button onClick={() => refresh()} className="mt-6">Try Again</Button>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-950">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
          <RotateCcw className="h-10 w-10 text-zinc-400" />
        </div>
        <h2 className="text-2xl font-black italic text-zinc-400">That's everyone for now!</h2>
        <p className="mt-2 text-zinc-500">Check back later or change your filters to see more people.</p>
        <Button
          onClick={async () => {
            await refresh();
            setCurrentIndex(0);
          }}
          variant="outline"
          className="mt-8"
        >
          Refresh List
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-black tracking-tighter text-primary">UniVibe</h1>
        <Button variant="ghost" size="icon">
          <Info className="h-5 w-5 text-zinc-400" />
        </Button>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center p-4">
        <div className="relative h-[550px] w-full max-w-[400px]">
          <AnimatePresence>
            <motion.div
              key={currentProfile.id}
              style={{ x, rotate, opacity }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) handleSwipe('right');
                else if (info.offset.x < -100) handleSwipe('left');
              }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              {/* Swipe indicators */}
              <motion.div style={{ opacity: likeOpacity }} className="absolute left-8 top-10 z-50 rounded-lg border-4 border-green-500 bg-white/10 px-4 py-2 text-3xl font-black uppercase tracking-widest text-green-500 backdrop-blur-sm -rotate-12">
                Like
              </motion.div>
              <motion.div style={{ opacity: nopeOpacity }} className="absolute right-8 top-10 z-50 rounded-lg border-4 border-red-500 bg-white/10 px-4 py-2 text-3xl font-black uppercase tracking-widest text-red-500 backdrop-blur-sm rotate-12">
                Nope
              </motion.div>

              <ProfileCard user={currentProfile} matchScore={currentProfile.matchScore} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex items-center justify-center gap-4">
          <button 
            onClick={() => handleSwipe('left')}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-rose-500 shadow-xl transition-transform active:scale-90 dark:bg-zinc-900"
          >
            <X size={28} />
          </button>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-secondary shadow-xl transition-transform active:scale-90 dark:bg-zinc-900">
            <Star size={20} fill="currentColor" />
          </button>
          <button 
            onClick={() => handleSwipe('right')}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-500 shadow-xl transition-transform active:scale-95 dark:bg-zinc-900"
          >
            <Heart size={32} fill="currentColor" />
          </button>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-amber-500 shadow-xl transition-transform active:scale-90 dark:bg-zinc-900">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Discovery;
