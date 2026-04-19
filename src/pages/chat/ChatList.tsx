import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useMatches } from '@/hooks/useMatches';
import { Search, MessageCircle, User, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';

const ChatListItem = ({ match }: { match: any }) => {
  const [otherUser, setOtherUser] = useState<any>(match.otherUser || null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOtherUser = async () => {
      if (match.otherUser) {
        setOtherUser(match.otherUser);
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', match.otherUserId));
      if (userDoc.exists()) {
        setOtherUser(userDoc.data());
      }
    };
    fetchOtherUser();
  }, [match.otherUserId, match.otherUser]);

  if (!otherUser) return (
    <div className="flex animate-pulse items-center gap-4 px-6 py-4">
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
      className="flex cursor-pointer items-center gap-4 px-6 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
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
        {/* Unread indicator placeholder */}
        <div className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-primary dark:border-zinc-950" />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 dark:text-white">{otherUser.name}</h3>
          <span className="text-[10px] text-zinc-400">2m ago</span>
        </div>
        <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
          {otherUser.username ? `@${otherUser.username}` : 'Click here to send a message...'}
        </p>
      </div>
    </div>
  );
};

const ChatList = () => {
  const { matches, loading } = useMatches();
  const [searchTerm, setSearchTerm] = useState('');
  const filteredMatches = matches.filter((match) => {
    const other = match.otherUser || {};
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      (other.name || '').toLowerCase().includes(term)
      || (other.username || '').toLowerCase().includes(term)
      || (other.department || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="p-6 pb-2">
        <h1 className="mb-6 text-3xl font-black text-zinc-900 dark:text-white">Messages</h1>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input 
            placeholder="Search messages..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-2 flex flex-col divide-y divide-zinc-50 dark:divide-zinc-900">
        {loading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-card bg-zinc-50 dark:bg-zinc-900" />)}
          </div>
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map(match => (
            <ChatListItem key={match.id} match={match} />
          ))
        ) : (
          <div className="mt-20 flex flex-col items-center p-6 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 text-zinc-300 dark:bg-zinc-900">
              <MessageCircle size={40} />
            </div>
            <h2 className="text-xl font-bold">No active chats</h2>
            <p className="mt-2 max-w-[250px] text-sm text-zinc-500">
              Matches will show up here as soon as you connect with someone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
