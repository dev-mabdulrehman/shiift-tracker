import { doc, getDoc } from 'firebase/firestore';
import {
    Briefcase,
    Building2,
    Loader2,
    PoundSterling,
    Save
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { saveEmployer } from '../store/features/employersSlice';
// Ensure these thunks exist in your employerSlice

export default function WriteEmployer() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        defaultRate: '',
        contactEmail: '', // Optional extra field
        notes: ''
    });

    const dispatch = useDispatch();

    useEffect(() => {
        const fetchEmployer = async () => {
            if (!user || !isEditMode) return;

            try {
                const empDoc = await getDoc(doc(db, "employers", id));
                if (empDoc.exists()) {
                    const data = empDoc.data();
                    // Basic security check: ensure this employer belongs to the user
                    if (data.userId === user.uid) {
                        setFormData({
                            name: data.name || '',
                            defaultRate: data.defaultRate?.toString() || '',
                            notes: data.notes || ''
                        });
                    } else {
                        navigate('/employers');
                    }
                }
            } catch (error) {
                console.error("Error fetching employer:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmployer();
    }, [user, id, isEditMode, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);

        try {
            // Dispatching to a thunk that handles Firestore logic
            await dispatch(saveEmployer({
                formData,
                user,
                isEditMode,
                employerId: id
            }));
            navigate(-1); // Go back to previous page (either the list or the shift form)
        } catch (error) {
            console.error("Error saving employer:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
                <p className="text-gray-500 font-medium">Loading employer details...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl space-y-6 border border-gray-100">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                    <Building2 size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        {isEditMode ? 'Edit Employer' : 'New Employer'}
                    </h2>
                    <p className="text-sm text-gray-500">Manage company details and default pay rates.</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Company Name */}
                <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <Briefcase size={14} /> Company Name
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Acme Construction"
                        value={formData.name}
                        className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                {/* Default Rate */}
                <div className="md:w-1/2">
                    <label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <PoundSterling size={14} /> Default Hourly Rate (£)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={formData.defaultRate}
                        className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
                        onChange={e => setFormData({ ...formData, defaultRate: e.target.value })}
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1">Additional Notes</label>
                    <textarea
                        rows="3"
                        placeholder="Contact info, specific site requirements, etc."
                        value={formData.notes}
                        className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-50">
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
                    className={`flex-2 py-4 px-8 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${isSaving
                        ? 'bg-gray-300'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                        }`}
                >
                    {isSaving ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <Save size={20} />
                    )}
                    {isSaving ? 'Saving...' : isEditMode ? 'Update Employer' : 'Create Employer'}
                </button>
            </div>
        </form>
    );
}