import { doc, getDoc } from 'firebase/firestore';
import { Building2, Loader2, MapPin, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { saveSite } from '../store/features/sitesSlice';

export default function WriteSite() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    // Redux State for existing employers
    const { data: employers } = useSelector((state) => state.employers);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [showEmployerSuggestions, setShowEmployerSuggestions] = useState(false);
    const empRef = useRef();

    const [formData, setFormData] = useState({
        siteName: '',
        postalCode: '',
        address: '',
        employerName: '', // Storing the name for the UI
        employerId: '',   // Storing the ID for the database relationship
        notes: ''
    });

    const dispatch = useDispatch();

    useEffect(() => {
        const fetchSiteData = async () => {
            if (!isEditMode || !user) return;

            try {
                const siteDoc = await getDoc(doc(db, "sites", id));
                if (siteDoc.exists() && siteDoc.data().userId === user.uid) {
                    const data = siteDoc.data();

                    // Match the employer name from the stored employerId
                    const matchedEmp = employers.find(emp => emp.id === data.employerId);

                    setFormData({
                        siteName: data.siteName || '',
                        postalCode: data.postalCode || '',
                        address: data.address || '',
                        employerId: data.employerId || '',
                        employerName: matchedEmp ? matchedEmp.name : (data.employerName || ''),
                        notes: data.notes || ''
                    });
                } else {
                    navigate('/sites');
                }
            } catch (error) {
                console.error("Error fetching site:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSiteData();

        // Close suggestions when clicking outside
        const handleClickOutside = (e) => {
            if (empRef.current && !empRef.current.contains(e.target)) {
                setShowEmployerSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [id, isEditMode, user, navigate, employers]);

    const handleSelectEmployer = (emp) => {
        setFormData(prev => ({
            ...prev,
            employerName: emp.name,
            employerId: emp.id
        }));
        setShowEmployerSuggestions(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);

        try {
            console.log(formData)
            await dispatch(saveSite({
                formData, // Now contains employerId and employerName
                user,
                isEditMode,
                siteId: id
            })).unwrap();

            navigate('/sites');
        } catch (error) {
            console.error("Failed to save site:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
                <p className="text-gray-500 font-medium">Loading site details...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl space-y-6 border border-gray-100 mx-auto">
            <h2 className="text-2xl font-bold text-gray-800">
                {isEditMode ? 'Edit Site' : 'Add New Site'}
            </h2>

            <div className="space-y-4">
                {/* Employer Selection */}
                <div className="relative" ref={empRef}>
                    <label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <Search size={14} /> Link to Employer
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="Search existing employers..."
                        value={formData.employerName}
                        className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
                        onChange={e => {
                            setFormData({ ...formData, employerName: e.target.value, employerId: '' });
                            setShowEmployerSuggestions(true);
                        }}
                    />
                    {showEmployerSuggestions && formData.employerName && (
                        <div className="absolute z-30 w-full bg-white border rounded-xl shadow-2xl mt-1 max-h-48 overflow-y-auto">
                            {employers
                                .filter(emp => emp.name.toLowerCase().includes(formData.employerName.toLowerCase()))
                                .map(emp => (
                                    <div
                                        key={emp.id}
                                        className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0"
                                        onClick={() => handleSelectEmployer(emp)}
                                    >
                                        <p className="font-bold text-sm text-gray-700">{emp.name}</p>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* Site Name */}
                <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <Building2 size={14} /> Site Name
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Canary Wharf"
                        value={formData.siteName}
                        className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
                        onChange={e => setFormData({ ...formData, siteName: e.target.value })}
                    />
                </div>

                {/* Postcode */}
                <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <MapPin size={14} /> Postcode
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. E14 5AB"
                        value={formData.postalCode}
                        className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
                        onChange={e => setFormData({ ...formData, postalCode: e.target.value.toUpperCase() })}
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSaving}
                    className={`flex-2 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                        }`}
                >
                    {isSaving && <Loader2 className="animate-spin" size={20} />}
                    {isSaving ? 'Saving...' : isEditMode ? 'Update Site' : 'Create Site'}
                </button>
            </div>
        </form>
    );
}