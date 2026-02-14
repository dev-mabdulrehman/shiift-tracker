import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
    collection, addDoc, query, where, getDocs,
    updateDoc, doc, getDoc, serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { calculateEndTime } from '../utils/timeCalc';
import {
    MapPin, Building2, PoundSterling,
    Calendar, Clock, Loader2, ArrowLeft
} from 'lucide-react';

export default function WriteShift() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // Detects ID from /shift/edit/:id
    const isEditMode = !!id;

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        siteName: '',
        postalCode: '',
        employer: '',
        hourlyRate: '',
        startTime: '',
        hours: ''
    });

    // Calculated End Time State
    const [endTimeDisplay, setEndTimeDisplay] = useState('--:--');

    // Suggestions & Database Data
    const [dbEmployers, setDbEmployers] = useState([]);
    const [dbSites, setDbSites] = useState([]);
    const [showEmployerSuggestions, setShowEmployerSuggestions] = useState(false);
    const [showSiteSuggestions, setShowSiteSuggestions] = useState(false);

    const empRef = useRef();
    const siteRef = useRef();

    useEffect(() => {
        if (!id) {
            // Reset to initial state
            setFormData({
                date: new Date().toISOString().split('T')[0],
                siteName: '',
                postalCode: '',
                employer: '',
                hourlyRate: '',
                startTime: '',
                hours: ''
            });
            setEndTimeDisplay('--:--');
            setIsLoading(false); // Make sure it's not stuck in loading
        }
    }, [id]); // Triggers whenever the ID in the URL changes

    // 1. Initial Fetch: Metadata & Existing Shift (if editing)
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // Fetch Employers and Sites for suggestions
                const empQ = query(collection(db, "employers"), where("userId", "==", user.uid));
                const siteQ = query(collection(db, "sites"), where("userId", "==", user.uid));
                const [empSnap, siteSnap] = await Promise.all([getDocs(empQ), getDocs(siteQ)]);

                const emps = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const sites = siteSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                setDbEmployers(emps);
                setDbSites(sites);

                // If Editing, fetch the shift document
                if (isEditMode) {
                    const shiftDoc = await getDoc(doc(db, "shifts", id));
                    if (shiftDoc.exists() && shiftDoc.data().userId === user.uid) {
                        const data = shiftDoc.data();

                        // Map IDs back to names for the form
                        const matchedEmp = emps.find(e => e.id === data.employerId);
                        const matchedSite = sites.find(s => s.id === data.siteId);

                        // Ensure startTime is in HH:mm format
                        let formattedTime = data.startTime || '';

                        // If the time is "9:00", pad it to "09:00"
                        if (formattedTime && formattedTime.length === 4 && formattedTime.includes(':')) {
                            formattedTime = '0' + formattedTime;
                        }

                        setFormData({
                            date: data.date,
                            startTime: formattedTime,
                            hours: data.hours.toString(),
                            hourlyRate: data.hourlyRate.toString(),
                            employer: matchedEmp ? matchedEmp.name : '',
                            siteName: matchedSite ? matchedSite.siteName : '',
                            postalCode: matchedSite ? matchedSite.postalCode : ''
                        });
                    } else {
                        alert("Shift not found or access denied.");
                        navigate('/history');
                    }
                }
            } catch (error) {
                console.error("Initialization error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        const handleClickOutside = (e) => {
            if (empRef.current && !empRef.current.contains(e.target)) setShowEmployerSuggestions(false);
            if (siteRef.current && !siteRef.current.contains(e.target)) setShowSiteSuggestions(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [user, id, isEditMode, navigate]);

    // 2. Real-time End Time Update
    useEffect(() => {
        if (formData.date && formData.startTime && formData.hours) {
            const calculated = calculateEndTime(formData.date, formData.startTime, formData.hours);
            setEndTimeDisplay(calculated || '--:--');
        } else {
            setEndTimeDisplay('--:--');
        }
    }, [formData.date, formData.startTime, formData.hours]);

    const handleSelectEmployer = (emp) => {
        setFormData(prev => ({
            ...prev,
            employer: emp.name,
            hourlyRate: emp.defaultRate || ''
        }));
        setShowEmployerSuggestions(false);
    };

    const handleSelectSite = (site) => {
        setFormData(prev => ({
            ...prev,
            siteName: site.siteName,
            postalCode: site.postalCode
        }));
        setShowSiteSuggestions(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);

        try {
            // A. Handle Employer Logic
            let employerId;
            const existingEmp = dbEmployers.find(item => item.name.toLowerCase().trim() === formData.employer.toLowerCase().trim());

            if (existingEmp) {
                employerId = existingEmp.id;
                if (parseFloat(formData.hourlyRate) !== parseFloat(existingEmp.defaultRate)) {
                    const confirmUpdate = window.confirm(`Update default rate for ${existingEmp.name}?`);
                    if (confirmUpdate) {
                        await updateDoc(doc(db, "employers", existingEmp.id), { defaultRate: formData.hourlyRate });
                    }
                }
            } else {
                const newEmpRef = await addDoc(collection(db, "employers"), {
                    name: formData.employer.trim(),
                    defaultRate: formData.hourlyRate,
                    userId: user.uid,
                    createdAt: serverTimestamp()
                });
                employerId = newEmpRef.id;
            }

            // B. Handle Site Logic
            const existingSite = dbSites.find(item => item.siteName.toLowerCase().trim() === formData.siteName.toLowerCase().trim());
            let siteId;
            if (existingSite) {
                siteId = existingSite.id;
            } else {
                const newSiteRef = await addDoc(collection(db, "sites"), {
                    siteName: formData.siteName.trim(),
                    postalCode: formData.postalCode.toUpperCase().trim(),
                    userId: user.uid,
                    createdAt: serverTimestamp()
                });
                siteId = newSiteRef.id;
            }

            // C. Save or Update Shift Record
            const rate = parseFloat(formData.hourlyRate) || 0;
            const hrs = parseFloat(formData.hours) || 0;

            const shiftPayload = {
                date: formData.date,
                startTime: formData.startTime,
                endTime: endTimeDisplay,
                hours: hrs,
                hourlyRate: rate,
                totalEarnings: rate * hrs,
                employerId,
                siteId,
                userId: user.uid,
                updatedAt: serverTimestamp()
            };

            if (isEditMode) {
                await updateDoc(doc(db, "shifts", id), shiftPayload);
            } else {
                await addDoc(collection(db, "shifts"), {
                    ...shiftPayload,
                    status: "pending",
                    createdAt: serverTimestamp()
                });
            }

            navigate('/history');
        } catch (error) {
            console.error("Save error:", error);
            alert("Error saving shift.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
                <p className="text-gray-500 font-medium">Loading shift details...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl space-y-6 border border-gray-100">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {isEditMode ? 'Edit Shift' : 'Add New Shift'}
                    </h2>
                    <Link to="/history" className="text-gray-400 hover:text-gray-600 transition">
                        <ArrowLeft size={20} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date */}
                    <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><Calendar size={14} /> Date</label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    {/* Employer */}
                    <div className="relative" ref={empRef}>
                        <label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><Building2 size={14} /> Employer</label>
                        <input
                            type="text"
                            value={formData.employer}
                            required
                            autoComplete="off"
                            placeholder="Company Name"
                            className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
                            onChange={e => { setFormData({ ...formData, employer: e.target.value }); setShowEmployerSuggestions(true); }}
                        />
                        {showEmployerSuggestions && formData.employer && (
                            <div className="absolute z-30 w-full bg-white border rounded-xl shadow-2xl mt-1 max-h-48 overflow-y-auto">
                                {dbEmployers.filter(emp => emp.name.toLowerCase().includes(formData.employer.toLowerCase())).map(emp => (
                                    <div key={emp.id} className="p-3 hover:bg-indigo-50 cursor-pointer text-sm border-b last:border-0"
                                        onClick={() => handleSelectEmployer(emp)}>
                                        <p className="font-bold">{emp.name}</p>
                                        <p className="text-xs text-gray-400">Usual Rate: £{emp.defaultRate}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Site */}
                <div className="relative" ref={siteRef}>
                    <label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><MapPin size={14} /> Site Name</label>
                    <input
                        type="text"
                        value={formData.siteName}
                        required
                        autoComplete="off"
                        placeholder="e.g. Tata Steel"
                        className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
                        onChange={e => { setFormData({ ...formData, siteName: e.target.value }); setShowSiteSuggestions(true); }}
                    />
                    {showSiteSuggestions && formData.siteName && (
                        <div className="absolute z-30 w-full bg-white border rounded-xl shadow-2xl mt-1 max-h-48 overflow-y-auto">
                            {dbSites.filter(s => s.siteName.toLowerCase().includes(formData.siteName.toLowerCase())).map(site => (
                                <div key={site.id} className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0"
                                    onClick={() => handleSelectSite(site)}>
                                    <p className="text-sm font-bold">{site.siteName}</p>
                                    <p className="text-xs text-gray-400">{site.postalCode}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 text-center block">Postcode</label>
                        <input
                            type="text"
                            value={formData.postalCode}
                            required
                            className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                            onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 text-center block">Start</label>
                        <input
                            type="time"
                            required
                            value={formData.startTime}
                            className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 text-center block">Hours</label>
                        <input
                            type="number"
                            step="0.1"
                            required
                            value={formData.hours}
                            placeholder="12"
                            className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                            onChange={e => setFormData({ ...formData, hours: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 mb-1 block text-center uppercase">Est. End</label>
                        <div className="p-3 bg-indigo-50 rounded-xl text-center font-bold text-indigo-700 h-12.5 flex items-center justify-center border border-indigo-100">
                            {endTimeDisplay}
                        </div>
                    </div>
                </div>

                <div className="md:w-1/2">
                    <label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><PoundSterling size={14} /> Hourly Rate (£)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.hourlyRate}
                        required
                        className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
                        onChange={e => setFormData({ ...formData, hourlyRate: e.target.value })}
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/history')}
                        className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className={`flex-2 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'}`}
                    >
                        {isSaving && <Loader2 className="animate-spin" size={20} />}
                        {isSaving ? 'Saving...' : isEditMode ? 'Update Record' : 'Save Record'}
                    </button>
                </div>
            </form>
        </div>
    );
}