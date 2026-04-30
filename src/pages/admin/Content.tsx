import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trash2, Radio } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminContent = () => {
  const { user: adminUser } = useAuth();
  const [pulses, setPulses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPulses = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'pulses'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setPulses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPulses();
  }, []);

  const handleDeletePulse = async (pulseId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this content?")) return;
    
    try {
      await deleteDoc(doc(db, 'pulses', pulseId));
      
      // Log the action
      if (adminUser) {
        await addDoc(collection(db, 'adminLogs'), {
          adminUid: adminUser.uid,
          targetId: pulseId,
          targetType: 'pulse',
          action: 'admin_deleted_pulse',
          createdAt: serverTimestamp()
        });
      }

      toast.success("Content deleted successfully");
      fetchPulses();
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Content Moderation</h1>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
           {pulses.length} Total Signals
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-card bg-zinc-100 dark:bg-zinc-900" />)
        ) : pulses.length > 0 ? (
          pulses.map((pulse) => (
            <Card key={pulse.id} className="relative overflow-hidden flex flex-col justify-between p-0">
               <div className="p-4">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="h-6 w-6 rounded-full bg-zinc-200 overflow-hidden shrink-0">
                     {pulse.fromPhotoURL ? <img src={pulse.fromPhotoURL} className="h-full w-full object-cover" /> : <Radio size={16} className="m-1 text-zinc-400" />}
                   </div>
                   <p className="text-xs font-bold">{pulse.fromName}</p>
                 </div>
                 <p className="text-sm text-zinc-800 dark:text-zinc-200">{pulse.content}</p>
                 
                 <div className="mt-4 flex gap-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                     {pulse.category}
                   </span>
                   {pulse.isAnonymous && (
                     <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full">
                       Anon
                     </span>
                   )}
                 </div>
               </div>

               <div className="border-t border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="text-danger hover:bg-danger/10"
                   onClick={() => handleDeletePulse(pulse.id)}
                 >
                   <Trash2 size={16} className="mr-2" />
                   Delete Post
                 </Button>
               </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <Radio size={48} className="mx-auto mb-4 text-zinc-300" />
            <h2 className="text-xl font-bold">No active content</h2>
            <p className="text-zinc-500">There are no signals broadcasting right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContent;
