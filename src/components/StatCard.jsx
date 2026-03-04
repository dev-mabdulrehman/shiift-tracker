export default function StatCard({ icon, label, value, color }) {
    const colors = {
        green: 'bg-green-50 text-green-600',
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600'
    };
    return (
        <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${colors[color]}`}>{icon}</div>
            <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{label} (Month)</p>
                <p className="text-xl font-black text-gray-800">{value}</p>
            </div>
        </div>
    );
}