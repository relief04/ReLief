'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator, Scan, Cloud, Trees, Users, Award, FileText, Bot } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export default function FeaturesPage() {
    const features = [
        {
            icon: <Calculator size={32} />,
            title: "Carbon Calculator",
            desc: "Track emissions from travel, energy, food, and shopping with instant breakdowns."
        },
        {
            icon: <Scan size={32} />,
            title: "AI Bill Scanner",
            desc: "Upload bills and convert usage into CO₂ automatically using advanced computer vision."
        },
        {
            icon: <Cloud size={32} />,
            title: "Live AQI Monitoring",
            desc: "Real-time air quality tracking across regions with health guidance and forecasts."
        },
        {
            icon: <Trees size={32} />,
            title: "Eco Streak Forest",
            desc: "Grow virtual plants as your sustainable habits improve. Visualize your impact."
        },
        {
            icon: <Users size={32} />,
            title: "Community Hub",
            desc: "Join groups, participate in eco-challenges, and attend local sustainability events."
        },
        {
            icon: <Award size={32} />,
            title: "Green Karma Rewards",
            desc: "Earn points for every action. Unlock badges, levels, and digital certificates."
        },
        {
            icon: <FileText size={32} />,
            title: "Reports & Certificates",
            desc: "Download detailed sustainability reports and share your certified progress."
        },
        {
            icon: <Bot size={32} />,
            title: "AI Assistant",
            desc: "Your personal eco-guide and support bot for tips, facts, and platform help."
        }
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-200 font-sans selection:bg-emerald-500/30 pb-20">
            {/* Top Navigation */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Link href="/" className="group flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-all w-fit">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 pb-24">

                <ScrollReveal>
                    <header className="text-center mb-20 space-y-4">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
                            Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Features</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            A comprehensive suite of tools designed to measure, reduce, and celebrate your climate impact.
                        </p>
                    </header>
                </ScrollReveal>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, i) => (
                        <ScrollReveal key={i} delay={i * 100} className="h-full">
                            <div className="h-full p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all group flex flex-col items-start gap-4 hover:-translate-y-2 duration-300">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent text-emerald-400 group-hover:text-emerald-300 transition-colors">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>

            </div>
        </div>
    );
}
