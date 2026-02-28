import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE environment variables in .env.local');
    process.exit(1);
}

// Initialize Supabase Admin Client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MUSIC_FILES = [
    'rain.mp3',
    'forest-birdsong.mp3',
    'ocean.mp3',
    'mountain-wind.mp3'
];

async function migrateMusic() {
    console.log('🎵 Starting Music Migration to Supabase Storage...');

    // 1. Ensure the "audio" bucket exists and is public
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket('audio');

    if (bucketError && bucketError.message.includes('not found')) {
        console.log('📦 Creating "audio" bucket...');
        const { error: createError } = await supabase.storage.createBucket('audio', {
            public: true,
            allowedMimeTypes: ['audio/mpeg'],
            fileSizeLimit: 52428800 // 50MB
        });
        if (createError) {
            console.error('❌ Failed to create bucket:', createError.message);
            return;
        }
    } else if (bucketError) {
        console.error('❌ Error checking bucket:', bucketError.message);
        return;
    } else {
        console.log('✅ "audio" bucket already exists.');
    }

    // 2. Upload files
    for (const fileName of MUSIC_FILES) {
        const filePath = path.join(process.cwd(), 'public', 'music', fileName);

        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ File not found: ${filePath}`);
            continue;
        }

        console.log(`📤 Uploading ${fileName}...`);
        const fileBuffer = fs.readFileSync(filePath);

        const { error: uploadError } = await supabase.storage.from('audio').upload(
            fileName,
            fileBuffer,
            {
                contentType: 'audio/mpeg',
                upsert: true
            }
        );

        if (uploadError) {
            console.error(`❌ Failed to upload ${fileName}:`, uploadError.message);
        } else {
            console.log(`✅ Successfully uploaded ${fileName}`);
        }
    }

    console.log('\n✨ Music migration complete!');
}

migrateMusic().catch(err => {
    console.error('❌ Unexpected migration error:', err);
});
