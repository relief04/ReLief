-- Migration: Create dedicated group_messages table
-- Run this once in Supabase Dashboard > SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS group_messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    avatar_url TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index for fast lookup of messages by group
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);

-- Enable Row Level Security
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Group members can read messages in groups they belong to
CREATE POLICY "Members can view group messages"
    ON group_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = group_messages.group_id
              AND group_members.user_id = auth.uid()::TEXT
        )
    );

-- Policy: Authenticated users can insert messages into groups they belong to
CREATE POLICY "Members can post group messages"
    ON group_messages FOR INSERT
    WITH CHECK (
        auth.uid()::TEXT = user_id
        AND EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = group_messages.group_id
              AND group_members.user_id = auth.uid()::TEXT
        )
    );

-- Enable realtime for the table (run this separately if needed)
-- ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
