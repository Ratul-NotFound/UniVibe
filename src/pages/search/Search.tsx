import React, { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, SlidersHorizontal, Heart, X, User } from 'lucide-react';
import {
  collection,
  doc,
  documentId,
  getDocs,
  getDoc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { calculateMatchScore, DEPARTMENTS, ACADEMIC_YEARS, LOOKING_FOR } from '@/lib/matchAlgorithm';
import ProfileGrid from '@/components/profile/ProfileGrid';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { createAppNotification } from '@/lib/notifications';
import { toast } from 'react-hot-toast';
import { useSocial } from '@/hooks/useSocial';

const isEligibleDiuSession = (user: { email?: string | null; emailVerified?: boolean } | null) => {
  if (!user?.email) return false;
  return /@diu\.edu\.bd$/i.test(user.email) && user.emailVerified === true;
};

import { useLocation } from 'react-router-dom';

const Search = () => {
  const { user, userData } = useAuth();
  const { connect, pass, actionLoading } = useSocial();
  const location = useLocation();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedLookingFor, setSelectedLookingFor] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  const closeProfileModal = () => {
    if (actionLoading) return;
    setSelectedProfile(null);
  };

  const handleProfilePass = async () => {
    if (!user || !selectedProfile) return;
    await pass(selectedProfile.id);
    setProfiles((prev) => prev.filter((p) => p.id !== selectedProfile.id));
    setSelectedProfile(null);
  };

  const handleProfileConnect = async () => {
    if (!selectedProfile) return;
    const result = await connect(selectedProfile);
    if (result.success) {
      setProfiles((prev) => prev.filter((p) => p.id !== selectedProfile.id));
      setSelectedProfile(null);
    }
  };

  const fetchBrowsingProfiles = async () => {
    if (!user || !userData) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    if (!isEligibleDiuSession(user)) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const fetched: any[] = [];

      const pageSize = 200;
      const maxDocsToScan = 2000;
      let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
      let scanned = 0;

      while (scanned < maxDocsToScan) {
        const q = lastDoc
          ? query(usersRef, orderBy(documentId()), startAfter(lastDoc), limit(pageSize))
          : query(usersRef, orderBy(documentId()), limit(pageSize));

        const snap = await getDocs(q);
        if (snap.empty) {
          break;
        }

        scanned += snap.size;
        lastDoc = snap.docs[snap.docs.length - 1] ?? null;

        snap.forEach((d) => {
          const data = d.data();
          const isExcluded =
            !!data.isProfileLocked ||
            !!data.isBanned ||
            (userData.blockedUsers || []).includes(d.id) ||
            (data.blockedUsers || []).includes(user.uid);

          if (isExcluded) return;

          const matchResult = calculateMatchScore(userData, data);
          fetched.push({
            id: d.id,
            ...data,
            matchScore: Number.isFinite(matchResult.score) ? matchResult.score : 0,
          });
        });

        if (snap.size < pageSize) {
          break;
        }
      }

      fetched.sort((a, b) => {
        const scoreDiff = (b.matchScore || 0) - (a.matchScore || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return String(a.name || a.username || '').localeCompare(String(b.name || b.username || ''));
      });

      setProfiles(fetched);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrowsingProfiles();
  }, [user, userData]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const revealId = params.get('reveal');
    if (revealId && profiles.length > 0) {
      const found = profiles.find(p => p.id === revealId);
      if (found) {
        setSelectedProfile(found);
        // Clear param to avoid re-opening if state changes
        window.history.replaceState({}, '', location.pathname);
      }
    }
  }, [location.search, profiles]);

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

      // Keep self hidden in browse mode; allow it only on explicit search.
      const isCurrentUser = p.id === user?.uid;
      const allowSelfResult = !isCurrentUser || (term.length > 0 && matchesSearch);

      return allowSelfResult && matchesSearch && matchesYear && matchesLookingFor && matchesDept;
    });
  }, [profiles, searchTerm, selectedYear, selectedLookingFor, selectedDept, user?.uid]);

  return (
    <div className="min-h-screen bg-[#020202] p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4">
        <h1 className="hidden lg:block text-4xl font-black text-white">Browse</h1>
        <p className="hidden lg:block text-xs font-medium text-zinc-500">
          Search shows active accounts except blocked, locked, or banned profiles.
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

        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setSelectedDept('')}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${!selectedDept ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900'}`}
          >
            All
          </button>
          {DEPARTMENTS.slice(0, 6).map((dept) => (
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
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-card bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      ) : filteredProfiles.length > 0 ? (
        <ProfileGrid profiles={filteredProfiles} onProfileClick={(p) => setSelectedProfile(p)} />
      ) : (
        <div className="mt-20 text-center">
          <p className="font-medium text-zinc-500">No students found matching your search.</p>
        </div>
      )}

      <Modal isOpen={!!selectedProfile} onClose={closeProfileModal} title="Profile Actions">
        {selectedProfile && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
              <div className="h-14 w-14 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                {selectedProfile.photoURL ? (
                  <img src={selectedProfile.photoURL} alt={selectedProfile.name || 'Profile'} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-500 dark:text-zinc-300">
                    <User size={20} />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{selectedProfile.name || selectedProfile.username || 'Student'}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-300">{selectedProfile.department || 'Department not set'} • Match {selectedProfile.matchScore || 0}%</p>
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-300">Send a connection request or skip this profile from search results.</p>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleProfilePass} disabled={actionLoading}>
                <X size={16} className="mr-1" />Pass
              </Button>
              <Button className="flex-1" onClick={() => handleProfileConnect()} disabled={actionLoading}>
                <Heart size={16} className="mr-1" />Connect
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Search;
