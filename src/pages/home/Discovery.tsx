import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, Star, RotateCcw, Bell, User as UserIcon, Brain, Flame, Compass, BookHeart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDiscovery } from '@/hooks/useDiscovery';
import { useGamification } from '@/hooks/useGamification';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';
import ProfileCard from '@/components/profile/ProfileCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'react-hot-toast';

const Discovery = () => {
  const { user, userData } = useAuth();
  const { profiles, loading, error, refresh, likeProfile, passProfile } = useDiscovery();
  const {
    daily,
    vibePoints,
    uniCoins,
    completeMission,
    submitPuzzleAnswer,
    unlockPuzzleHint,
    voteBattle,
  } = useGamification();
  const { permission, enableNotifications, notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSlowLoadingHint, setShowSlowLoadingHint] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [mood, setMood] = useState<'all' | 'study' | 'chill' | 'explore' | 'deep'>('all');
  const [puzzleRevealed, setPuzzleRevealed] = useState(false);
  const [puzzleInput, setPuzzleInput] = useState('');

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

  const moodProfiles = React.useMemo(() => {
    if (mood === 'all') return profiles;

    return profiles.filter((profile) => {
      const interests = Object.values(profile.interests || {}).flat().join(' ').toLowerCase();
      const lookingFor = String(profile.lookingFor || '').toLowerCase();

      if (mood === 'study') {
        return lookingFor === 'study' || interests.includes('coding') || interests.includes('reading');
      }
      if (mood === 'chill') {
        return lookingFor === 'friendship' || interests.includes('music') || interests.includes('coffee');
      }
      if (mood === 'explore') {
        return lookingFor === 'networking' || interests.includes('travel') || interests.includes('adventurous');
      }
      return lookingFor === 'relationship' || interests.includes('empathetic') || interests.includes('serious');
    });
  }, [profiles, mood]);

  React.useEffect(() => {
    setCurrentIndex(0);
    setPuzzleRevealed(false);
  }, [mood, profiles.length]);

  const currentProfile = moodProfiles[currentIndex];

  const handleNotificationClick = async () => {
    setIsNotificationsOpen(true);
    await markAllAsRead();

    if (permission === 'granted') return;

    const status = await enableNotifications();
    if (status === 'granted') toast.success('Notifications enabled!');
  };

  const handleMissionComplete = async (missionId: string, alreadyDone: boolean) => {
    if (alreadyDone) {
      toast('Mission already completed today.');
      return;
    }
    await completeMission(missionId);
    toast.success('Mission completed. Vibe Points and UniCoins added!');
  };

  const handlePuzzleSubmit = async () => {
    const result = await submitPuzzleAnswer(puzzleInput);
    if (result.ok) {
      toast.success(result.message);
      setPuzzleRevealed(true);
      setPuzzleInput('');
    } else {
      toast.error(result.message);
    }
  };

  const handleHintUnlock = async () => {
    const result = await unlockPuzzleHint();
    if (result.ok) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleBattleVote = async (side: 'left' | 'right') => {
    if (daily?.battle?.vote) {
      toast('You already voted in today\'s battle.');
      return;
    }
    await voteBattle(side);
    toast.success('Vote submitted. Rewards added!');
  };

  const renderHeader = () => (
    <div className="sticky top-0 z-20 border-b border-zinc-100 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-pink-400">UniVibe</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNotificationClick}
            aria-label="Open notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Bell size={18} />
            {(unreadCount > 0 || permission !== 'granted') && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-white bg-rose-500 dark:border-zinc-900" />
            )}
          </button>

          <button
            onClick={() => navigate('/profile')}
            aria-label="Open profile"
            className="h-10 w-10 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
          >
            {userData?.photoURL || user?.photoURL ? (
              <img src={userData?.photoURL || user?.photoURL || ''} alt="My avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-500 dark:text-zinc-300">
                <UserIcon size={18} />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentProfile) return;

    try {
      if (direction === 'right') {
        const result = await likeProfile(currentProfile);
        if (result.verificationRequired) {
          toast.error('Verify your DIU email first, then try again.');
        } else if (result.requestSent) {
          toast.success(`Request sent to ${currentProfile.name}!`, { icon: '📩' });
        } else if (result.alreadyRequested) {
          toast('Request already pending.', { icon: '⏳' });
        } else if (result.incomingPending) {
          toast('They already requested you. Accept from Matches.', { icon: '💌' });
        } else if (result.alreadyMatched) {
          toast('You are already connected. Open chat from Matches.', { icon: '✅' });
        } else {
          toast.success(`Connection interest saved for ${currentProfile.name}.`, { icon: '❤️' });
        }
      } else {
        await passProfile(currentProfile);
      }

      setCurrentIndex(prev => prev + 1);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'permission-denied') {
        toast.error('Request blocked by permissions. Your email is already verified; refresh session (sign out/in) or publish latest rules.');
      } else {
        toast.error('Could not send request. Please try again.');
      }
      console.error('Swipe action failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        {renderHeader()}
        <div className="mx-auto w-full max-w-6xl p-6">
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
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        {renderHeader()}
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-danger">Oops! Something went wrong</h2>
          <p className="mt-2 text-zinc-600">{error}</p>
          <Button onClick={() => refresh()} className="mt-6">Try Again</Button>
        </div>
      </div>
    );
  }

  if (currentIndex >= moodProfiles.length) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        {renderHeader()}
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
            <RotateCcw className="h-10 w-10 text-zinc-400" />
          </div>
          <h2 className="text-2xl font-black italic text-zinc-400">That's everyone for now!</h2>
          <p className="mt-2 text-zinc-500">Check back later or switch your mood to see more people.</p>
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
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {renderHeader()}

      <div className="relative flex flex-1 flex-col items-center justify-center p-4">
        <div className="mb-4 grid w-full max-w-6xl gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 dark:border-primary/40 dark:bg-primary/10">
            <div className="text-xs font-black uppercase tracking-wider text-primary">Your Power</div>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <p className="text-[11px] text-zinc-500">Vibe Points</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{vibePoints}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-zinc-500">UniCoins</p>
                <p className="text-xl font-black text-primary">{uniCoins}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-2 flex items-center gap-2 text-sm font-black"><BookHeart size={16} /> Daily Missions</div>
            <div className="space-y-2">
              {(daily?.missions || []).map((mission) => (
                <button
                  key={mission.id}
                  onClick={() => handleMissionComplete(mission.id, !!mission.done)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-xs ${mission.done ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}
                >
                  {mission.done ? '✓ ' : ''}{mission.title}
                  <span className="ml-1 text-[10px] opacity-70">+{mission.rewardScore} points / +{mission.rewardCoins} UniCoins</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-2 flex items-center gap-2 text-sm font-black"><Brain size={16} /> Compatibility Puzzle</div>
            {daily?.puzzle ? (
              <>
                <p className="text-xs text-zinc-600 dark:text-zinc-300">{daily.puzzle.question}</p>
                {daily.puzzleSolved ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-600">Solved. +{daily.puzzle.rewardScore} points / +{daily.puzzle.rewardCoins} UniCoins</p>
                ) : (
                  <>
                    <input
                      value={puzzleInput}
                      onChange={(e) => setPuzzleInput(e.target.value)}
                      placeholder="Your answer"
                      className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={handlePuzzleSubmit}>Submit</Button>
                      <Button size="sm" variant="outline" onClick={handleHintUnlock}>Hint (-3 UniCoins)</Button>
                    </div>
                    {daily.hintUnlocked && <p className="mt-2 text-[11px] text-primary">Hint: {daily.puzzle.hint}</p>}
                  </>
                )}
              </>
            ) : (
              <p className="text-xs text-zinc-500">Loading puzzle...</p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-2 flex items-center gap-2 text-sm font-black"><Flame size={16} /> {daily?.battle?.title || 'Campus Battle'}</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleBattleVote('left')} className={`rounded-lg px-2 py-2 text-xs font-bold ${daily?.battle?.vote === 'left' ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>{daily?.battle?.left || 'Tea Person'}</button>
              <button onClick={() => handleBattleVote('right')} className={`rounded-lg px-2 py-2 text-xs font-bold ${daily?.battle?.vote === 'right' ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>{daily?.battle?.right || 'Coffee Person'}</button>
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">Vote reward: +{daily?.battle?.rewardScore || 10} points / +{daily?.battle?.rewardCoins || 1} UniCoins</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-2 flex items-center gap-2 text-sm font-black"><Compass size={16} /> Mood Discovery</div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'study', label: 'Study' },
                { id: 'chill', label: 'Chill' },
                { id: 'explore', label: 'Explore' },
                { id: 'deep', label: 'Deep Talk' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMood(item.id as typeof mood)}
                  className={`rounded-lg px-2 py-1.5 font-bold ${mood === item.id ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative h-[550px] w-full max-w-[400px] lg:h-[620px] lg:max-w-[460px]">
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

      <Modal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        title="Notifications"
      >
        <div className="space-y-4">
          {notifications.length > 0 ? (
            <>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.link) {
                        navigate(item.link);
                        setIsNotificationsOpen(false);
                      }
                    }}
                    className={`rounded-xl border p-3 ${
                      item.isRead
                        ? 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60'
                        : 'border-pink-200 bg-pink-50 dark:border-pink-900/60 dark:bg-pink-950/30'
                    } ${item.link ? 'w-full text-left hover:border-primary/40' : 'w-full text-left'}`}
                  >
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{item.body}</p>
                    <p className="mt-2 text-[11px] text-zinc-400">{new Date(item.receivedAt).toLocaleString()}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={clearNotifications}>Clear All</Button>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-700 dark:bg-zinc-800/60">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">No notifications yet.</p>
              <p className="mt-1 text-xs text-zinc-500">When someone sends an update, it will show up here.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Discovery;
