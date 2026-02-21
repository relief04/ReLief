import React from 'react';
import { ArrowRight, Lock, Sparkles, TrendingUp } from 'lucide-react';
import { Reward } from '@/types/rewards';

interface NextRewardHighlightProps {
    nextReward: Reward | null;
    userPoints: number;
}

export default function NextRewardHighlight({ nextReward, userPoints }: NextRewardHighlightProps) {
    if (!nextReward) {
        return (
            <div className="w-full bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white mb-10 flex items-center justify-between shadow-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={16} className="text-yellow-400" />
                        <h3 className="font-bold text-lg">All Rewards Unlocked!</h3>
                    </div>
                    <p className="text-gray-400 text-sm">You are a true Eco Champion. Stay tuned for new rewards.</p>
                </div>
            </div>
        );
    }

    const pointsNeeded = nextReward.cost - userPoints;
    const progress = Math.min((userPoints / nextReward.cost) * 100, 100);

    return (
        <div className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-10 shadow-sm relative overflow-hidden group">
            {/* Decorative BG */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                {/* Icon/Image */}
                <div className="hidden md:flex w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 items-center justify-center text-gray-400">
                    <Lock size={24} />
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">
                        <TrendingUp size={12} /> Next Goal
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Unlock <span className="text-purple-600 dark:text-purple-400">{nextReward.name}</span>
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <span>{pointsNeeded} more Points needed</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-gray-400 mt-2">
                        <span>{userPoints} KP</span>
                        <span>{nextReward.cost} KP</span>
                    </div>
                </div>

                {/* CTA */}
                <div className="flex-shrink-0">
                    <button disabled className="px-5 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 font-bold text-sm cursor-not-allowed flex items-center gap-2">
                        Locked <Lock size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
