import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleReset = async (e) => {
        e.preventDefault();
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Check your inbox for password reset instructions.");
            setError("");
        } catch (err) {
            setError("User not found or invalid email.");
            setMessage("");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Reset Password</h2>
                <p className="text-gray-600 mb-6 text-sm">Enter your email and we'll send you a link to reset your password.</p>

                {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">{message}</div>}
                {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">{error}</div>}

                <form onSubmit={handleReset} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">
                        Send Reset Link
                    </button>
                </form>
                <div className="mt-4">
                    <Link to="/login" className="text-indigo-600 text-sm font-medium">Back to Login</Link>
                </div>
            </div>
        </div>
    );
}