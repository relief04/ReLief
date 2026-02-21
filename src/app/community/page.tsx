'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Zap, Heart, HandHeart, Calendar, Share2 } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export default function CommunityPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-200 font-sans selection:bg-emerald-500/30 pb-20">
            {/* Nav */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Link href="/" className="group flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-all w-fit">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>
            </div>

            <main className="max-w-5xl mx-auto px-6 space-y-24">

                <ScrollReveal>
                    <header className="text-center space-y-6">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
                            The ReLief <span className="text-emerald-400">Community</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            The ReLief Community connects eco-conscious individuals to collaborate for greater impact.
                        </p>
                    </header>
                </ScrollReveal>

                <section>
                    <ScrollReveal>
                        <h2 className="text-2xl font-bold text-white mb-8 border-l-4 border-emerald-500 pl-4">What You Can Do</h2>
                    </ScrollReveal>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: <Users />, title: "Join Eco Groups", desc: "Connect with schools, neighborhoods, or corporate teams." },
                            { icon: <Zap />, title: "Participate in Challenges", desc: "Push your limits with monthly environmental goals." },
                            { icon: <Share2 />, title: "Share Stories", desc: "Post your achievements and inspire others to act." },
                            { icon: <Heart />, title: "Support Others", desc: "Engage with likes and comments to earn karma points." },
                            { icon: <Calendar />, title: "Attend Events", desc: "Find local sustainability meetups and workshops." },
                            { icon: <HandHeart />, title: "Collective Impact", desc: "Together, small actions become powerful change." }
                        ].map((item, i) => (
                            <ScrollReveal key={i} delay={i * 100} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all group">
                                <div className="mb-4 p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-gray-400 text-sm">{item.desc}</p>
                            </ScrollReveal>
                        ))}
                    </div>
                </section>

                <ScrollReveal className="text-center p-12 rounded-3xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <p className="text-2xl font-medium text-white mb-8">
                        "Together, small actions become powerful collective change."
                    </p>
                    <Link href="/feed">
                        <span className="inline-block px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25 cursor-pointer">
                            Go to Community Feed
                        </span>
                    </Link>
                </ScrollReveal>

            </main>
        </div>
    );
}
