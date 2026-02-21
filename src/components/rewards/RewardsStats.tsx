import React from 'react';
import { Star, Trophy, Gift, CheckCircle2 } from 'lucide-react';

interface RewardsStatsProps {
    userPoints: number;
    stats: {
        totalCollected: number;
        totalClaimable: number;
        totalRedeemed: number;
    };
}

export default function RewardsStats({ userPoints, stats }: RewardsStatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
                icon={<Star size={20} className="text-yellow-500 dark:text-yellow-400" fill="currentColor" />}
                label="Points"
                value={userPoints}
                subValue="Available Balance"
                bgColor="bg-yellow-50 dark:bg-yellow-900/10"
                borderColor="border-yellow-200 dark:border-yellow-900/30"
            />
            <StatCard
                icon={<Trophy size={20} className="text-purple-500 dark:text-purple-400" />}
                label="Rewards Earned"
                value={stats.totalCollected}
                subValue="Lifetime Total"
                bgColor="bg-purple-50 dark:bg-purple-900/10"
                borderColor="border-purple-200 dark:border-purple-900/30"
            />
            <StatCard
                icon={<Gift size={20} className="text-blue-500 dark:text-blue-400" />}
                label="Claimable"
                value={stats.totalClaimable}
                subValue="Ready to Unlock"
                bgColor="bg-blue-50 dark:bg-blue-900/10"
                borderColor="border-blue-200 dark:border-blue-900/30"
                highlight={stats.totalClaimable > 0}
            />
            <StatCard
                icon={<CheckCircle2 size={20} className="text-green-500 dark:text-green-400" />}
                label="Redeemed"
                value={stats.totalRedeemed}
                subValue="Active Perks"
                bgColor="bg-green-50 dark:bg-green-900/10"
                borderColor="border-green-200 dark:border-green-900/30"
            />
        </div>
    );
}

function StatCard({ icon, label, value, subValue, bgColor, borderColor, highlight = false }: any) {
    return (
        <div className={`
            flex flex-col p-4 rounded-2xl border transition-all duration-300
            ${bgColor} ${borderColor}
            ${highlight ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900' : ''}
            hover:shadow-md
        `}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1">
                {value}
            </div>
            <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{subValue}</div>
        </div>
    );
}
