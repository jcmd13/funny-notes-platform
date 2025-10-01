#!/bin/bash

echo "🎤 Funny Notes Platform - Development Workflow"
echo "=============================================="

# Check git status
echo "📊 Checking git status..."
git status --porcelain

if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No changes to commit"
    exit 0
fi

# Show what will be committed
echo ""
echo "📝 Files to be committed:"
git status --short

echo ""
read -p "🤔 Create commit with these changes? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Add all changes
    echo "📦 Adding changes to staging..."
    git add .
    
    # Get commit message
    echo ""
    echo "💬 Enter commit message (or press Enter for auto-generated):"
    read -r commit_message
    
    if [ -z "$commit_message" ]; then
        # Auto-generate commit message based on changed files
        if git diff --cached --name-only | grep -q "src/components"; then
            commit_message="Update UI components and interface improvements"
        elif git diff --cached --name-only | grep -q "src/pages"; then
            commit_message="Update page components and routing"
        elif git diff --cached --name-only | grep -q "src/core"; then
            commit_message="Update core functionality and data models"
        elif git diff --cached --name-only | grep -q "src/hooks"; then
            commit_message="Update React hooks and data management"
        elif git diff --cached --name-only | grep -q ".kiro"; then
            commit_message="Update Kiro configuration and specs"
        else
            commit_message="Update project files and configurations"
        fi
        echo "📝 Using auto-generated message: $commit_message"
    fi
    
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "$commit_message"
    
    # Push to GitHub
    echo "📤 Pushing to GitHub..."
    if git push origin main; then
        echo "🎉 Successfully pushed to GitHub!"
        echo "🔗 View at: https://github.com/jcmd13/funny-notes-platform"
    else
        echo "❌ Failed to push. Check your authentication."
    fi
else
    echo "❌ Commit cancelled"
fi