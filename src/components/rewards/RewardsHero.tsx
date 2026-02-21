import React from 'react';
import { Star, Trophy, Gift, CheckCircle2, TrendingUp } from 'lucide-react';

interface RewardsHeroProps {
    userPoints: number;
    stats: {
        totalCollected: number;
        totalClaimable: number;
        totalRedeemed: number;
    };
    nextUnlockCost: number | null;
}

export default function RewardsHero({ userPoints, stats, nextUnlockCost }: RewardsHeroProps) {
    // Calculate progress to next reward if applicable
    const progressPercent = nextUnlockCost
        ? Math.min((userPoints / nextUnlockCost) * 100, 100)
        : 100;

    return (
        <div className="relative w-full rounded-3xl overflow-hidden mb-10 text-white shadow-2xl">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0">
                <div className="absolute top-0 left-0 w-full h-full opacity-30">
                    <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] rounded-full bg-purple-600 blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600 blur-[100px] opacity-70"></div>
                    <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full bg-teal-500 blur-[80px] opacity-40 animate-bounce transition-all duration-[5000ms]"></div>
                </div>
                {/* Mesh Pattern Overlay (Optional) */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 px-8 py-10 md:py-14 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wider uppercase mb-4 text-teal-300">
                    <TrendingUp size={12} /> Level Up Your Impact
                </div>

                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent drop-shadow-sm">
                    Rewards Center
                </h1>
                <p className="text-lg md:text-xl text-gray-400 font-light max-w-2xl mx-auto mb-0 leading-relaxed">
                    Collect rewards by completing eco missions and reducing your footprint.
                </p>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, subValue, glowColor, highlight = false }: any) {
    return (
        <div
            className={`
                relative group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300
                ${highlight ? 'bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-black/20 border-white/10 hover:bg-white/5'}
                backdrop-blur-sm
            `}
            style={{
                boxShadow: highlight ? `0 0 15px ${glowColor}` : 'none'
            }}
        >
            <div className="mb-2 p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                {icon}
            </div>
            <div className="text-2xl md:text-3xl font-bold text-white mb-0.5 tracking-tight group-hover:scale-105 transition-transform">{value}</div>
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">{label}</div>
            <div className="text-[10px] text-gray-500 font-medium">{subValue}</div>
        </div>
    );
}
