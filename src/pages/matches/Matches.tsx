import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useMatches } from '@/hooks/useMatches';
import { useAuth } from '@/context/AuthContext';
import { MessageCircle, Heart, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const MatchItem = ({ match }: { match: any }) => {
  const { user: currentUser } = useAuth();
  const [otherUser, setOtherUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOtherUser = async () => {
      const userDoc = await getDoc(doc(db, 'users', match.otherUserId));
      if (userDoc.exists()) {
        setOtherUser(userDoc.data());
      }
    };
    fetchOtherUser();
  }, [match.otherUserId]);

  if (!otherUser) return (
    <div className="flex animate-pulse items-center gap-4 py-4">
      <div className="h-14 w-14 rounded-full bg-zinc-100 dark:bg-zinc-900" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
    </div>
  );

  return (
    <div 
      onClick={() => navigate(`/chat/${match.chatId}`)}
      className="flex cursor-pointer items-center gap-4 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
    >
      <div className="relative">
        <div className="h-14 w-14 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          {otherUser.photoURL ? (
            <img src={otherUser.photoURL} alt={otherUser.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <User size={24} />
            </div>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary text-[8px] font-black text-white dark:border-zinc-950">
          {match.matchScore}%
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-zinc-900 dark:text-white">{otherUser.name}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {otherUser.department} • {match.commonInterests?.slice(0, 2).join(', ')}
        </p>
      </div>

      <div className="text-zinc-300">
        <ChevronRight size={20} />
      </div>
    </div>
  );
};

const Matches = () => {
  const { matches, loading } = useMatches();

  return (
    <div className="min-h-screen bg-white p-6 dark:bg-zinc-950">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Matches</h1>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {matches.length} Mutual
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-card bg-zinc-50 dark:bg-zinc-900" />)}
        </div>
      ) : matches.length > 0 ? (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {matches.map(match => (
            <MatchItem key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="mt-20 flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 text-zinc-300 dark:bg-zinc-900">
            <Heart size={40} />
          </div>
          <h2 className="text-xl font-bold">No matches yet</h2>
          <p className="mt-2 max-w-[250px] text-sm text-zinc-500">
            Keep swiping! Your connections from DIU are waiting for you.
          </p>
          <Button className="mt-8" onClick={() => window.location.href = '/'}>
            Start Discovery
          </Button>
        </div>
      )}
    </div>
  );
};

export default Matches;
