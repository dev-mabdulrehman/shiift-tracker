import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PlusCircle, History, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    const navLinks = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Add Shift', path: '/shift/add', icon: <PlusCircle size={20} /> },
        { name: 'History', path: '/history', icon: <History size={20} /> },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="text-xl font-bold tracking-tight">
                            Shift<span className="text-indigo-200">Track</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    {user ? (
                        <div className="hidden md:flex items-center space-x-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${isActive(link.path) ? 'bg-indigo-800 text-white' : 'hover:bg-indigo-600'
                                        }`}
                                >
                                    {link.icon}
                                    <span>{link.name}</span>
                                </Link>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="ml-4 flex items-center space-x-1 bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md text-sm font-medium transition"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center space-x-4">
                            <Link to="/login" className="hover:text-indigo-200">Login</Link>
                            <Link to="/register" className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold">Register</Link>
                        </div>
                    )}

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-indigo-600">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-indigo-800 px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {user ? (
                        <>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium ${isActive(link.path) ? 'bg-indigo-900' : 'hover:bg-indigo-700'
                                        }`}
                                >
                                    {link.icon}
                                    <span>{link.name}</span>
                                </Link>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center space-x-2 px-3 py-3 text-red-300 font-medium"
                            >
                                <LogOut size={20} />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="block px-3 py-2">Login</Link>
                            <Link to="/register" className="block px-3 py-2">Register</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}