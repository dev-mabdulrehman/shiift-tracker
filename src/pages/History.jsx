import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase';
import {
    collection, query, where, orderBy, onSnapshot, doc,
    deleteDoc, updateDoc, getDocs, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
    MapPin, Building2, Trash2, Search, Download, Upload,
    Loader2, AlertCircle, Clock, Hash, TrendingUp, Edit3, X
} from 'lucide-react';
import Papa from 'papaparse';
import StatsOverview from '../components/StatsOverview';
import HistoryFilters from '../components/HistoryFilters';
import { Link } from 'react-router-dom';

export default function History() {
    const { user } = useAuth();
    const fileInputRef = useRef();

    // 1. FILTER & DATA STATES
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchEmployer, setSearchEmployer] = useState('');
    const [searchSite, setSearchSite] = useState('');
    const [shifts, setShifts] = useState([]);
    const [employersMap, setEmployersMap] = useState({});
    const [sitesMap, setSitesMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // EDIT MODAL STATE
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState(null);

    // 2. METADATA & DATA FETCHING
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

    // 3. FILTERING & STATS CALCULATIONS
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

    // 4. CRUD ACTIONS
    const handleEditClick = (shift) => {
        setEditingShift({ ...shift });
        setIsEditModalOpen(true);
    };

    const handleUpdateShift = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const shiftRef = doc(db, "shifts", editingShift.id);
            // Re-calculate earnings based on potentially edited hours/rate
            const calculatedTotal = (parseFloat(editingShift.hours) * parseFloat(editingShift.hourlyRate)).toFixed(2);

            await updateDoc(shiftRef, {
                date: editingShift.date,
                startTime: editingShift.startTime,
                endTime: editingShift.endTime,
                hours: parseFloat(editingShift.hours),
                hourlyRate: parseFloat(editingShift.hourlyRate),
                totalEarnings: parseFloat(calculatedTotal),
                status: editingShift.status
            });
            setIsEditModalOpen(false);
        } catch (err) {
            console.error(err);
            alert("Failed to update shift.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this shift?")) {
            await deleteDoc(doc(db, "shifts", id));
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'on site': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // 5. IMPORT/EXPORT (Standard PapaParse implementation)
    const handleExport = () => {
        const rows = filteredShifts.map(s => ({
            'Date': s.date,
            'Site': sitesMap[s.siteId]?.siteName,
            'Hours': s.hours,
            'Total': `£${s.totalEarnings}`,
            'Status': s.status
        }));
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Shifts_${selectedMonth}.csv`;
        a.click();
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

                    // Get today's date in YYYY-MM-DD format for comparison
                    const now = new Date();
                    const todayISO = now.toISOString().split('T')[0];

                    // Create a reference date for "future" vs "past"
                    const todayMidnight = new Date(todayISO);

                    let localEmpCache = [...emps];
                    let localSiteCache = [...sites];

                    for (const row of results.data) {
                        if (!row.Date || !row.Employer) continue;

                        // Parse Date from M/D/YYYY to YYYY-MM-DD
                        const [m, d, y] = row.Date.split('/');
                        const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                        const shiftDateObj = new Date(isoDate);

                        // Resolve Employer
                        let empId;
                        const empName = row.Employer.trim();
                        const existingEmp = localEmpCache.find(e => e.name.toLowerCase() === empName.toLowerCase());
                        if (existingEmp) {
                            empId = existingEmp.id;
                        } else {
                            const newEmpRef = doc(collection(db, "employers"));
                            batch.set(newEmpRef, { name: empName, userId: user.uid, createdAt: serverTimestamp() });
                            empId = newEmpRef.id;
                            localEmpCache.push({ id: empId, name: empName });
                        }

                        // Resolve Site
                        let siteId;
                        const siteName = row.Site?.trim();
                        const existingSite = localSiteCache.find(s => s.siteName.toLowerCase() === siteName?.toLowerCase());
                        if (existingSite) {
                            siteId = existingSite.id;
                        } else {
                            const newSiteRef = doc(collection(db, "sites"));
                            batch.set(newSiteRef, { siteName, postalCode: row['Postal Code'] || '', userId: user.uid, createdAt: serverTimestamp() });
                            siteId = newSiteRef.id;
                            localSiteCache.push({ id: siteId, siteName });
                        }

                        // --- UPDATED DYNAMIC STATUS LOGIC ---
                        let finalStatus;

                        if (isoDate === todayISO) {
                            // 1. If date is today, set to 'on site'
                            finalStatus = 'on site';
                        } else if (shiftDateObj > todayMidnight) {
                            // 2. If date is in the future, set to 'pending'
                            finalStatus = 'pending';
                        } else {
                            // 3. If date is in the past, use CSV status or default to 'completed'
                            finalStatus = row.Status?.toLowerCase() || 'completed';
                        }

                        const newShiftRef = doc(collection(db, "shifts"));
                        batch.set(newShiftRef, {
                            userId: user.uid,
                            date: isoDate,
                            startTime: row['Start Time'] || '',
                            endTime: row['End Time'] || '',
                            hours: parseFloat(row['Hours in Decimal']) || 0,
                            hourlyRate: parseFloat(row['Hourly Rate']?.replace(/[£,]/g, '')) || 0,
                            totalEarnings: parseFloat(row['Total']?.replace(/[£,]/g, '')) || 0,
                            status: finalStatus,
                            employerId: empId,
                            siteId: siteId,
                            createdAt: serverTimestamp()
                        });
                    }

                    await batch.commit();
                    alert("Import successful!");
                } catch (err) {
                    console.error("Import Error:", err);
                    alert("Import failed. Check console for details.");
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    return (
        <div className="space-y-6 mx-auto p-4 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Shift History</h1>
                    <p className="text-gray-500">Manage and review your work records</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm">
                        <Download size={18} /> Export
                    </button>
                    <button onClick={() => fileInputRef.current.click()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 transition shadow-md">
                        <Upload size={18} /> Import
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImport} />
                </div>
            </div>

            {/* Stats Overview */}
            <StatsOverview stats={stats}/>

            {/* Filters */}
            <HistoryFilters
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                searchEmployer={searchEmployer}
                setSearchEmployer={setSearchEmployer}
                searchSite={searchSite}
                setSearchSite={setSearchSite}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
            />

            {/* Desktop Table */}
            <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="hidden md:table w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="p-5 text-xs font-bold text-gray-400 uppercase">Date & Hours</th>
                            <th className="p-5 text-xs font-bold text-gray-400 uppercase">Employer & Site</th>
                            <th className="p-5 text-xs font-bold text-gray-400 uppercase text-center">Earnings</th>
                            <th className="p-5 text-xs font-bold text-gray-400 uppercase text-center">Status</th>
                            <th className="p-5 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredShifts.map(shift => (
                            <tr key={shift.id} className="hover:bg-indigo-50/20 transition">
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
                                    <p className="text-[10px] text-gray-400">£{shift.hourlyRate}/h</p>
                                </td>
                                <td className="p-5 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(shift.status)}`}>
                                        {shift.status}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <div className="flex justify-end gap-1">
                                        <Link to={`/shift/edit/${shift.id}`} onClick={() => handleEditClick(shift)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition">
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

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {filteredShifts.map(shift => (
                        <div key={shift.id} className="p-5 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-indigo-500">{shift.date}</p>
                                    <h3 className="font-bold text-gray-800">{sitesMap[shift.siteId]?.siteName}</h3>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(shift.status)}`}>
                                    {shift.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Earnings</p>
                                    <p className="font-bold text-gray-900">£{parseFloat(shift.totalEarnings).toFixed(2)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditClick(shift)} className="p-2 bg-white border border-gray-100 rounded-xl text-indigo-600 shadow-sm"><Edit3 size={18} /></button>
                                    <button onClick={() => handleDelete(shift.id)} className="p-2 bg-white border border-gray-100 rounded-xl text-red-500 shadow-sm"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredShifts.length === 0 && !loading && (
                    <div className="p-20 text-center text-gray-400 flex flex-col items-center gap-4">
                        <AlertCircle size={48} className="text-gray-100" />
                        <p className="font-medium">No shifts found for this criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}