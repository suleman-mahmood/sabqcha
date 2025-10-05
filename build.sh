#!/bin/bash
# Exit immediately if any command fails
set -e

# Step 1: Go to first directory and run command
cd /home/suleman/Projects/sabqcha/backend
echo "Running command in $(pwd)..."
sudo docker build --tag sabqcha_backend --file Dockerfile .

# Step 2: Go to second directory and run command
cd /home/suleman/Projects/sabqcha/frontend
echo "Running command in $(pwd)..."
sudo docker build --tag sabqcha_frontend --file Dockerfile .

# Step 3: Go to third directory and run command
cd /home/suleman/Projects
echo "Running command in $(pwd)..."
sudo docker compose up -d

echo "✅ All commands executed successfully!"
