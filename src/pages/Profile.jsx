import { updateEmail, updateProfile } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
    Briefcase,
    Edit2,
    Loader2,
    LogOut,
    Save,
    TrendingUp,
    User,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [careerStats, setCareerStats] = useState({ totalShifts: 0, totalEarnings: 0 });
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Message States
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        email: user?.email || '',
    });

    // Auto-clear alerts after 3 seconds
    useEffect(() => {
        if (error || message) {
            const timer = setTimeout(() => {
                setError('');
                setMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, message]);

    useEffect(() => {
        if (!user) return;
        const fetchCareerStats = async () => {
            try {
                const q = query(collection(db, "shifts"), where("userId", "==", user.uid));
                const querySnapshot = await getDocs(q);
                let earnings = 0;
                querySnapshot.forEach((doc) => {
                    earnings += (parseFloat(doc.data().totalEarnings) || 0);
                });
                setCareerStats({ totalShifts: querySnapshot.size, totalEarnings: earnings });
            } catch (err) {
                console.error("Stats fetch error:", err);
            }
        };
        fetchCareerStats();
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setMessage('');

        try {
            // 1. Update Name
            if (formData.displayName !== user.displayName) {
                await updateProfile(user, { displayName: formData.displayName });
            }

            // 2. Update Email
            if (formData.email !== user.email) {
                await updateEmail(user, formData.email);
            }

            setMessage("Profile updated successfully!");
            setIsEditing(false);
        } catch (err) {
            // Handle "requires-recent-login" error specifically
            if (err.code === 'auth/requires-recent-login') {
                setError("For security, please log out and back in to change your email.");
            } else {
                setError(err.message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="mx-auto space-y-6">
            {/* Notifications */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-xs z-50 space-y-2">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-lg text-sm animate-in fade-in slide-in-from-top-4">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl shadow-lg text-sm animate-in fade-in slide-in-from-top-4">
                        {message}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-indigo-600"></div>

                <div className="relative">
                    <div className="w-28 h-28 mx-auto mb-4 relative">
                        <div className="w-full h-full bg-gray-100 text-gray-400 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                            <User size={48} />
                        </div>
                    </div>

                    {!isEditing ? (
                        <>
                            <h1 className="text-2xl font-black text-gray-800">
                                {user?.displayName || 'Set your name'}
                            </h1>
                            <p className="text-gray-500 font-medium">{user?.email}</p>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition"
                            >
                                <Edit2 size={14} /> Edit Details
                            </button>
                        </>
                    ) : (
                        <form onSubmit={handleUpdateProfile} className="space-y-3 mt-4 text-left">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Full Name</label>
                                <input
                                    className="w-full p-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full p-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-indigo-600 text-white p-3 rounded-2xl font-bold flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="p-3 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {!isEditing && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100">
                        <Briefcase className="text-indigo-500 mb-2" size={24} />
                        <p className="text-2xl font-black text-gray-800">{careerStats.totalShifts}</p>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Shifts</p>
                    </div>
                    <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100">
                        <TrendingUp className="text-green-500 mb-2" size={24} />
                        <p className="text-2xl font-black text-gray-800">£{careerStats.totalEarnings.toFixed(0)}</p>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lifetime</p>
                    </div>
                </div>
            )}

            <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 p-5 bg-white text-red-500 font-bold rounded-4xl shadow-sm border border-gray-100 hover:bg-red-50 transition"
            >
                <LogOut size={20} />
                Sign Out
            </button>
        </div>
    );
}