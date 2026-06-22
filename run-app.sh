#!/bin/bash

# Define the absolute directory of the project
PROJECT_DIR="/home/sarath/projects/worldcup-roadmap"
cd "$PROJECT_DIR" || exit

# 1. Check if the Vite dev server is running on port 5173
# We check if port 5173 is open
if ! command -v lsof >/dev/null 2>&1 || ! lsof -i :5173 > /dev/null 2>&1; then
  echo "Vite server is not running. Starting dev server..."
  npm run dev > dev-server.log 2>&1 &
else
  echo "Vite dev server is already running."
fi

# 2. Check if the Live daemon is running
if ! pgrep -f "fetch-live-api.cjs" > /dev/null; then
  echo "Live score daemon is not running. Starting daemon..."
  node scripts/fetch-live-api.cjs > daemon.log 2>&1 &
else
  echo "Live score daemon is already running."
fi

# Give the servers a moment to bind to ports
sleep 1.5

# 3. Open the app in Google Chrome standalone app mode (no address bar)
google-chrome --app=http://localhost:5173/ &
