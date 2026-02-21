# Quick Start Guide: Setting Up New Features

## 🚀 One-Time Setup

### 1. Run Database Migration

**Via Supabase Dashboard (Recommended):**
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `database_migration_features.sql`
5. Paste and click **RUN**
6. Wait for completion (creates 11 tables + 50+ badges)

**Via Command Line:**
```bash
# If using psql
psql postgresql://[YOUR-CONNECTION-STRING] -f database_migration_features.sql
```

### 2. Add RPC Functions

Run these additional SQL functions:

```sql
-- Increment share count
CREATE OR REPLACE FUNCTION increment_shares_count(p_user_id VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET shares_count = shares_count + 1 WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Add karma points
CREATE OR REPLACE FUNCTION add_karma_points(p_user_id VARCHAR, p_points INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET balance = balance + p_points WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

### 3. Verify Installation

Check that these tables exist in your Supabase dashboard:
- ✅ badges (should have 50+ rows)
- ✅ user_badges
- ✅ leaderboards
- ✅ recommendations
- ✅ social_shares
- ✅ tree_milestones (should have 6 rows)
- ✅ planted_trees
- ✅ friendships
- ✅ friend_challenges
- ✅ teams
- ✅ team_members

### 4. Test the Features

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to new pages:**
   - http://localhost:3000/badges - View all achievements
   - http://localhost:3000/leaderboard - Global rankings

3. **Test badge awarding:**
   - Log an eco-action
   - Check if "First Step" badge is awarded
   - View it on `/badges` page

---

## 🔗 Feature Integration Examples

### Add to Dashboard

Update `src/app/dashboard/page.tsx` to show new features:

```tsx
// At the top
import { triggerBadgeCheck } from '@/lib/badgeDetection';
import { generateRecommendations } from '@/lib/recommendationEngine';
import { checkTreeMilestones } from '@/lib/treePlanting';

// In your component
useEffect(() => {
  // Check for new badges
  triggerBadgeCheck(user.id);
  
  // Generate recommendations once per day
  const lastCheck = localStorage.getItem('last_rec_check');
  if (!lastCheck || Date.now() - parseInt(lastCheck) > 86400000) {
    generateRecommendations(user.id);
    localStorage.setItem('last_rec_check', Date.now().toString());
  }
  
  // Check tree milestones
  checkTreeMilestones(user.id, carbonSaved);
}, [user]);
```

---

## ⚙️ Configuration

### Environment Variables (Optional)

Add to `.env.local` for future tree planting API:

```env
# Tree Planting API (Optional - currently using mock)
TREE_PLANTING_API_KEY=your_api_key_here
TREE_PLANTING_PARTNER=OneTreePlanted
```

---

## 📝 Customization

### Modify Badge Rewards

Edit `database_migration_features.sql` before running to customize:
- Karma point rewards
- Badge requirements
- Rarity levels
- Icons

### Add Custom Badges

```sql
INSERT INTO badges (name, description, category, icon, requirement_type, requirement_value, rarity, karma_reward) 
VALUES 
('Your Badge Name', 'Description', 'action', '🎯', 'activities_count', 50, 'rare', 200);
```

### Adjust Tree Milestones

```sql
UPDATE tree_milestones 
SET required_carbon_saved = 100, trees_to_plant = 2
WHERE name = 'Seedling Starter';
```

---

## 🎯 Next Actions

1. ✅ Run database migration
2. ✅ Test `/badges` and `/leaderboard` pages  
3. 🔄 Integrate recommendations into dashboard
4. 🔄 Add badge notifications
5. 🔄 Test tree planting flow
6. 🔄 Deploy to production

---

## 💡 Tips

- **Testing**: Use incognito sessions to test as different users
- **Performance**: Leaderboard caches rankings - refresh daily via cron job
- **Badges**: Call `triggerBadgeCheck()` after any user action
- **Recommendations**: Regenerate weekly for best results

---

## 🆘 Troubleshooting

**"Badges don't award automatically"**
- Ensure `triggerBadgeCheck()` is called after actions
- Check if badge requirements match user stats

**"Leaderboard shows no data"**
- Verify users have `carbon_savings > 0`
- Check profile table has data

**"TypeScript errors"**
- Minor type warnings are non-critical
- Run `npm run build` to verify no blocking errors

---

For full documentation, see [`walkthrough.md`](file:///C:/Users/yasht/.gemini/antigravity/brain/14085b6f-dfe0-47d6-bb64-4e00a2d9eb4e/walkthrough.md)
