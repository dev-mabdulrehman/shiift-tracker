import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ActiveShiftCard from '../components/ActiveShiftCard';
import { Calendar, Clock, PoundSterling, MapPin } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  // 1. Data States
  const [recentShifts, setRecentShifts] = useState([]);
  const [totalMonthlyShifts, setTotalMonthlyShifts] = useState(0);
  const [stats, setStats] = useState({ totalEarnings: 0, totalHours: 0 });
  const [siteMap, setSiteMap] = useState({});

  useEffect(() => {
    if (!user) return;

    // Fetch site names for the recent list mapping
    const fetchSites = async () => {
      const siteSnap = await getDocs(query(collection(db, "sites"), where("userId", "==", user.uid)));
      const sites = {};
      siteSnap.docs.forEach(doc => sites[doc.id] = doc.data().siteName);
      setSiteMap(sites);
    };
    fetchSites();

    // --- STATS LOGIC: FETCH ALL FOR MONTH ---
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const statsQuery = query(
      collection(db, "shifts"),
      where("userId", "==", user.uid),
      where("date", ">=", startOfMonth),
      where("date", "<=", endOfMonth)
    );

    const unsubscribeStats = onSnapshot(statsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      const earnings = data.reduce((acc, curr) => acc + (parseFloat(curr.totalEarnings) || 0), 0);
      const hours = data.reduce((acc, curr) => acc + (parseFloat(curr.hours) || 0), 0);

      setStats({ totalEarnings: earnings, totalHours: hours });
      setTotalMonthlyShifts(snapshot.docs.length);
    });

    // --- LIST LOGIC: FETCH TOP 5 ONLY ---
    const recentQuery = query(
      collection(db, "shifts"),
      where("userId", "==", user.uid),
      orderBy("date", "desc"),
      limit(5)
    );

    const unsubscribeRecent = onSnapshot(recentQuery, (snapshot) => {
      setRecentShifts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeStats();
      unsubscribeRecent();
    };
  }, [user]);

  /**
   * ACTIVE SHIFT VISIBILITY LOGIC
   * Shows card only if shift is today AND (+/-) 1 hour from Start Time
   */
  const activeShift = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return recentShifts.find(s => {
      if (s.date !== todayStr || s.status === 'completed') return false;

      const [sHours, sMins] = s.startTime.split(':').map(Number);
      const shiftStartTime = new Date();
      shiftStartTime.setHours(sHours, sMins, 0, 0);

      const diffInMs = Math.abs(now - shiftStartTime);
      const oneHourInMs = 60 * 60 * 1000;

      // Show if within 1 hour of starting OR already clocked in
      return diffInMs <= oneHourInMs || s.status === 'on site';
    });
  }, [recentShifts]);

  /**
   * CLOCK OUT PERMISSION LOGIC
   * Disables button until 1 hour before scheduled End Time
   */
  const canClockOut = useMemo(() => {
    if (!activeShift || activeShift.status !== 'on site') return false;

    const now = new Date();
    const [eHours, eMins] = activeShift.endTime.split(':').map(Number);
    const shiftEndTime = new Date();
    shiftEndTime.setHours(eHours, eMins, 0, 0);

    const diffToEnd = shiftEndTime - now;
    const oneHourInMs = 60 * 60 * 1000;

    // Enable button only when we reach the 1-hour-to-go mark
    return diffToEnd <= oneHourInMs;
  }, [activeShift]);

  return (
    <div className="space-y-6 mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 font-medium">Overview for the current month</p>
      </header>

      {/* Statistics Section (Uses Full Month Data) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><PoundSterling size={24} /></div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Earnings</p>
            <p className="text-xl font-black text-gray-800">£{stats.totalEarnings.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Clock size={24} /></div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Hours</p>
            <p className="text-xl font-black text-gray-800">{stats.totalHours.toFixed(1)}h</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Calendar size={24} /></div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Shifts</p>
            <p className="text-xl font-black text-gray-800">{totalMonthlyShifts}</p>
          </div>
        </div>
      </div>

      {/* Active Shift Management */}
      {activeShift && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-3 ml-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-widest">Active Session</h2>
          </div>
          <ActiveShiftCard
            shift={activeShift}
            canClockOut={canClockOut}
          />
        </section>
      )}

      {/* Recent Activity (Limited to 5) */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 ml-2">Recent Shifts</h2>
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          {recentShifts.map(shift => (
            <div key={shift.id} className="p-5 border-b border-gray-50 last:border-0 flex justify-between items-center hover:bg-gray-50 transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400"><MapPin size={20} /></div>
                <div>
                  <p className="font-bold text-gray-800 text-sm leading-tight">{siteMap[shift.siteId] || shift.site}</p>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">{shift.date} • {shift.startTime} - {shift.endTime}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-gray-900 text-sm">£{parseFloat(shift.totalEarnings || 0).toFixed(2)}</p>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md mt-1 inline-block ${shift.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                  {shift.status}
                </span>
              </div>
            </div>
          ))}
          {recentShifts.length === 0 && (
            <p className="p-10 text-center text-gray-400 text-sm italic">No shifts found for this month.</p>
          )}
        </div>
      </section>
    </div>
  );
}