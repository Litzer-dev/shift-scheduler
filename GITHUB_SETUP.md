# 🚀 GitHub Setup Guide

Quick guide to publish this project to GitHub and optionally deploy it.

## 📤 Push to GitHub

### Option 1: Create New Repository on GitHub

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon → "New repository"
3. Name it: `shift-scheduler` (or your preferred name)
4. **Don't** initialize with README (we already have one)
5. Click "Create repository"

### Option 2: Use GitHub CLI (if installed)

```bash
gh repo create shift-scheduler --public --source=. --remote=origin
```

### Push Your Code

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Weekly shift scheduler app"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/shift-scheduler.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🌐 Deploy to Vercel (Free & Easy)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your `shift-scheduler` repository
5. Click "Deploy"
6. Done! Your app is live in ~2 minutes

Your app will be at: `https://shift-scheduler-yourname.vercel.app`

## 🌐 Deploy to Netlify (Alternative)

1. Go to [netlify.com](https://netlify.com)
2. Sign in with GitHub
3. Click "Add new site" → "Import an existing project"
4. Choose your `shift-scheduler` repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Click "Deploy"

## 📝 Update README

Before pushing, update the README.md:

1. Replace `yourusername` with your actual GitHub username in the clone URL
2. Add your deployed URL if you deploy it
3. Add screenshots if desired

## 🎨 Add Screenshots (Optional)

Take screenshots of your app and add them to a `screenshots/` folder:

```bash
mkdir screenshots
# Add your screenshots here
```

Then update README.md to include them:

```markdown
## Screenshots

![Main Interface](screenshots/main.png)
![Weekly Schedule](screenshots/weekly.png)
```

## 📄 Repository Settings (Optional)

On GitHub, go to your repository settings and:

1. **Add Topics**: `nextjs`, `typescript`, `shift-scheduler`, `scheduling`, `rotation`
2. **Add Description**: "Weekly team shift scheduler with fair rotation system"
3. **Enable Issues**: For bug reports and feature requests
4. **Add Website**: Your deployed URL

## 🎉 You're Done!

Your project is now:
- ✅ On GitHub
- ✅ Properly documented
- ✅ Ready for collaboration
- ✅ (Optional) Deployed and live

Share the link with your team!
