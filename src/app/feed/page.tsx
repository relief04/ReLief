"use client";
import React, { useState } from 'react';
import styles from './page.module.css';
import { TrendingTopics } from '@/components/community/TrendingTopics';
import { FeedView } from '@/components/community/views/FeedView';
import { GroupsView } from '@/components/community/views/GroupsView';
import { EventsView } from '@/components/community/views/EventsView';
import { StoriesView } from '@/components/community/views/StoriesView';

export default function FeedPage() {
    const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'events' | 'stories'>('feed');
    const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

    const renderContent = () => {
        switch (activeTab) {
            case 'feed': return (
                <FeedView
                    selectedHashtag={selectedHashtag}
                    onHashtagClick={setSelectedHashtag}
                />
            );
            case 'groups': return <GroupsView />;
            case 'events': return <EventsView />;
            case 'stories': return <StoriesView />;
            default: return (
                <FeedView
                    selectedHashtag={selectedHashtag}
                    onHashtagClick={setSelectedHashtag}
                />
            );
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Community Hub</h1>
                <p>Connect, share, and grow with fellow eco-warriors.</p>
            </header>

            <nav className={styles.navTabs}>
                <button
                    className={activeTab === 'feed' ? styles.activeTab : ''}
                    onClick={() => setActiveTab('feed')}
                >
                    📰 Feed
                </button>
                <button
                    className={activeTab === 'groups' ? styles.activeTab : ''}
                    onClick={() => setActiveTab('groups')}
                >
                    🤝 Groups
                </button>
                <button
                    className={activeTab === 'events' ? styles.activeTab : ''}
                    onClick={() => setActiveTab('events')}
                >
                    🗓️ Events
                </button>
                <button
                    className={activeTab === 'stories' ? styles.activeTab : ''}
                    onClick={() => setActiveTab('stories')}
                >
                    🌟 Stories
                </button>
            </nav>

            <div className={styles.layout}>
                <div className={styles.mainContent}>
                    {renderContent()}
                </div>

                {/* Show trending topics only on Feed tab */}
                {activeTab === 'feed' && (
                    <div className={styles.sidebar}>
                        <TrendingTopics onHashtagClick={(hashtag) => {
                            setSelectedHashtag(hashtag);
                        }} />
                    </div>
                )}
            </div>
        </div>
    );
}
