#!/usr/bin/env bash
# remote-deploy.sh — runs ON the VPS via SSH from GitHub Actions.
# Pulls latest code, installs deps, builds, and reloads PM2.
set -euo pipefail

REPO_DIR="$HOME/Meddler"
APP_NAME="meddler"

# First-time setup: clone if the repo doesn't exist yet
if [ ! -d "$REPO_DIR" ]; then
  echo ">>> Cloning repo..."
  git clone https://github.com/cvtai02/Meddler.git "$REPO_DIR"
fi

cd "$REPO_DIR"

echo ">>> Pulling latest..."
git fetch origin main
git reset --hard origin/main

echo ">>> Installing dependencies..."
npm ci

echo ">>> Building..."
npm run build

echo ">>> Pruning dev dependencies..."
npm prune --omit=dev

echo ">>> Reloading PM2..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js
else
  pm2 start ecosystem.config.js
  pm2 save
fi

echo ">>> Deploy complete."
