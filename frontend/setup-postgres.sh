#!/bin/bash

# PostgreSQL Real Spices Migration - Quick Setup Script
# This script helps verify your PostgreSQL setup and database configuration

echo "=== Real Spices PostgreSQL Migration Setup ==="
echo ""
echo "Step 1: Verify PostgreSQL is installed..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Please install PostgreSQL first."
    echo "   Download from: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL found: $(psql --version)"
echo ""

echo "Step 2: Check database connection..."
echo ""
echo "Enter your PostgreSQL username (default: postgres):"
read -p "> " PG_USER
PG_USER=${PG_USER:-postgres}

echo "Enter PostgreSQL password (press Enter if no password):"
read -s PG_PASSWORD
echo ""

echo "Step 3: Create database 'realspices'..."
if PGPASSWORD="$PG_PASSWORD" psql -U "$PG_USER" -c "SELECT 1" &> /dev/null; then
    echo "✅ Connected to PostgreSQL"
    
    # Create database
    PGPASSWORD="$PG_PASSWORD" psql -U "$PG_USER" -c "CREATE DATABASE realspices;" 2>/dev/null
    
    if PGPASSWORD="$PG_PASSWORD" psql -U "$PG_USER" -d realspices -c "SELECT 1" &> /dev/null; then
        echo "✅ Database 'realspices' created or already exists"
    else
        echo "❌ Failed to connect to realspices database"
        exit 1
    fi
else
    echo "❌ Failed to connect to PostgreSQL"
    echo "   Make sure PostgreSQL is running and credentials are correct"
    exit 1
fi

echo ""
echo "Step 4: Database initialization SQL files found:"
ls -1 database/*.sql 2>/dev/null | head -5
echo ""

echo "Step 5: Update your .env.local file with:"
echo ""
echo "DB_HOST=localhost"
echo "DB_PORT=5432"
echo "DB_NAME=realspices"
echo "DB_USER=$PG_USER"
echo "DB_PASSWORD=[your_password_here]"
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000"
echo "SUPPORT_EMAIL=support@realspices.com"
echo ""

echo "✅ PostgreSQL setup verification complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your PostgreSQL credentials"
echo "2. Run: npm run dev"
echo "3. Check POSTGRES_MIGRATION_SETUP.md for schema initialization"
echo "4. Review MIGRATION_STATUS.md for remaining updates"
