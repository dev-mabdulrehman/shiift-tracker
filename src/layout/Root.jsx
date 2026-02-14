import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Root() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* The navigation bar we created in the previous step */}
            <Navbar />

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <Outlet />
            </main>

            {/* Optional: Add a simple footer or persistent player/widgets here */}
        </div>
    )
}