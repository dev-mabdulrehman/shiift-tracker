import { Clock, Hash, TrendingUp } from "lucide-react"

const StatsOverview = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-gray-400 mb-2"><TrendingUp size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Earnings</span></div>
                <p className="text-4xl font-black text-gray-800">£{stats.earnings}</p>
            </div>
            <div className="bg-indigo-600 p-6 rounded-4xl text-white shadow-xl shadow-indigo-100">
                <div className="flex items-center gap-2 opacity-80 mb-2"><Clock size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Total Hours</span></div>
                <p className="text-4xl font-black">{stats.hours} <span className="text-lg font-normal opacity-70">hrs</span></p>
            </div>
            <div className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm text-center md:text-left">
                <div className="flex items-center gap-2 text-gray-400 mb-2"><Hash size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Total Shifts</span></div>
                <p className="text-4xl font-black text-gray-800">{stats.count}</p>
            </div>
        </div>
    )
}

export default StatsOverview