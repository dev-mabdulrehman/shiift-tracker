import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function SidebarItem({ icon: Icon, label, to, active, children, badge, onClick }) {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = Boolean(children);

    return (
        <div className="w-full">
            <Link
                to={to || '#'}
                onClick={() => onClick ? onClick() : hasChildren && setIsOpen(!isOpen)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group ${active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <Icon size={20} className={active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'} />
                    <span className="font-bold text-sm tracking-tight">{label}</span>
                </div>
                {hasChildren && (
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </Link>

            {hasChildren && isOpen && (
                <div className="ml-9 mt-1 space-y-1">
                    {children}
                </div>
            )}
        </div>
    );
};

