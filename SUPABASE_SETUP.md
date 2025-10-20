# 🗄️ Supabase Setup Guide

This guide will help you set up Supabase to enable multi-supervisor access to team schedules.

## 📋 Prerequisites

- A Supabase account (free tier works great!)
- Your Supabase project URL and anon key

## 🚀 Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Name**: shift-scheduler (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait 2-3 minutes for setup to complete

## 🔑 Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

## 📝 Step 3: Create Environment File

1. In your project root, create a file named `.env.local`
2. Add these lines (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file

## 🗃️ Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste this SQL:

```sql
-- Create team_members table
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  weekly_schedule JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_team_members_created_at ON team_members(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read (for supervisors)
CREATE POLICY "Allow public read access" ON team_members
  FOR SELECT USING (true);

-- Create policy to allow anyone to insert (for adding members)
CREATE POLICY "Allow public insert access" ON team_members
  FOR INSERT WITH CHECK (true);

-- Create policy to allow anyone to update (for editing schedules)
CREATE POLICY "Allow public update access" ON team_members
  FOR UPDATE USING (true);

-- Create policy to allow anyone to delete (for removing members)
CREATE POLICY "Allow public delete access" ON team_members
  FOR DELETE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click "Run" to execute the SQL
5. You should see "Success. No rows returned"

## ✅ Step 5: Verify Setup

1. Go to **Table Editor** in Supabase
2. You should see the `team_members` table
3. Click on it to see the columns: `id`, `name`, `weekly_schedule`, `created_at`, `updated_at`

## 🔄 Step 6: Restart Your App

```bash
# Stop the dev server (Ctrl+C)
# Start it again
npm run dev
```

## 🎉 Done!

Your app is now connected to Supabase! All supervisors can now:
- ✅ See the same team members
- ✅ Edit schedules together
- ✅ Changes sync in real-time
- ✅ Access from any device

## 🔒 Security Notes

**Current Setup:** Public access (anyone with the URL can view/edit)

**For Production:** You should add authentication:
1. Enable Supabase Auth
2. Add login/signup pages
3. Update RLS policies to require authentication
4. Assign supervisor roles

## 🆘 Troubleshooting

**"Failed to fetch"**
- Check your `.env.local` file exists
- Verify URL and key are correct
- Restart dev server

**"Row Level Security policy violation"**
- Make sure you ran all the SQL commands
- Check policies are enabled in Table Editor → Policies

**Changes not syncing**
- Check browser console for errors
- Verify internet connection
- Check Supabase project is active

## 📚 Next Steps

Want to add more features?
- Add user authentication
- Create supervisor accounts
- Add audit logs
- Export history
- Schedule templates

Need help? Check the [Supabase docs](https://supabase.com/docs) or ask for assistance!
