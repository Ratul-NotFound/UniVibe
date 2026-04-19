import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { calculateMatchScore, DEPARTMENTS } from '@/lib/matchAlgorithm';
import ProfileGrid from '@/components/profile/ProfileGrid';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const Search = () => {
  const { user, userData } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchBrowsingProfiles = async () => {
    if (!user || !userData) return;
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      let q = query(
        usersRef,
        where('isVerified', '==', true),
        limit(40)
      );

      // Apply department filter if selected
      if (selectedDept) {
        q = query(usersRef, where('department', '==', selectedDept), limit(40));
      }

      const querySnapshot = await getDocs(q);
      const fetched: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const isExcluded =
          doc.id === user.uid ||
          !!data.isProfileLocked ||
          !!data.isBanned ||
          (userData.blockedUsers || []).includes(doc.id) ||
          (data.blockedUsers || []).includes(user.uid);

        if (!isExcluded) {
          const matchResult = calculateMatchScore(userData, data);
          fetched.push({
            id: doc.id,
            ...data,
            matchScore: matchResult.score,
          });
        }
      });

      // Simple search client-side
      const filtered = fetched.filter(p => 
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.department || '').toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Sort by match score
      filtered.sort((a, b) => b.matchScore - a.matchScore);
      setProfiles(filtered);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrowsingProfiles();
  }, [user, userData, selectedDept, searchTerm]);

  return (
    <div className="min-h-screen bg-white p-4 dark:bg-zinc-950">
      <div className="mb-6 flex flex-col gap-4">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Browse</h1>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input 
              placeholder="Search by name or department..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Dept Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setSelectedDept('')}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${!selectedDept ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900'}`}
          >
            All
          </button>
          {DEPARTMENTS.slice(0, 6).map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${selectedDept === dept ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900'}`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-card bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      ) : profiles.length > 0 ? (
        <ProfileGrid profiles={profiles} onProfileClick={(p) => console.log(p)} />
      ) : (
        <div className="mt-20 text-center">
          <p className="text-zinc-500 font-medium">No students found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Search;
