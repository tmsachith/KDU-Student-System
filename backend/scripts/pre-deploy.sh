#!/bin/bash

# Pre-deployment script for Vercel
echo "Starting pre-deployment checks..."

# Check if required environment variables are set
if [ -z "$MONGODB_URI" ]; then
    echo "Error: MONGODB_URI environment variable is not set"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "Error: JWT_SECRET environment variable is not set"
    exit 1
fi

echo "Environment variables check passed"

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

echo "Pre-deployment completed successfully"
