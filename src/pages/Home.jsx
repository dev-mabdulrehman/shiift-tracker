import { Calendar, Clock, MapPin, PoundSterling } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import ActiveShiftCard from '../components/ActiveShiftCard';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [chartView, setChartView] = useState('month');
  const { user } = useAuth();

  // 1. Data States
  const [activeShifts, setActiveShifts] = useState([]);
  const [allShifts, setAllShifts] = useState([]);
  const [stats, setStats] = useState({ totalEarnings: 0, totalHours: 0 });
  const [totalMonthlyShifts, setTotalMonthlyShifts] = useState(0);
  const [siteMap, setSiteMap] = useState({});

  const { data: shifts, status: shiftStatus, error: shiftError } = useSelector((state) => state.shifts);
  const { data: sites, status: siteStatus, error: siteError } = useSelector((state) => state.sites);
  const { data: employers, status: employersStatus, error: employersError } = useSelector((state) => state.employers);

  useEffect(() => {
    const sitesMap = {};
    sites.forEach(site => sitesMap[site.id] = site.siteName);
    console.log(sitesMap);
    setSiteMap(sitesMap);
  }, [sites]);


  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const currentMonthStr = now.toISOString().substring(0, 7);
    const thisMonthDocs = shifts.filter(shift => shift.date.startsWith(currentMonthStr));

    const earnings = thisMonthDocs.reduce((acc, curr) => acc + (parseFloat(curr.totalEarnings) || 0), 0);
    const hours = thisMonthDocs.reduce((acc, curr) => acc + (parseFloat(curr.hours) || 0), 0);

    setStats({ totalEarnings: earnings, totalHours: hours });
    setTotalMonthlyShifts(thisMonthDocs.length);
    // });

    const todayStr = now.toISOString().split('T')[0]; // Result: "YYYY-MM-DD"
    const todayDocs = shifts.filter(shift => shift.date == todayStr);

    setActiveShifts(todayDocs)
  }, [shifts]);

  /**
   * ACTIVE SHIFT LOGIC
   * Identifies if there is a shift scheduled for TODAY that isn't completed.
   */
  const activeShift = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Check allShifts for a match on today's date
    return shifts.find(shift => shift.date === todayStr && shift.status !== 'completed');
  }, [shifts]);

  /**
   * CLOCK OUT PERMISSION LOGIC
   */
  const canClockOut = useMemo(() => {
    if (!activeShift || activeShift.status !== 'on site') return false;
    const now = new Date();
    const [eHours, eMins] = activeShift.endTime.split(':').map(Number);
    const shiftEndTime = new Date();
    shiftEndTime.setHours(eHours, eMins, 0, 0);

    // Allow clock out if within 1 hour of end time OR if end time has passed
    return (shiftEndTime - now) <= (60 * 60 * 1000);
  }, [activeShift]);

  return (
    <div className="space-y-6 mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 font-medium">Overview of your activity</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<PoundSterling size={24} />} label="Earnings" value={`£${stats.totalEarnings.toFixed(2)}`} color="green" />
        <StatCard icon={<Clock size={24} />} label="Hours" value={`${stats.totalHours.toFixed(1)}h`} color="blue" />
        <StatCard icon={<Calendar size={24} />} label="Shifts" value={totalMonthlyShifts} color="purple" />
      </div>

      {/* Active Shift Management Section */}
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
            siteName={siteMap[activeShift.siteId] || 'Current Site'}
          />
        </section>
      )}


      {/* Today Activity List */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 ml-2">Active Shifts</h2>
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          {activeShifts.map(shift => (
            <div key={shift.id} className="p-5 border-b border-gray-50 last:border-0 flex justify-between items-center hover:bg-gray-50 transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400"><MapPin size={20} /></div>
                <div>
                  <p className="font-bold text-gray-800 text-sm leading-tight">{siteMap[shift.siteId] || 'Unknown Site'}</p>
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
          {activeShifts.length === 0 && (
            <p className="p-10 text-center text-gray-400 text-sm italic">No shifts found.</p>
          )}
        </div>
      </section>
    </div>
  );
}