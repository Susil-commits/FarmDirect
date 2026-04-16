#!/bin/bash

# Cloudinary Integration Setup Script
# This script automates the Cloudinary setup process

echo "🌩️  FaRm Marketplace - Cloudinary Integration Setup"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify Cloudinary credentials
echo -e "${BLUE}Step 1: Cloudinary Credentials${NC}"
echo "Please go to https://cloudinary.com/console to get:"
echo "  - Cloud Name"
echo "  - API Key"
echo "  - API Secret"
echo ""

read -p "Enter your Cloudinary Cloud Name: " CLOUD_NAME
read -p "Enter your Cloudinary API Key: " API_KEY
read -s -p "Enter your Cloudinary API Secret: " API_SECRET
echo ""
read -p "Enter your Upload Preset (leave blank to skip): " UPLOAD_PRESET

# Step 2: Update .env file
echo ""
echo -e "${BLUE}Step 2: Updating .env file${NC}"

# Append to backend .env
cd backend

if grep -q "CLOUDINARY_CLOUD_NAME" .env; then
    # Update existing values
    sed -i.bak "s/CLOUDINARY_CLOUD_NAME=.*/CLOUDINARY_CLOUD_NAME=$CLOUD_NAME/" .env
    sed -i.bak "s/CLOUDINARY_API_KEY=.*/CLOUDINARY_API_KEY=$API_KEY/" .env
    sed -i.bak "s/CLOUDINARY_API_SECRET=.*/CLOUDINARY_API_SECRET=$API_SECRET/" .env
    if [ ! -z "$UPLOAD_PRESET" ]; then
        sed -i.bak "s/CLOUDINARY_UPLOAD_PRESET=.*/CLOUDINARY_UPLOAD_PRESET=$UPLOAD_PRESET/" .env
    fi
else
    # Append new values
    {
        echo ""
        echo "# Cloudinary Configuration"
        echo "CLOUDINARY_CLOUD_NAME=$CLOUD_NAME"
        echo "CLOUDINARY_API_KEY=$API_KEY"
        echo "CLOUDINARY_API_SECRET=$API_SECRET"
        if [ ! -z "$UPLOAD_PRESET" ]; then
            echo "CLOUDINARY_UPLOAD_PRESET=$UPLOAD_PRESET"
        fi
    } >> .env
fi

echo -e "${GREEN}✓ .env updated${NC}"

# Step 3: Install dependencies
echo ""
echo -e "${BLUE}Step 3: Installing dependencies${NC}"

if grep -q "cloudinary" package.json; then
    echo "Cloudinary already installed"
else
    npm install cloudinary multer-storage-cloudinary --save
    echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

# Step 4: Verify installation
echo ""
echo -e "${BLUE}Step 4: Verifying installation${NC}"

if [ -f "config/cloudinary.js" ]; then
    echo -e "${GREEN}✓ Cloudinary config file exists${NC}"
else
    echo -e "${YELLOW}⚠ Cloudinary config file not found${NC}"
    echo "   Make sure backend/config/cloudinary.js exists"
fi

if [ -f "middleware/cloudinaryUpload.js" ]; then
    echo -e "${GREEN}✓ Cloudinary middleware exists${NC}"
else
    echo -e "${YELLOW}⚠ Cloudinary middleware not found${NC}"
    echo "   Make sure backend/middleware/cloudinaryUpload.js exists"
fi

# Step 5: Summary
echo ""
echo -e "${GREEN}=================================================="
echo "✓ Cloudinary Integration Setup Complete!"
echo "==================================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update your route files to use uploadMiddleware"
echo "2. Create controllers to handle uploads"
echo "3. Test uploads with the upload component"
echo ""
echo "Documentation: See CLOUDINARY_INTEGRATION_GUIDE.md"
echo ""
