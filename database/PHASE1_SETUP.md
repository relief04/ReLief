# Phase 1 Setup Instructions

## Step 1: Create Supabase Tables

Run the SQL script in your Supabase SQL Editor:

**File**: `database/community_phase1_schema.sql`

This will create:
- `post_likes` table with RLS policies
- `post_comments` table with RLS policies
- Add columns to existing `posts` table (image_url, hashtags, category)

## Step 2: Create Supabase Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `community`
3. Set it to **Public** (for image URLs to work)
4. Add storage policy:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community');

-- Allow public read access
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community');
```

## Step 3: Test the Features

1. **Create a Post with Image**:
   - Go to `/feed` page
   - Click "📷 Add Photo" to upload an image
   - Type some text with hashtags (e.g., "Great day! #EcoFriendly #ZeroWaste")
   - Click "Post Update"

2. **Like a Post**:
   - Click the heart icon (🤍) on any post
   - It should turn red (❤️) and increment the count
   - Click again to unlike

3. **Comment on a Post**:
   - Click the comment icon (💬) to expand comments
   - Type a comment in the input field
   - Click "Post" to submit
   - Comment should appear immediately

4. **View Hashtags**:
   - Hashtags in post content should be highlighted in blue
   - Hashtag badges should appear below the post

## Features Implemented

✅ **Image Upload**: Upload photos with posts
✅ **Like/Unlike**: Toggle likes on posts with real-time count
✅ **Comments**: View and add comments on posts
✅ **Hashtags**: Automatic extraction and display
✅ **User Avatars**: Display Clerk user images
✅ **Responsive Design**: Works on mobile and desktop

## Known Limitations

- Category selection not yet implemented (optional feature)
- Hashtag filtering not yet implemented (coming in Phase 2)
- Image compression not implemented (large images may be slow)

## Next Steps

Ready for **Phase 2**: Eco-Buddies & Trending Topics
