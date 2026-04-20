import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useMatches } from '@/hooks/useMatches';
import { useAuth } from '@/context/AuthContext';
import { MessageCircle, Heart, User, ChevronRight, Mail, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

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
  const {
    matches,
    incomingRequests,
    outgoingRequests,
    loading,
    acceptRequest,
    declineRequest,
    cancelRequest,
  } = useMatches();

  const handleAccept = async (item: any) => {
    try {
      await acceptRequest(item);
      toast.success('Request accepted. You can now chat.');
    } catch (error) {
      console.error('Accept action failed:', error);
      toast.error('Could not accept request. Please try again.');
    }
  };

  const handleDecline = async (item: any) => {
    try {
      await declineRequest(item);
      toast('Request declined.');
    } catch (error) {
      console.error('Decline action failed:', error);
      toast.error('Could not decline request. Please try again.');
    }
  };

  const handleCancel = async (item: any) => {
    try {
      await cancelRequest(item);
      toast('Request cancelled.');
    } catch (error) {
      console.error('Cancel action failed:', error);
      toast.error('Could not cancel request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 dark:bg-zinc-950">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Matches</h1>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {matches.length} Mutual
        </div>
      </div>

      {!loading && incomingRequests.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-zinc-500">Incoming Requests</h2>
          <div className="space-y-3">
            {incomingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    {req.otherUser?.photoURL ? (
                      <img src={req.otherUser.photoURL} alt={req.otherUser?.name || 'User'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-400"><Mail size={18} /></div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{req.otherUser?.name || req.fromName || 'Student'}</p>
                    <p className="text-xs text-zinc-500">wants to connect with you</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleDecline(req)}><X size={14} className="mr-1" />Decline</Button>
                  <Button size="sm" onClick={() => handleAccept(req)}><Check size={14} className="mr-1" />Accept</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && outgoingRequests.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-zinc-500">Sent Requests</h2>
          <div className="space-y-3">
            {outgoingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                  <p className="text-sm font-bold">{req.otherUser?.name || 'Student'}</p>
                  <p className="text-xs text-zinc-500">Pending acceptance</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleCancel(req)}>Cancel</Button>
              </div>
            ))}
          </div>
        </section>
      )}

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
