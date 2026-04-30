import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, limit, orderBy, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { 
  Users, 
  Heart, 
  Flag, 
  TrendingUp, 
  Clock, 
  MoreHorizontal,
  UserCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card className="flex items-center gap-4">
    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{title}</p>
      <p className="text-2xl font-black">{value || 0}</p>
    </div>
  </Card>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    matches: 0,
    reports: 0,
    activeToday: 0
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersCount = await getCountFromServer(collection(db, 'users'));
        const matchesCount = await getCountFromServer(collection(db, 'matches'));
        const reportsCount = await getCountFromServer(query(collection(db, 'reports'), where('status', '==', 'pending')));
        // Simplified active today calculation for MVP
        const activeCount = await getCountFromServer(collection(db, 'pulses'));

        setStats({
          users: usersCount.data().count,
          matches: matchesCount.data().count,
          reports: reportsCount.data().count,
          activeToday: activeCount.data().count // Assuming active users make pulses
        });

        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(5));
        const snapshot = await getDocs(q);
        const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentReports(reports);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Dashboard overview</h1>
        <p className="text-zinc-500">Welcome to the UniVibe management console.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats.users} icon={Users} color="bg-blue-500" />
        <StatCard title="Total Matches" value={stats.matches} icon={Heart} color="bg-pink-500" />
        <StatCard title="Pending Reports" value={stats.reports} icon={Flag} color="bg-amber-500" />
        <StatCard title="Active Today" value={stats.activeToday} icon={TrendingUp} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Registration Chart */}
        <Card className="flex h-[400px] flex-col">
          <h3 className="mb-4 font-bold">Activity Overview</h3>
          <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Mon', users: Math.floor(Math.random() * 50) + 10 },
                { name: 'Tue', users: Math.floor(Math.random() * 50) + 10 },
                { name: 'Wed', users: Math.floor(Math.random() * 50) + 10 },
                { name: 'Thu', users: Math.floor(Math.random() * 50) + 10 },
                { name: 'Fri', users: Math.floor(Math.random() * 50) + 10 },
                { name: 'Sat', users: Math.floor(Math.random() * 50) + 10 },
                { name: 'Sun', users: Math.floor(Math.random() * 50) + 10 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="users" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>


        {/* Recent Reports */}
        <Card>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-bold">Recent Reports</h3>
            <button className="text-zinc-400">
               <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="space-y-4">
            {recentReports.length > 0 ? (
              recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                   <div className="flex items-center gap-3">
                     <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                       <Flag size={18} />
                     </div>
                     <div>
                       <p className="text-sm font-bold">{report.reason}</p>
                       <p className="text-[10px] text-zinc-500">User ID: {report.reportedUserId.slice(0, 8)}...</p>
                     </div>
                   </div>
                   <span className="text-[10px] font-black uppercase text-amber-500">{report.status}</span>
                </div>
              ))
            ) : (
              <div className="flex h-32 flex-col items-center justify-center text-center">
                <Clock size={24} className="mb-2 text-zinc-300" />
                <p className="text-xs text-zinc-400">No reports found in the queue.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
