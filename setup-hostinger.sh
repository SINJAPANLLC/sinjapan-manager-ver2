#!/bin/bash

# Hostinger Setup Script for SIN-JAPAN-MANAGER-Ver2
# This script helps fix 403 Forbidden errors and setup the application properly

echo "🚀 Starting Hostinger Setup for SIN-JAPAN-MANAGER-Ver2..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_status "Found package.json. Proceeding with setup..."

# 1. Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p dist/public

# 2. Set proper permissions
print_status "Setting file permissions..."

# Directory permissions (755)
find . -type d -exec chmod 755 {} \; 2>/dev/null || print_warning "Some directories could not be made executable"

# File permissions (644)
find . -type f -exec chmod 644 {} \; 2>/dev/null || print_warning "Some files could not be made readable"

# Make scripts executable
chmod +x dist/index.js 2>/dev/null || print_warning "dist/index.js not found or could not be made executable"
chmod +x setup-hostinger.sh 2>/dev/null

print_status "Permissions set successfully."

# 3. Check if build exists
if [ ! -d "dist/public" ] || [ ! -f "dist/public/index.html" ]; then
    print_warning "Build files not found. Running build process..."
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi
    
    # Run build
    print_status "Building application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_status "Build completed successfully."
    else
        print_error "Build failed. Please check the errors above."
        exit 1
    fi
else
    print_status "Build files found."
fi

# 4. Setup deployment type
echo ""
echo "Select deployment type:"
echo "1) Static files only (no backend API)"
echo "2) Full-stack with Node.js backend"
read -p "Enter your choice (1 or 2): " deployment_type

case $deployment_type in
    1)
        print_status "Setting up static file deployment..."
        
        # Copy static files to root if needed
        if [ -d "dist/public" ]; then
            print_status "Copying static files..."
            cp -r dist/public/* . 2>/dev/null || print_warning "Could not copy some files"
        fi
        
        # Use static .htaccess
        if [ -f ".htaccess.static" ]; then
            cp .htaccess.static .htaccess
            print_status "Static .htaccess configuration applied."
        else
            # Create basic .htaccess
            cat > .htaccess << 'EOF'
RewriteEngine On
DirectoryIndex index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule . /index.html [L]
EOF
            print_status "Basic .htaccess configuration created."
        fi
        ;;
        
    2)
        print_status "Setting up full-stack deployment..."
        
        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            print_warning "PM2 not found. Installing PM2..."
            npm install -g pm2
        fi
        
        # Setup environment file
        if [ ! -f ".env" ] && [ -f "env.example.hostinger" ]; then
            cp env.example.hostinger .env
            print_warning "Created .env file from example. Please edit it with your actual values."
        fi
        
        # Start the application
        print_status "Starting Node.js application..."
        pm2 start ecosystem.config.js --env production
        
        if [ $? -eq 0 ]; then
            print_status "Application started successfully."
            pm2 save
            print_status "PM2 configuration saved."
        else
            print_error "Failed to start application. Check PM2 logs: pm2 logs"
        fi
        ;;
        
    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

# 5. Final checks
print_status "Running final checks..."

# Check if index.html exists and is readable
if [ -f "index.html" ] || [ -f "dist/public/index.html" ]; then
    print_status "✅ Index file found."
else
    print_error "❌ Index file not found. This may cause 403 errors."
fi

# Check .htaccess
if [ -f ".htaccess" ]; then
    print_status "✅ .htaccess file exists."
else
    print_error "❌ .htaccess file missing."
fi

# Check permissions
if [ -r "index.html" ] || [ -r "dist/public/index.html" ]; then
    print_status "✅ Files are readable."
else
    print_warning "⚠️  File permissions may need adjustment."
fi

echo ""
print_status "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. If using static deployment: Upload all files to /public_html/"
echo "2. If using full-stack: Ensure environment variables are set correctly"
echo "3. Check your website: it should now be accessible without 403 errors"
echo "4. If you still get 403 errors, check the troubleshooting guide: HOSTINGER_403_FIX.md"
echo ""
echo "Useful commands:"
echo "- Check PM2 status: pm2 status"
echo "- View PM2 logs: pm2 logs sinjapan-manager"
echo "- Restart application: pm2 restart sinjapan-manager"
echo ""

exit 0
