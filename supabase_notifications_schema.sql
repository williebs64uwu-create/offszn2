-- SQL Script to create the `notifications` table in Supabase
-- Please run this in your Supabase SQL Editor

CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- User receiving the notification
    actor_id UUID, -- User who triggered the event (optional)
    type VARCHAR(50) NOT NULL, -- e.g., 'follow', 'message', 'like', 'sale', 'purchase', 'product_upload', 'collab_invite', 'collab_accept'
    message TEXT NOT NULL, -- The notification text
    link VARCHAR(255), -- Optional link to redirect the user when clicked
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster queries on user's notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS (Row Level Security) if not already enabled on the project
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy so users can only view and update their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);
