import { Link, useLocation } from 'react-router-dom';

const SidebarLink = ({ to, children }) => {
    let location = useLocation();
    let active = location.pathname == to;
    return (
        <Link to={to} className={`flex items-center justify-between py-2 px-3 rounded-xl text-sm font-bold ${active ? 'text-emerald-500 bg-emerald-50/50' : 'text-gray-400 hover:text-gray-600'} `}>
            {children}
        </Link>
    )
}

export default SidebarLink