import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Flag, Trash2, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatusUpdate = async (reportId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
      toast.success(`Report marked as ${status}`);
      fetchReports();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Moderation Queue</h1>
        <div className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
           {reports.filter(r => r.status === 'pending').length} Pending
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-card bg-zinc-100 dark:bg-zinc-900" />)
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <Card key={report.id} className="relative overflow-hidden">
               {report.status === 'pending' && (
                 <div className="absolute left-0 top-0 h-full w-1 bg-amber-500" />
               )}
               
               <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                 <div className="flex gap-3 sm:gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800">
                       <Flag size={20} className={report.status === 'pending' ? 'text-amber-500' : 'text-zinc-400'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-zinc-900 dark:text-white">{report.reason}</h3>
                        <span className={`text-[10px] font-black uppercase ${report.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'}`}>
                          • {report.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{report.description || 'No additional details provided.'}</p>
                      
                      <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-zinc-400">
                        <div className="flex items-center gap-1">
                          <User size={12} /> Reported UID: {report.reportedUserId.slice(0, 12)}...
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={12} /> By: {report.reportedBy.slice(0, 12)}...
                        </div>
                      </div>
                    </div>
               </div>

               <div className="mt-6 flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 sm:flex-initial text-[10px] font-black uppercase tracking-widest"
                    onClick={() => handleStatusUpdate(report.id, 'resolved')}
                    disabled={report.status === 'resolved'}
                  >
                    <CheckCircle size={14} className="mr-2" />
                    Resolve
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 text-zinc-400 hover:text-danger">
                    <Trash2 size={16} />
                  </Button>
               </div>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center">
            <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
            <h2 className="text-xl font-bold">Queue is empty!</h2>
            <p className="text-zinc-500">Good job, there are no active reports to review.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
