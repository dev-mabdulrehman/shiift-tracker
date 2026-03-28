import { Building2, Edit3, MapPin, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Added for navigation
import { deleteEmployer } from '../store/features/employersSlice';

export default function Employers() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { data: employers } = useSelector((state) => state.employers);
    const { data: shifts } = useSelector((state) => state.shifts);
    const { data: sites } = useSelector((state) => state.sites); // Access sites

    const [searchTerm, setSearchTerm] = useState('');

    // Filtered Employers
    const filtered = employers.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- LOGIC TO COUNT LINKED SITES ---
    const getLinkedSiteCount = (empId) => {
        // Find all shifts belonging to this employer
        const employerShifts = shifts.filter(s => s.employerId === empId);

        // Get unique siteIds from those shifts
        const uniqueSiteIds = [...new Set(employerShifts.map(s => s.siteId))];

        // Filter out any undefined/null IDs and return length
        return uniqueSiteIds.filter(id => id).length;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black text-gray-900">Employers</h1>
                <button
                    onClick={() => navigate('/employers/new')}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    + Add Employer
                </button>
            </div>

            {/* Search bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search employers..."
                    className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-100 font-medium shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Employers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((emp) => (
                    <div key={emp.id} className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md transition group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <Building2 size={24} />
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => navigate(`/employers/edit/${emp.id}`)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this employer?')) {
                                            dispatch(deleteEmployer(emp.id));
                                        }
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-black text-gray-900 mb-1">{emp.name}</h3>

                        <div className="space-y-3 mt-4">
                            {/* Sites Linked Stat */}
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                                <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                                    <MapPin size={14} />
                                </div>
                                <span>{getLinkedSiteCount(emp.id)} Unique Sites</span>
                            </div>

                            {/* Default Rate Badge */}
                            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-xl border border-emerald-100">
                                <span>£{emp.defaultRate}/hr</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-4xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold">No employers found matching your search.</p>
                </div>
            )}
        </div>
    );
}