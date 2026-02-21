// ReLief AI Assistant Knowledge Base
// This file contains all platform features, formulas, and workflows for RAG retrieval

export interface KnowledgeEntry {
    id: string;
    category: string;
    title: string;
    content: string;
    keywords: string[];
}

export const RELIEF_KNOWLEDGE: KnowledgeEntry[] = [
    // CARBON CALCULATOR
    {
        id: 'carbon-calc-overview',
        category: 'carbon-calculator',
        title: 'Carbon Calculator Overview',
        content: `The ReLief Carbon Calculator helps you track your carbon footprint across three main categories:

**Travel Emissions:**
- Formula: Distance (km) × 0.2 kg CO₂
- Example: 10km car trip = 2kg CO₂

**Electricity Emissions:**
- Formula: Usage (kWh) × 0.5 kg CO₂
- Example: 100 kWh = 50kg CO₂

**Food Emissions (weekly):**
- Meat-heavy diet: 25 kg CO₂/week
- Omnivore: 15 kg CO₂/week
- Vegetarian: 8 kg CO₂/week
- Vegan: 5 kg CO₂/week

Users can log their activities and see real-time breakdowns of their emissions.`,
        keywords: ['carbon', 'calculator', 'emissions', 'footprint', 'travel', 'electricity', 'food', 'calculate', 'formula']
    },
    {
        id: 'carbon-calc-usage',
        category: 'carbon-calculator',
        title: 'How to Use Carbon Calculator',
        content: `To calculate your carbon footprint:

1. Navigate to the Calculator page
2. Enter your travel distance (in km)
3. Enter electricity usage (in kWh)
4. Select your diet type
5. Click "Calculate" to see your total emissions and breakdown
6. Results show total CO₂ and breakdown by category
7. Activities are automatically logged to your profile

You can access the calculator from the Dashboard or navigation menu.`,
        keywords: ['how to', 'use', 'calculator', 'log', 'track', 'emissions']
    },

    // AQI SYSTEM
    {
        id: 'aqi-overview',
        category: 'aqi',
        title: 'Air Quality Index (AQI) System',
        content: `ReLief provides real-time Air Quality Index (AQI) data for locations across India.

**AQI Categories:**
- 0-50: Good (Green)
- 51-100: Moderate (Yellow)
- 101-200: Unhealthy for Sensitive Groups (Orange)
- 201-300: Unhealthy (Red)
- 301-400: Very Unhealthy (Purple)
- 401+: Hazardous (Maroon)

**Features:**
- Live AQI data for your location
- 7-day forecast
- Historical pollution graphs
- Health recommendations based on AQI level
- Location search for cities across India

The AQI page updates automatically and provides actionable health advice.`,
        keywords: ['aqi', 'air quality', 'pollution', 'forecast', 'health', 'location', 'india']
    },

    // ECO STREAK FOREST
    {
        id: 'streak-forest-overview',
        category: 'streak-forest',
        title: 'Eco Streak Forest System',
        content: `The Eco Streak Forest gamifies daily engagement with ReLief.

**How it Works:**
- Log in daily to maintain your streak
- Each consecutive day adds to your streak counter
- Your virtual forest grows as your streak increases
- Trees are added based on streak milestones
- Missing a day breaks your streak (resets to 0)

**Streak Tracking:**
- Current streak: Number of consecutive login days
- Longest streak: Your personal best
- Login history: Calendar view of all login days

**Forest Growth:**
- Streaks unlock different tree types
- Higher streaks = more lush forest
- Visual representation of your consistency

Access your forest from the Forest page in the navigation menu.`,
        keywords: ['streak', 'forest', 'daily', 'login', 'trees', 'growth', 'consistency', 'gamification']
    },

    // REWARDS & POINTS
    {
        id: 'karma-points-overview',
        category: 'rewards',
        title: 'Points & Rewards System',
        content: `Points are ReLief's virtual currency earned through eco-friendly actions.

**How to Earn Points:**
- Pass quiz levels (varies by level)
- Log carbon-reducing activities
- Maintain daily streaks (streak bonuses)
- Earn badges (points rewards per badge)
- Participate in community events

**How to Spend Points:**
- Redeem virtual rewards in the Marketplace
- Unlock exclusive items
- Purchase eco-themed digital goods

**Checking Your Balance:**
- View on Dashboard (top stats)
- See detailed breakdown in Rewards page
- Track earning history in Profile

Points have no real-world monetary value and are for gamification only.`,
        keywords: ['karma', 'points', 'rewards', 'earn', 'spend', 'balance', 'kp', 'currency']
    },

    // QUIZ SYSTEM
    {
        id: 'quiz-system-overview',
        category: 'quiz',
        title: 'Quiz System & Certificates',
        content: `ReLief features a 3-level sustainability quiz system.

**Quiz Structure:**
- Level 1: Beginner (10 questions)
- Level 2: Intermediate (10 questions)
- Level 3: Advanced (10 questions)

**Passing Criteria:**
- Must answer 7 out of 10 questions correctly
- Questions are multiple choice (A, B, C, D)
- Each question has an explanation after answering

**Certificate:**
- Complete all 3 levels to earn a certificate
- Certificate includes your name and completion date
- Unique certificate ID for verification
- Can be downloaded as PDF
- Shareable on social media

**Progress Tracking:**
- See which levels you've completed
- View your scores for each level
- Retry failed levels unlimited times

Access quizzes from the Quiz page in the navigation menu.`,
        keywords: ['quiz', 'test', 'certificate', 'levels', 'questions', 'pass', 'sustainability', 'trivia']
    },

    // BADGES
    {
        id: 'badges-system-overview',
        category: 'badges',
        title: 'Badges & Achievements',
        content: `Badges recognize your sustainability achievements on ReLief.

**Badge Categories:**
- Carbon: Carbon reduction achievements (🌍)
- Streak: Consistency rewards (🔥)
- Community: Social engagement (🤝)
- Action: Specific eco-actions (⚡)
- Milestone: Major accomplishments (🏆)

**Rarity Levels:**
- Common: Entry-level achievements
- Rare: Moderate difficulty
- Epic: Challenging goals
- Legendary: Elite accomplishments

**Requirement Types:**
Examples include:
- Activities count (e.g., log 50 activities)
- Carbon saved (e.g., save 100 kg CO₂)
- Streak days (e.g., 30-day streak)
- Karma earned (e.g., earn 5000 KP)

**Badge Rewards:**
- Each badge awards Points
- Higher rarity = more Points
- Badges displayed on your profile
- Progress tracking for unearned badges

View all badges in the Badges page.`,
        keywords: ['badges', 'achievements', 'awards', 'rarity', 'carbon', 'streak', 'community', 'milestone']
    },

    // BILL SCANNER
    {
        id: 'bill-scanner-overview',
        category: 'bill-scanner',
        title: 'Bill Scanner & OCR',
        content: `The Bill Scanner uses AI to convert electricity bills into carbon emissions.

**How it Works:**
1. Navigate to the Scanner page
2. Upload a photo of your electricity bill
3. AI OCR extracts kWh usage
4. System calculates carbon emissions (kWh × 0.5)
5. Results are logged to your profile

**Supported Bills:**
- Electricity bills (primary focus)
- Must show clear kWh usage
- Works with most Indian utility formats

**Technology:**
- ML service for OCR (optical character recognition)
- Automatic data extraction
- Carbon conversion formula applied

This feature makes tracking electricity emissions effortless.`,
        keywords: ['bill', 'scanner', 'ocr', 'electricity', 'upload', 'ai', 'automatic', 'photo']
    },

    // COMMUNITY
    {
        id: 'community-overview',
        category: 'community',
        title: 'Community Features',
        content: `ReLief's community features help you connect with other eco-warriors.

**Features:**
- Community Feed: Share posts, updates, and achievements
- Eco Buddies: Connect with friends
- Teams: Join or create sustainability teams
- Leaderboards: Compete on carbon savings, streaks, or Points
- Events: Join real-world sustainability events

**Leaderboard Categories:**
- Carbon Savings: Who saved the most CO₂
- Streak: Longest current streaks
- Points: Highest Points earners

**Social Sharing:**
- Share achievements on social media
- Invite friends to join ReLief
- Celebrate milestones together

Access community features from the Community/Feed pages.`,
        keywords: ['community', 'social', 'friends', 'buddies', 'teams', 'leaderboard', 'feed', 'posts', 'share']
    },

    // REPORTS & EXPORTS
    {
        id: 'reports-exports-overview',
        category: 'reports',
        title: 'Reports & Data Exports',
        content: `ReLief allows you to generate detailed reports of your sustainability journey.

**Report Types:**
- Carbon Footprint Report: Complete emissions breakdown
- Activity History: All logged actions
- Progress Timeline: Visual journey over time

**Export Formats:**
- PDF: Formatted reports with charts
- CSV: Raw data for analysis in Excel/Sheets

**Report Contents:**
- Total emissions by category
- Emissions over time (weekly/monthly charts)
- Carbon savings achieved
- Streak history
- Badges earned
- Points earned
- Recommendations

**How to Generate:**
1. Go to Profile or Dashboard
2. Click "Generate Report" or "Export Data"
3. Select format (PDF/CSV)
4. Download your report

Reports are great for tracking progress and sharing achievements.`,
        keywords: ['report', 'export', 'pdf', 'csv', 'download', 'data', 'analytics', 'history']
    },

    // PROFILE & STATS
    {
        id: 'profile-stats-overview',
        category: 'profile',
        title: 'Profile & Statistics',
        content: `Your ReLief profile is your sustainability dashboard.

**Profile Stats:**
- Total Emissions: Lifetime carbon footprint
- Carbon Savings: CO₂ reduced through actions
- Current Streak: Consecutive login days
- Points Balance: Total Points available
- Badges Earned: Achievement count

**Activity Timeline:**
- Chronological view of all actions
- Recent activity feed
- Emissions logged over time

**Progress Tracking:**
- Weekly emissions chart (last 7 days)
- Monthly emissions chart (last 6 months)
- Trend analysis

**Profile Customization:**
- Profile picture (via Clerk)
- Display name
- Bio (if implemented)

Access your profile from the navigation menu or by clicking your avatar.`,
        keywords: ['profile', 'stats', 'statistics', 'dashboard', 'progress', 'timeline', 'activity', 'history']
    },

    // RECOMMENDATIONS
    {
        id: 'recommendations-overview',
        category: 'recommendations',
        title: 'Smart Recommendations Engine',
        content: `ReLief's AI analyzes your emission patterns and suggests personalized actions.

**How it Works:**
- System analyzes your logged activities
- Identifies your highest emission categories
- Generates targeted recommendations
- Prioritizes high-impact actions

**Recommendation Types:**
- Transport: Switch to public transit, carpool, bike
- Energy: LED bulbs, unplug devices, adjust AC
- Food: Meatless days, buy local, reduce waste
- Waste: Reusable bags, composting, recycling

**Priority Levels:**
- 1-5 scale (5 = highest impact)
- Potential CO₂ savings shown for each
- Action-specific guidance

**Managing Recommendations:**
- Mark as completed (earn KP)
- Dismiss if not applicable
- New recommendations generated regularly

Recommendations appear on your Dashboard and Profile.`,
        keywords: ['recommendations', 'suggestions', 'ai', 'smart', 'personalized', 'tips', 'advice', 'reduce']
    },

    // MARKETPLACE
    {
        id: 'marketplace-overview',
        category: 'marketplace',
        title: 'Marketplace & Redemptions',
        content: `The ReLief Marketplace lets you redeem Points for virtual rewards.

**Available Items:**
- Eco-themed digital badges
- Virtual trees for your forest
- Exclusive profile customizations
- Special challenge unlocks
- Premium features (if implemented)

**How to Redeem:**
1. Go to Marketplace page
2. Browse available items
3. Check KP cost for each item
4. Click "Redeem" if you have enough KP
5. Item is added to your inventory

**Balance Check:**
- Current KP shown at top of Marketplace
- Items you can't afford are indicated
- Earn more KP through quizzes and activities

All items are virtual and have no real-world monetary value.`,
        keywords: ['marketplace', 'redeem', 'shop', 'buy', 'items', 'rewards', 'spend', 'karma']
    },

    // GENERAL PLATFORM
    {
        id: 'platform-overview',
        category: 'general',
        title: 'ReLief Platform Overview',
        content: `ReLief is a comprehensive sustainability platform that helps you track, reduce, and offset your carbon footprint.

**Core Mission:**
Heal the planet, one habit at a time.

**Main Features:**
1. Carbon Calculator - Track your emissions
2. AQI Monitor - Check air quality
3. Eco Streak Forest - Build daily habits
4. Quizzes - Learn and earn certificates
5. Rewards - Earn and spend Points
6. Community - Connect with eco-warriors
7. Bill Scanner - Automatic emission tracking

**Getting Started:**
1. Sign up with email or Google
2. Complete your profile
3. Start logging activities in the Calculator
4. Build your daily streak
5. Earn Points and badges

**Platform Values:**
- Gamification for engagement
- Education through action
- Community-driven impact
- Data-driven insights`,
        keywords: ['relief', 'platform', 'overview', 'about', 'what is', 'features', 'getting started', 'mission']
    },

    // NAVIGATION HELP
    {
        id: 'navigation-help',
        category: 'general',
        title: 'Navigating ReLief',
        content: `**Main Navigation Pages:**

- **Dashboard**: Your personal overview with stats and charts
- **Calculator**: Log carbon emissions
- **Forest**: View your streak and virtual trees
- **Community/Feed**: Social features and posts
- **Leaderboard**: Compete with others
- **AQI**: Check air quality data
- **Quiz**: Take sustainability quizzes
- **Marketplace**: Redeem Points
- **Profile**: View your stats and settings
- **Scanner**: Upload bills for automatic tracking
- **Rewards**: See available rewards

**Quick Actions:**
- Click your profile picture to access Profile
- Use the theme toggle for dark/light mode
- Access all features from the navigation menu`,
        keywords: ['navigation', 'menu', 'pages', 'where', 'find', 'access', 'go to', 'how to get']
    },

    // TROUBLESHOOTING
    {
        id: 'common-issues',
        category: 'general',
        title: 'Common Questions & Troubleshooting',
        content: `**Common Questions:**

Q: How do I reset my streak?
A: Streaks reset automatically if you miss a day. You can't manually reset them.

Q: Can I delete logged activities?
A: Activity deletion may be available in Profile settings.

Q: How do I earn more Points?
A: Pass quizzes, maintain streaks, and log activities.

Q: Why can't I redeem an item?
A: Check if you have enough Points. Your balance is shown at the top.

Q: How do I get a certificate?
A: Complete all 3 quiz levels (pass with 7/10 or better).

Q: What if my streak breaks?
A: Start fresh! Your longest streak is still recorded.

Q: How accurate is the carbon calculator?
A: It uses simplified formulas for estimation. Real emissions vary.

**Need More Help?**
Visit the Contact page or reach out to the ReLief team.`,
        keywords: ['help', 'faq', 'questions', 'troubleshooting', 'issues', 'problems', 'how do i', 'why']
    }
];

/**
 * Search knowledge base for relevant entries
 */
export function searchKnowledge(query: string, limit: number = 3): KnowledgeEntry[] {
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(' ').filter(w => w.length > 2);

    // Score each entry based on keyword matches
    const scored = RELIEF_KNOWLEDGE.map(entry => {
        let score = 0;

        // Check title match
        if (entry.title.toLowerCase().includes(lowerQuery)) {
            score += 10;
        }

        // Check keyword matches
        entry.keywords.forEach(keyword => {
            if (lowerQuery.includes(keyword)) {
                score += 5;
            }
            words.forEach(word => {
                if (keyword.includes(word)) {
                    score += 2;
                }
            });
        });

        // Check content match
        if (entry.content.toLowerCase().includes(lowerQuery)) {
            score += 3;
        }

        return { entry, score };
    });

    // Sort by score and return top results
    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.entry);
}

/**
 * Get entries by category
 */
export function getKnowledgeByCategory(category: string): KnowledgeEntry[] {
    return RELIEF_KNOWLEDGE.filter(entry => entry.category === category);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
    return Array.from(new Set(RELIEF_KNOWLEDGE.map(entry => entry.category)));
}
