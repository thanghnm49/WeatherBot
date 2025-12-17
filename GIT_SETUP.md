# Git Setup Guide for VPS Updates

If you're having trouble updating the bot on your VPS after committing to GitHub, follow these steps:

## Step 1: Check if Git Repository is Set Up

SSH into your VPS and check:

```bash
cd /opt/weatherbot
ls -la .git
```

If `.git` directory doesn't exist, you need to set up Git.

## Step 2: Initialize Git Repository

If Git is not set up, initialize it:

```bash
cd /opt/weatherbot

# Initialize git repository
git init

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/WeatherBot.git

# Fetch and pull from GitHub
git fetch origin
git pull origin main
# or if your branch is master:
# git pull origin master

# Set upstream branch
git branch --set-upstream-to=origin/main main
# or for master:
# git branch --set-upstream-to=origin/master master
```

## Step 3: Verify Setup

Check that everything is set up correctly:

```bash
cd /opt/weatherbot
git remote -v
git status
```

You should see your GitHub repository URL.

## Step 4: Update Bot

Now you can use the update script:

```bash
cd /opt/weatherbot
./update.sh
```

Or manually:

```bash
cd /opt/weatherbot
pm2 stop weatherbot
git pull origin main
npm install --production
pm2 start weatherbot
```

## Troubleshooting

### Error: "not a git repository"

Run Step 2 above to initialize Git.

### Error: "fatal: could not read Username"

If your repository is private, you need to set up authentication:

**Option 1: Use SSH instead of HTTPS**
```bash
cd /opt/weatherbot
git remote set-url origin git@github.com:yourusername/WeatherBot.git
```

**Option 2: Use Personal Access Token**
```bash
cd /opt/weatherbot
git remote set-url origin https://YOUR_TOKEN@github.com/yourusername/WeatherBot.git
```

**Option 3: Configure Git credentials**
```bash
git config --global credential.helper store
git pull origin main
# Enter your GitHub username and Personal Access Token when prompted
```

### Error: "fatal: refusing to merge unrelated histories"

If you get this error, use:

```bash
git pull origin main --allow-unrelated-histories
```

### Check Current Branch

```bash
cd /opt/weatherbot
git branch
git branch --show-current
```

Make sure you're on the correct branch (main or master).

## Quick Update Commands

After initial setup, updating is simple:

```bash
cd /opt/weatherbot
./update.sh
```

Or manually:

```bash
cd /opt/weatherbot
pm2 stop weatherbot
git pull
npm install --production
pm2 restart weatherbot
```

