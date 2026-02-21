import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function EarningsChart({ shifts, view }) {
    const data = useMemo(() => {
        const stats = {};

        shifts.forEach(shift => {
            const date = new Date(shift.date);
            let label;

            if (view === 'year') {
                label = date.getFullYear().toString();
            } else if (view === 'month') {
                label = date.toLocaleString('default', { month: 'short' });
            } else {
                // Weekly - gets the start of the week (Monday)
                const day = date.getDay() || 7;
                date.setHours(-24 * (day - 1));
                label = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
            }

            stats[label] = (stats[label] || 0) + (parseFloat(shift.totalEarnings) || 0);
        });

        return Object.keys(stats).map(key => ({
            name: key,
            earnings: stats[key]
        })).reverse(); // Reverse to show chronological order
    }, [shifts, view]);

    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(value) => `£${value}`}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`£${value.toFixed(2)}`, 'Earnings']}
                    />
                    <Area
                        type="monotone"
                        dataKey="earnings"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorEarnings)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}