import React from 'react'

const HistoryFilters = ({
    selectedMonth,
    setSelectedMonth,
    searchEmployer,
    setSearchEmployer,
    searchSite,
    setSearchSite,
    statusFilter,
    setStatusFilter,
}) => {
    return (
        <div className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Month</label>
                    <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Employer</label>
                    <input type="text" placeholder="Search..." value={searchEmployer} onChange={(e) => setSearchEmployer(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Site</label>
                    <input type="text" placeholder="Search..." value={searchSite} onChange={(e) => setSearchSite(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Status</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-600">
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="on site">On Site</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>
        </div>
    )
}

export default HistoryFilters