import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase';
import {
    collection, query, where, orderBy, onSnapshot, doc,
    deleteDoc, updateDoc, getDocs, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
    MapPin, Building2, Trash2, Search, Download, Upload,
    Loader2, AlertCircle, Clock, Hash, TrendingUp, Edit3, X,
    Settings2, Check, User
} from 'lucide-react';
import Papa from 'papaparse';
import StatsOverview from '../components/StatsOverview';
import HistoryFilters from '../components/HistoryFilters';
import { Link } from 'react-router-dom';

// Configuration for Export
const EXPORTABLE_COLUMNS = [
    { id: 'date', label: 'Work Date', defaultHeader: 'Date' },
    { id: 'employer', label: 'Employer Name', defaultHeader: 'Employer' },
    { id: 'site', label: 'Site Name', defaultHeader: 'Site' },
    { id: 'startTime', label: 'Start Time', defaultHeader: 'Start' },
    { id: 'endTime', label: 'End Time', defaultHeader: 'End' },
    { id: 'hours', label: 'Decimal Hours', defaultHeader: 'Hours' },
    { id: 'hourlyRate', label: 'Pay Rate', defaultHeader: 'Rate' },
    { id: 'totalEarnings', label: 'Total Pay', defaultHeader: 'Total' },
    { id: 'status', label: 'Shift Status', defaultHeader: 'Status' },
];

export default function History() {
    const { user } = useAuth();
    const fileInputRef = useRef();

    // 1. STATES
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchEmployer, setSearchEmployer] = useState('');
    const [searchSite, setSearchSite] = useState('');
    const [shifts, setShifts] = useState([]);
    const [employersMap, setEmployersMap] = useState({});
    const [sitesMap, setSitesMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedShiftIds, setSelectedShiftIds] = useState([]);

    // Export Modal States
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedCols, setSelectedCols] = useState(EXPORTABLE_COLUMNS.map(c => c.id));
    const [customHeaders, setCustomHeaders] = useState(
        EXPORTABLE_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: col.defaultHeader }), {})
    );

    // 2. DATA FETCHING
    const fetchMetadata = async () => {
        if (!user) return { emps: [], sites: [] };
        const [empSnap, siteSnap] = await Promise.all([
            getDocs(query(collection(db, "employers"), where("userId", "==", user.uid))),
            getDocs(query(collection(db, "sites"), where("userId", "==", user.uid)))
        ]);
        const emps = {}; empSnap.docs.forEach(doc => emps[doc.id] = doc.data().name);
        const sites = {}; siteSnap.docs.forEach(doc => sites[doc.id] = doc.data());
        setEmployersMap(emps);
        setSitesMap(sites);
        return {
            emps: empSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            sites: siteSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        };
    };

    useEffect(() => { fetchMetadata(); }, [user]);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const start = `${selectedMonth}-01`;
        const end = `${selectedMonth}-31`;
        const q = query(
            collection(db, "shifts"),
            where("userId", "==", user.uid),
            where("date", ">=", start),
            where("date", "<=", end),
            orderBy("date", "desc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setShifts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user, selectedMonth]);

    // 3. FILTERING & STATS
    const { filteredShifts, stats } = useMemo(() => {
        const filtered = shifts.filter(s => {
            const empName = (employersMap[s.employerId] || '').toLowerCase();
            const siteName = (sitesMap[s.siteId]?.siteName || '').toLowerCase();
            return (statusFilter === 'all' || s.status.toLowerCase() === statusFilter.toLowerCase()) &&
                (searchEmployer === '' || empName.includes(searchEmployer.toLowerCase())) &&
                (searchSite === '' || siteName.includes(searchSite.toLowerCase()));
        });
        const totalHours = filtered.reduce((acc, curr) => acc + (parseFloat(curr.hours) || 0), 0);
        const totalEarnings = filtered.reduce((acc, curr) => acc + (parseFloat(curr.totalEarnings) || 0), 0);
        return {
            filteredShifts: filtered,
            stats: {
                hours: totalHours.toFixed(2),
                count: filtered.length,
                earnings: totalEarnings.toLocaleString('en-GB', { minimumFractionDigits: 2 })
            }
        };
    }, [shifts, statusFilter, searchEmployer, searchSite, employersMap, sitesMap]);

    // 4. ACTIONS
    const toggleSelectShift = (id) => {
        setSelectedShiftIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedShiftIds.length === filteredShifts.length) {
            setSelectedShiftIds([]);
        } else {
            setSelectedShiftIds(filteredShifts.map(s => s.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedShiftIds.length} shifts?`)) return;
        setActionLoading(true);
        try {
            const batch = writeBatch(db);
            selectedShiftIds.forEach(id => batch.delete(doc(db, "shifts", id)));
            await batch.commit();
            setSelectedShiftIds([]);
        } catch (err) { alert("Error deleting shifts."); }
        finally { setActionLoading(false); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) await deleteDoc(doc(db, "shifts", id));
    };

    // 5. EXPORT LOGIC
    const handleExport = () => {
        const rows = filteredShifts.map(s => {
            const rowData = {};
            selectedCols.forEach(colId => {
                const header = customHeaders[colId];
                let value = '';
                switch (colId) {
                    case 'date': value = s.date; break;
                    case 'employer': value = employersMap[s.employerId] || 'N/A'; break;
                    case 'site': value = sitesMap[s.siteId]?.siteName || 'N/A'; break;
                    case 'startTime': value = s.startTime; break;
                    case 'endTime': value = s.endTime; break;
                    case 'hours': value = s.hours; break;
                    case 'hourlyRate': value = s.hourlyRate; break;
                    case 'totalEarnings': value = parseFloat(s.totalEarnings || 0).toFixed(2); break;
                    case 'status': value = s.status; break;
                    default: value = '';
                }
                rowData[header] = value;
            });
            return rowData;
        });

        const csv = Papa.unparse(rows);
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Shifts_${selectedMonth}.csv`;
        a.click();
        setIsExportModalOpen(false);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setActionLoading(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const { emps, sites } = await fetchMetadata();
                    const batch = writeBatch(db);
                    const todayISO = new Date().toISOString().split('T')[0];

                    for (const row of results.data) {
                        if (!row.Date || !row.Employer) continue;

                        // Basic Date Normalization
                        const [m, d, y] = row.Date.split('/');
                        const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

                        // Resolve IDs (Simplified for brevity, similar to your original logic)
                        const empId = emps.find(e => e.name === row.Employer.trim())?.id || doc(collection(db, "employers")).id;
                        const siteId = sites.find(s => s.siteName === row.Site?.trim())?.id || doc(collection(db, "sites")).id;

                        const newShiftRef = doc(collection(db, "shifts"));
                        batch.set(newShiftRef, {
                            userId: user.uid,
                            date: isoDate,
                            hours: parseFloat(row['Hours in Decimal']) || 0,
                            totalEarnings: parseFloat(row['Total']?.replace(/[£,]/g, '')) || 0,
                            status: isoDate === todayISO ? 'on site' : 'completed',
                            employerId: empId,
                            siteId: siteId,
                            createdAt: serverTimestamp()
                        });
                    }
                    await batch.commit();
                    alert("Import successful!");
                } catch (err) { alert("Import failed."); }
                finally { setActionLoading(false); }
            }
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'on site': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6 mx-auto p-4 max-w-7xl pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Shift History</h1>
                    <p className="text-gray-500 font-medium">Manage and review your work records</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => setIsExportModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm">
                        <Settings2 size={18} /> Export
                    </button>
                    <button onClick={() => fileInputRef.current.click()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 transition shadow-md">
                        <Upload size={18} /> Import
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImport} />
                </div>
            </div>

            <StatsOverview stats={stats} />

            <HistoryFilters
                selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
                searchEmployer={searchEmployer} setSearchEmployer={setSearchEmployer}
                searchSite={searchSite} setSearchSite={setSearchSite}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            />

            {/* Bulk Action Bar */}
            {selectedShiftIds.length > 0 && (
                <div className="bg-indigo-600 p-4 rounded-3xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3 ml-2">
                        <span className="bg-white text-indigo-600 w-7 h-7 flex items-center justify-center rounded-full text-xs font-black">
                            {selectedShiftIds.length}
                        </span>
                        <p className="text-white font-bold text-sm">Shifts Selected</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setSelectedShiftIds([])} className="px-4 py-2 text-xs font-bold text-indigo-100 hover:text-white transition">Cancel</button>
                        <button onClick={handleBulkDelete} className="flex items-center gap-2 px-5 py-2 bg-red-500 text-white rounded-xl text-xs font-black hover:bg-red-600 transition shadow-md">
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Table Container */}
            <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="hidden md:table w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="p-5 w-10">
                                <input type="checkbox" className="w-5 h-5 rounded accent-indigo-600"
                                    checked={filteredShifts.length > 0 && selectedShiftIds.length === filteredShifts.length}
                                    onChange={toggleSelectAll} />
                            </th>
                            <th className="p-5 text-xs font-bold text-gray-400 uppercase">Date & Hours</th>
                            <th className="p-5 text-xs font-bold text-gray-400 uppercase">Employer & Site</th>
                            <th className="p-5 text-xs font-bold text-gray-400 uppercase text-center">Earnings</th>
                            <th className="p-5 text-xs font-bold text-gray-400 uppercase text-center">Status</th>
                            <th className="p-5 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredShifts.map(shift => (
                            <tr key={shift.id} className="hover:bg-indigo-50/20 transition group">
                                <td className="p-5">
                                    <input type="checkbox" className="w-5 h-5 rounded accent-indigo-600"
                                        checked={selectedShiftIds.includes(shift.id)}
                                        onChange={() => toggleSelectShift(shift.id)} />
                                </td>
                                <td className="p-5">
                                    <p className="font-bold text-gray-800">{shift.date}</p>
                                    <p className="text-xs text-indigo-500 font-medium">{shift.startTime} - {shift.endTime} ({shift.hours}h)</p>
                                </td>
                                <td className="p-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-700">{sitesMap[shift.siteId]?.siteName || 'N/A'}</span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1"><Building2 size={12} /> {employersMap[shift.employerId]}</span>
                                    </div>
                                </td>
                                <td className="p-5 text-center">
                                    <p className="font-bold text-gray-900">£{parseFloat(shift.totalEarnings || 0).toFixed(2)}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">£{shift.hourlyRate}/h</p>
                                </td>
                                <td className="p-5 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(shift.status)}`}>
                                        {shift.status}
                                    </span>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex justify-end gap-1">
                                        <Link to={`/shift/edit/${shift.id}`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition">
                                            <Edit3 size={18} />
                                        </Link>
                                        <button onClick={() => handleDelete(shift.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-100">
                    {filteredShifts.map(shift => (
                        <div key={shift.id} className="p-5 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <input type="checkbox" className="w-5 h-5 mt-1 rounded accent-indigo-600"
                                        checked={selectedShiftIds.includes(shift.id)}
                                        onChange={() => toggleSelectShift(shift.id)} />
                                    <div>
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{shift.date}</p>
                                        <h3 className="font-bold text-gray-800 leading-tight">{sitesMap[shift.siteId]?.siteName}</h3>
                                        <p className="text-xs text-gray-400 font-medium">{employersMap[shift.employerId]}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(shift.status)}`}>
                                    {shift.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50/50 border border-gray-100 p-4 rounded-3xl">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Earnings</p>
                                    <p className="font-black text-gray-900 text-lg">£{parseFloat(shift.totalEarnings).toFixed(2)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Link to={`/shift/edit/${shift.id}`} className="p-3 bg-white border border-gray-200 rounded-2xl text-indigo-600 shadow-sm"><Edit3 size={18} /></Link>
                                    <button onClick={() => handleDelete(shift.id)} className="p-3 bg-white border border-gray-200 rounded-2xl text-red-500 shadow-sm"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredShifts.length === 0 && !loading && (
                    <div className="p-20 text-center text-gray-400 flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                            <AlertCircle size={32} className="text-gray-200" />
                        </div>
                        <p className="font-bold text-gray-500 uppercase text-xs tracking-widest">No shifts matching filters</p>
                    </div>
                )}
            </div>

            {/* EXPORT MODAL */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Export Settings</h2>
                                <p className="text-sm text-gray-500 font-medium">Select columns and customize headers</p>
                            </div>
                            <button onClick={() => setIsExportModalOpen(false)} className="p-3 hover:bg-white rounded-2xl transition shadow-sm border border-gray-100 text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 max-h-[50vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {EXPORTABLE_COLUMNS.map((col) => {
                                    const isSelected = selectedCols.includes(col.id);
                                    return (
                                        <div key={col.id} className={`p-4 rounded-3xl border-2 transition-all cursor-pointer ${isSelected ? 'border-indigo-600 bg-indigo-50/30 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                            onClick={() => {
                                                setSelectedCols(prev => prev.includes(col.id) ? prev.filter(c => c !== col.id) : [...prev, col.id]);
                                            }}>
                                            <div className="flex items-center justify-between mb-3 pointer-events-none">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                                                        {isSelected && <Check size={14} />}
                                                    </div>
                                                    <span className="font-bold text-gray-700 text-sm">{col.label}</span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                                                    <label className="text-[10px] font-black uppercase text-indigo-400 ml-1">Label in CSV</label>
                                                    <input type="text" className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                                        value={customHeaders[col.id]}
                                                        onChange={(e) => setCustomHeaders({ ...customHeaders, [col.id]: e.target.value })} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                            <button onClick={handleExport} disabled={selectedCols.length === 0}
                                className="flex-1 flex items-center justify-center gap-2 py-5 bg-indigo-600 text-white rounded-[2rem] font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-200 disabled:opacity-50">
                                <Download size={20} /> Download CSV
                            </button>
                            <button onClick={() => setIsExportModalOpen(false)}
                                className="px-8 py-5 bg-white border border-gray-200 text-gray-500 rounded-[2rem] font-bold hover:bg-gray-100 transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}