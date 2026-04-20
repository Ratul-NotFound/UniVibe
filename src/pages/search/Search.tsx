import React, { useState, useEffect, useMemo } from 'react';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react';
import { collection, query, getDocs, limit, orderBy, startAfter, documentId, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { calculateMatchScore, DEPARTMENTS, ACADEMIC_YEARS, LOOKING_FOR } from '@/lib/matchAlgorithm';
import ProfileGrid from '@/components/profile/ProfileGrid';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';


const Search = () => {
  const { user, userData } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
    if (!user || !userData) {
      setProfiles([]);
      setLoading(false);
      return;
    }

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedLookingFor, setSelectedLookingFor] = useState('');

      const fetched: any[] = [];

      const pageSize = 200;
      const maxDocsToScan = 2000;
      let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
      let shouldContinue = true;

      while (shouldContinue && fetched.length < maxDocsToScan) {
        const q = lastDoc
          ? query(usersRef, orderBy(documentId()), startAfter(lastDoc), limit(pageSize))
          : query(usersRef, orderBy(documentId()), limit(pageSize));

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          break;
        }

        lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        shouldContinue = querySnapshot.size === pageSize;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const isExcluded =
            !!data.isProfileLocked ||
            !!data.isBanned ||
            (userData.blockedUsers || []).includes(doc.id) ||
            (data.blockedUsers || []).includes(user.uid);

          if (!isExcluded) {
            const matchResult = calculateMatchScore(userData, data);
            fetched.push({
              id: doc.id,
              ...data,
              matchScore: Number.isFinite(matchResult.score) ? matchResult.score : 0,
            });
          }
        });
      }
    try {
            id: doc.id,
            ...data,
      fetched.sort((a, b) => {
        const scoreDiff = (b.matchScore || 0) - (a.matchScore || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
          });
        }
      });

      // Keep the broad result set in memory, then apply local filters instantly.
      fetched.sort((a, b) => b.matchScore - a.matchScore);
      setProfiles(fetched);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrowsingProfiles();
  }, [user, userData]);

  const filteredProfiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return profiles.filter((p) => {
      const matchesSearch =
        !term ||
        (p.name || '').toLowerCase().includes(term) ||
        (p.username || '').toLowerCase().includes(term) ||
        (p.usernameLower || '').toLowerCase().includes(term) ||
        (p.department || '').toLowerCase().includes(term) ||
        (p.hometown || '').toLowerCase().includes(term) ||
        (p.currentCity || '').toLowerCase().includes(term);

      const matchesYear = !selectedYear || p.year === selectedYear;
      const matchesLookingFor = !selectedLookingFor || p.lookingFor === selectedLookingFor;
      const matchesDept = !selectedDept || p.department === selectedDept;

      const isCurrentUser = p.id === user?.uid;
      const allowSelfResult = !isCurrentUser || (term.length > 0 && matchesSearch);

      return allowSelfResult && matchesSearch && matchesYear && matchesLookingFor && matchesDept;
    });
  }, [profiles, searchTerm, selectedYear, selectedLookingFor, selectedDept, user?.uid]);
          Search shows all active accounts except blocked, locked, or banned profiles.
  return (
    <div className="min-h-screen bg-white p-4 dark:bg-zinc-950">
      <div className="mb-6 flex flex-col gap-4">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Browse</h1>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Only completed profiles are shown in search results.
        </p>
        
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

        {isFilterOpen && (
          <div className="space-y-4 rounded-card border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Academic Year</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedYear('')}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${!selectedYear ? 'bg-primary text-white' : 'bg-white text-zinc-500 dark:bg-zinc-800'}`}
                >
                  Any
                </button>
                {ACADEMIC_YEARS.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${selectedYear === year ? 'bg-primary text-white' : 'bg-white text-zinc-500 dark:bg-zinc-800'}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Looking For</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedLookingFor('')}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${!selectedLookingFor ? 'bg-primary text-white' : 'bg-white text-zinc-500 dark:bg-zinc-800'}`}
                >
                  Any
                </button>
                {LOOKING_FOR.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSelectedLookingFor(item.value)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${selectedLookingFor === item.value ? 'bg-primary text-white' : 'bg-white text-zinc-500 dark:bg-zinc-800'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedDept('');
                  setSelectedYear('');
                  setSelectedLookingFor('');
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-card bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      ) : filteredProfiles.length > 0 ? (
        <ProfileGrid profiles={filteredProfiles} onProfileClick={(p) => console.log(p)} />
      ) : (
        <div className="mt-20 text-center">
          <p className="text-zinc-500 font-medium">No students found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Search;
