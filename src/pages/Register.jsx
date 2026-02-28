import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                navigate('/login');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [message]);

    const validatePassword = (pass) => {
        const minLength = 8;
        const hasCapital = /[A-Z]/.test(pass);
        const hasNumber = /\d/.test(pass);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

        if (pass.length < minLength) return "Password must be at least 8 characters.";
        if (!hasCapital) return "Password must include at least one capital letter.";
        if (!hasNumber) return "Password must include at least one number.";
        if (!hasSpecial) return "Password must include at least one special character.";
        return null;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true)
        setError(''); // Clear previous errors

        const validationError = validatePassword(password);
        if (validationError) {
            setError(validationError);
            setLoading(false);
            return;
        }

        try {
            // 1. Create the user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // 2. Update the profile to include the Display Name
            await updateProfile(userCredential.user, {
                displayName: name
            });

            setMessage('Account created! Check your inbox to verify.')

        } catch (err) {
            // Handle specific Firebase errors for better UX
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false)
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Create Account</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                        <span>{error}</span>
                    </div>
                )}

                {message && (
                    <div className="bg-red-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                        <span>{message}</span>
                    </div>
                )}
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                            Min. 8 chars, 1 uppercase, 1 number, 1 special char.
                        </p>
                    </div>

                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition duration-200 shadow-md"
                    >
                        Sign Up
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Already have an account? <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
}