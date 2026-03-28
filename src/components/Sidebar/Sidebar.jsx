import { signOut } from 'firebase/auth';
import {
    BriefcaseBusiness,
    FolderOpen,
    LayoutDashboard,
    LogOut, Search,
    UserCircle
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import SidebarItem from './SidebarItem';
import SidebarLink from './SidebarLink';


export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    return (
        <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col p-6 sticky top-0">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8 px-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-1 bg-white rounded-full rotate-45" />
                </div>
                <span className="text-xl font-black text-gray-800 tracking-tighter">Shift Tracker</span>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-100 outline-none placeholder:text-gray-400 font-medium"
                />
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto space-y-6">
                <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 ml-4">Main</p>
                    <div className="space-y-1">
                        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" active={location.pathname === '/'} />

                        <SidebarItem icon={BriefcaseBusiness} label="Shifts">
                            <SidebarLink to='/shifts'>View Shifts</SidebarLink>
                            <SidebarLink to='/shifts/add'>Add Shift</SidebarLink>
                        </SidebarItem>

                        <SidebarItem icon={FolderOpen} label="Employers">
                            <SidebarLink to='/employers'>View Employers</SidebarLink>
                            <SidebarLink to='/employers/add'>Add Employers</SidebarLink>
                        </SidebarItem>

                        <SidebarItem icon={FolderOpen} label="Sites">
                            <SidebarLink to='/sites'>View Sites</SidebarLink>
                            <SidebarLink to='/sites/add'>Add Sites</SidebarLink>
                        </SidebarItem>

                        <SidebarItem icon={UserCircle} label="My Profile" to="/profile" />
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 ml-4">Other</p>
                    <div className="space-y-1">
                        {/* <SidebarItem icon={HelpCircle} label="Help" to="/help" /> */}
                        <SidebarItem icon={LogOut} label="Logout"  onClick={handleLogout}/>
                    </div>
                </div>
            </div>
        </div>
    );
}