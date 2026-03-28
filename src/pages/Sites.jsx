import { Briefcase, Edit3, MapPin, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deleteSite } from '../store/features/sitesSlice';
// import { deleteSite } from '../store/features/sitesSlice';

export default function Sites() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { data: sites } = useSelector((state) => state.sites);
    const { data: employers } = useSelector((state) => state.employers);

    const [searchTerm, setSearchTerm] = useState('');

    // Memoize filtered results to prevent heavy lifting on every keystroke
    const filteredSites = useMemo(() => {
        const lowerTerm = searchTerm.toLowerCase();
        return sites.filter(site =>
            site.siteName.toLowerCase().includes(lowerTerm) ||
            site.postalCode?.toLowerCase().includes(lowerTerm)
        );
    }, [sites, searchTerm]);

    // Helper to safely get employer name
    const getEmployerName = (employerId) => {
        const emp = employers.find(e => e.id === employerId);
        return emp ? emp.name : 'Unassigned Employer';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Work Sites</h1>
                    <p className="text-gray-500 font-medium text-sm">Manage locations and postcodes</p>
                </div>
                <button
                    onClick={() => navigate('/sites/add')}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
                >
                    <Plus size={18} /> Add Site
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search site name or postcode..."
                    className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-100 font-medium shadow-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Sites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSites.map((site) => (
                    <div
                        key={site.id}
                        className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <MapPin size={24} />
                            </div>

                            <div className="flex gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => navigate(`/sites/edit/${site.id}`)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                    title="Edit Site"
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Delete this site?')) {
                                            dispatch(deleteSite(site.id));
                                        }
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    title="Delete Site"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-black text-gray-900 mb-1 leading-tight truncate">
                            {site.siteName}
                        </h3>

                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-4">
                            {site.postalCode || 'No Postcode'}
                        </p>

                        <div className="pt-3 border-t border-gray-50">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                                <Briefcase size={14} className="text-gray-400" />
                                <span className="truncate">
                                    {getEmployerName(site.employerId)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredSites.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-4xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold text-sm">No sites found matching your search.</p>
                </div>
            )}
        </div>
    );
}