import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import { useAuth } from '../context/AuthContext';
import { subscribeToEmployers } from '../store/features/employersSlice';
import { subscribeToShifts } from '../store/features/shiftSlice';
import { subscribeToSites } from '../store/features/sitesSlice';

export default function Root() {
    const { user } = useAuth();
    const dispatch = useDispatch();

    useEffect(() => {
        let unsubscribeShifts;
        let unsubscribeSites;
        let unsubscribeEmployers;

        let month = new Date().toISOString().substring(0, 7)
        dispatch(subscribeToShifts({ selectedMonth: month, uid: user.uid }))
            .then(result => {
                unsubscribeShifts = result.payload;
            });

        dispatch(subscribeToSites({ uid: user.uid }))
            .then(result => {
                unsubscribeSites = result.payload;
            });

        dispatch(subscribeToEmployers({ uid: user.uid }))
            .then(result => {
                unsubscribeSites = result.payload;
            });

        return () => {
            if (unsubscribeShifts) unsubscribeShifts();
            if (unsubscribeShifts) subscribeToSites();
            if (unsubscribeEmployers) unsubscribeEmployers();
        };
    }, [user]);

    // return (
    //     <div className="min-h-screen bg-gray-50">
    //         <Navbar />
    //         <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    //             <Outlet />
    //         </main>
    //     </div>
    // )
    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden p-4">
                <Outlet />
            </main>
        </div>
    );
}