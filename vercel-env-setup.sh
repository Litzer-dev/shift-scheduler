#!/bin/bash
echo "Setting up Vercel environment variables..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "Done! Now redeploy your app."
