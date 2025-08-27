#!/bin/bash

# Production startup script for Prayer Times Parser

echo "🚀 Starting Prayer Times Parser in production mode..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it with your configuration."
    exit 1
fi

# Check if MISTRAL_API_KEY is set
source .env
if [ -z "$MISTRAL_API_KEY" ]; then
    echo "❌ MISTRAL_API_KEY not set in .env file."
    exit 1
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Set production environment variables
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
export PYTHONUNBUFFERED=1

# Start the application with production settings
echo "🌐 Starting server on http://0.0.0.0:${PORT:-8000}"
uvicorn main:app \
    --host 0.0.0.0 \
    --port ${PORT:-8000} \
    --workers ${WORKERS:-1} \
    --access-log \
    --log-level info
