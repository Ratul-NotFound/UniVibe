import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Flag, Trash2, CheckCircle, AlertTriangle, User, HelpCircle, Wrench } from 'lucide-react';
import { toast } from 'react-hot-toast';

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Just now';
  const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const AdminReports = () => {
  const { user: adminUser } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [supportIssues, setSupportIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'moderation' | 'support'>('moderation');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsSnap, issuesSnap] = await Promise.all([
        getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'supportIssues')))
      ]);
      setReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      // Sort issues locally to avoid requiring composite indexes immediately
      const issues = issuesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      issues.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setSupportIssues(issues);
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (reportId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
      
      // Log the action
      if (adminUser) {
        await addDoc(collection(db, 'adminLogs'), {
          adminUid: adminUser.uid,
          targetId: reportId,
          targetType: 'report',
          action: `status_${status}`,
          createdAt: serverTimestamp()
        });
      }

      toast.success(`Report marked as ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleSupportStatusUpdate = async (issueId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'supportIssues', issueId), { status });
      if (adminUser) {
        await addDoc(collection(db, 'adminLogs'), {
          adminUid: adminUser.uid,
          targetId: issueId,
          targetType: 'supportIssue',
          action: `status_${status}`,
          createdAt: serverTimestamp()
        });
      }
      toast.success(`Ticket marked as ${status.replace('_', ' ')}`);
      fetchData();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      
      // Log the action
      if (adminUser) {
        await addDoc(collection(db, 'adminLogs'), {
          adminUid: adminUser.uid,
          targetId: reportId,
          targetType: 'report',
          action: 'delete_report',
          createdAt: serverTimestamp()
        });
      }

      toast.success("Report deleted successfully");
      fetchData();
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const handleDeleteSignal = async (signalId: string, reportId: string) => {
    if (!window.confirm("Delete this signal permanently?")) return;
    try {
      await deleteDoc(doc(db, 'pulses', signalId));
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
      if (adminUser) {
        await addDoc(collection(db, 'adminLogs'), {
          adminUid: adminUser.uid,
          targetId: signalId,
          targetType: 'pulse',
          action: 'delete_pulse_from_report',
          createdAt: serverTimestamp()
        });
      }
      toast.success("Signal deleted & report resolved");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete signal");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-black">Issue Management</h1>
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'moderation' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('moderation')}
            className="text-xs"
          >
            Moderation Queue
          </Button>
          <Button 
            variant={activeTab === 'support' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('support')}
            className="text-xs"
          >
            Support Tickets
            {supportIssues.filter(i => i.status === 'pending').length > 0 && (
              <span className="ml-2 bg-amber-500 text-white rounded-full px-2 py-0.5 text-[10px]">
                {supportIssues.filter(i => i.status === 'pending').length}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-card bg-zinc-100 dark:bg-zinc-900" />)
        ) : activeTab === 'moderation' ? (
          reports.length > 0 ? (
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
                        <div className="flex items-center gap-1">
                          <span>{formatDate(report.createdAt)}</span>
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
                  {(report.targetType === 'pulse' || report.targetType === 'signal') && report.targetId && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-[10px] font-black uppercase tracking-widest text-danger hover:bg-danger/10 border-danger/20"
                      onClick={() => handleDeleteSignal(report.targetId, report.id)}
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete Signal
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 w-9 text-zinc-400 hover:text-danger"
                    onClick={() => handleDeleteReport(report.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
               </div>
               </div>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center">
            <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
            <h2 className="text-xl font-bold">Queue is empty!</h2>
            <p className="text-zinc-500">Good job, there are no active reports to review.</p>
          </div>
        )
        ) : (
          /* Support Tickets Tab */
          supportIssues.length > 0 ? (
            supportIssues.map((issue) => (
              <Card key={issue.id} className="relative overflow-hidden">
                {issue.status === 'pending' && <div className="absolute left-0 top-0 h-full w-1 bg-amber-500" />}
                {issue.status === 'under_work' && <div className="absolute left-0 top-0 h-full w-1 bg-blue-500" />}
                {issue.status === 'solved' && <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500" />}
                
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800">
                       <HelpCircle size={20} className={
                         issue.status === 'pending' ? 'text-amber-500' : 
                         issue.status === 'under_work' ? 'text-blue-500' : 'text-emerald-500'
                       } />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-zinc-900 dark:text-white">{issue.title}</h3>
                        <span className={`text-[10px] font-black uppercase ${
                          issue.status === 'pending' ? 'text-amber-500' : 
                          issue.status === 'under_work' ? 'text-blue-500' : 'text-emerald-500'
                        }`}>
                          • {issue.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{issue.description}</p>
                      
                      <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-zinc-400">
                        <div className="flex items-center gap-1">
                          <User size={12} /> UID: {issue.userId.slice(0, 12)}...
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{formatDate(issue.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-[10px] font-black uppercase tracking-widest text-blue-500"
                      onClick={() => handleSupportStatusUpdate(issue.id, 'under_work')}
                      disabled={issue.status === 'under_work' || issue.status === 'solved'}
                    >
                      <Wrench size={14} className="mr-2" />
                      Under Work
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-[10px] font-black uppercase tracking-widest text-emerald-500"
                      onClick={() => handleSupportStatusUpdate(issue.id, 'solved')}
                      disabled={issue.status === 'solved'}
                    >
                      <CheckCircle size={14} className="mr-2" />
                      Solved
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="py-20 text-center">
              <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
              <h2 className="text-xl font-bold">No Support Tickets!</h2>
              <p className="text-zinc-500">Users haven't reported any bugs or issues.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AdminReports;
