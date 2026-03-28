import { Building2, Calendar as CalIcon, Clock, MapPin, PoundSterling } from 'lucide-react';
import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useSelector } from 'react-redux';
import ActiveShiftCard from '../components/ActiveShiftCard';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Redux Data
  const { data: shifts } = useSelector((state) => state.shifts);
  const { data: sites } = useSelector((state) => state.sites);
  const { data: employers } = useSelector((state) => state.employers);

  // 1. Memoized Lookup Maps (Prevents re-calculating on every render)
  const siteMap = useMemo(() =>
    sites.reduce((acc, s) => ({ ...acc, [s.id]: s.siteName }), {}), [sites]);

  const empMap = useMemo(() =>
    employers.reduce((acc, e) => ({ ...acc, [e.id]: e.name }), {}), [employers]);

  // 2. Stats Calculation
  const stats = useMemo(() => {
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const monthShifts = shifts.filter(s => s.date.startsWith(currentMonthStr));
    return {
      earnings: monthShifts.reduce((acc, curr) => acc + (parseFloat(curr.totalEarnings) || 0), 0),
      hours: monthShifts.reduce((acc, curr) => acc + (parseFloat(curr.hours) || 0), 0),
      count: monthShifts.length
    };
  }, [shifts]);

  // 3. Filter shifts for the specific selected calendar day
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const dayShifts = useMemo(() =>
    shifts.filter(s => s.date === selectedDateStr), [shifts, selectedDateStr]);

  // 4. Active Shift Logic (For the 'Active Session' card)
  const activeShift = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return shifts.find(s => s.date === todayStr && s.status !== 'completed');
  }, [shifts]);

  return (
    <div className="space-y-6 mx-auto pb-10">
      <header>
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 font-medium">Manage your schedule and earnings</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<PoundSterling size={24} />} label="Month Earnings" value={`£${stats.earnings.toFixed(2)}`} color="green" />
        <StatCard icon={<Clock size={24} />} label="Month Hours" value={`${stats.hours.toFixed(1)}h`} color="blue" />
        <StatCard icon={<CalIcon size={24} />} label="Month Shifts" value={stats.count} color="purple" />
      </div>

      {/* Active Shift Card */}
      {activeShift && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-3 ml-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <h2 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Live Session</h2>
          </div>
          <ActiveShiftCard
            shift={activeShift}
            siteName={siteMap[activeShift.siteId] || 'Current Site'}
          />
        </section>
      )}

      {/* Main Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Calendar */}
        <div className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
          <style>{`
            .react-calendar { border: none; width: 100%; font-family: inherit; }
            .react-calendar__tile--active { background: #4f46e5 !important; border-radius: 12px; }
            .react-calendar__tile--now { background: #eef2ff; border-radius: 12px; color: #4f46e5; }
            .has-shift { position: relative; }
            .has-shift::after { 
              content: ''; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
              width: 4px; height: 4px; background: #4f46e5; border-radius: 50%; 
            }
          `}</style>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileClassName={({ date }) => {
              const dStr = date.toISOString().split('T')[0];
              return shifts.some(s => s.date === dStr) ? 'has-shift' : null;
            }}
          />
        </div>

        {/* Right: Selected Day Shifts */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 ml-2">
            Schedule: {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </h2>
          <div className="space-y-3">
            {dayShifts.map(shift => (
              <div key={shift.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 leading-tight">{siteMap[shift.siteId] || 'Unknown Site'}</p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p className="text-[12px] text-gray-500 font-bold flex items-center gap-1">
                        <MapPin size={12} className="text-gray-400" /> {empMap[shift.employerId] || 'Private Employer'}
                      </p>
                      <p className="text-[11px] text-indigo-500 font-black flex items-center gap-1">
                        <Clock size={12} /> {shift.startTime} - {shift.endTime}
                      </p>
                    </div>
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
            {dayShifts.length === 0 && (
              <div className="py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold text-sm">No shifts for this date.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}