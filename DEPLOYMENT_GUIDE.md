# Deployment Guide

This guide covers deploying the Jersey Allocation application with:
- **Frontend**: Vercel (Next.js)
- **Backend**: Digital Ocean VPS (Express.js + Socket.IO)

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Deploy Frontend to Vercel](#deploy-frontend-to-vercel)
4. [Deploy Backend to Digital Ocean VPS](#deploy-backend-to-digital-ocean-vps)
5. [Update Google OAuth](#update-google-oauth)
6. [Post-Deployment Testing](#post-deployment-testing)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- GitHub account (for code repository)
- Vercel account (sign up at vercel.com)
- Digital Ocean account (sign up at digitalocean.com)
- Neon PostgreSQL account (already have)
- Google Cloud Console (already configured)

### Local Requirements
- Git installed
- SSH client (PuTTY on Windows or native SSH)
-域域名 (Optional: Custom domain for production)

---

## Environment Variables

### Frontend (.env.local)
```env
# Database
DATABASE_URL="postgresql://user:password@ep-old-shadow-a1g064x5-pooler.ap-southeast-1.aws.neon.tech/jersy-allocation?sslmode=require&pgbouncer=true&connect_timeout=10&connection_limit=5"
DIRECT_URL="postgresql://user:password@ep-old-shadow-a1g064x5.ap-southeast-1.aws.neon.tech/jersy-allocation?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-domain.vercel.app"  # Update after Vercel deployment
NEXTAUTH_SECRET="your-secret-key-here"  # Run: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Backend API
NEXT_PUBLIC_BACKEND_URL="https://api.yourdomain.com"  # Update after VPS deployment
```

### Backend (.env)
```env
# Server
PORT=4000
NODE_ENV=production
FRONTEND_URL="https://your-domain.vercel.app"  # Update after Vercel deployment

# Database
DATABASE_URL="postgresql://user:password@ep-old-shadow-a1g064x5-pooler.ap-southeast-1.aws.neon.tech/jersy-allocation?sslmode=require&pgbouncer=true&connect_timeout=10&connection_limit=10"
DIRECT_URL="postgresql://user:password@ep-old-shadow-a1g064x5.ap-southeast-1.aws.neon.tech/jersy-allocation?sslmode=require"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""  # Set if you configure Redis auth

# Google OAuth (for validation)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## Deploy Frontend to Vercel

### Step 1: Push Code to GitHub
```bash
# Initialize git if not already done
cd "d:\PerSonal Projects\Jersy-Allocation"
git init
git add .
git commit -m "Initial commit - Ready for deployment"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/jersey-allocation.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### Step 3: Configure Vercel Project
**Framework Preset**: Next.js  
**Root Directory**: `frontend`  
**Build Command**: `npm run build`  
**Output Directory**: `.next`  
**Install Command**: `npm install`

### Step 4: Add Environment Variables
In Vercel project settings → **Environment Variables**, add all variables from the frontend `.env.local` file.

**Important**: Leave `NEXTAUTH_URL` blank initially - Vercel will auto-assign a URL.

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Note your deployment URL: `https://your-app.vercel.app`

### Step 6: Update Environment Variables
1. Go back to Vercel project settings → **Environment Variables**
2. Update `NEXTAUTH_URL` to your Vercel URL: `https://your-app.vercel.app`
3. Update `NEXT_PUBLIC_BACKEND_URL` (after backend deployment)
4. Click **"Redeploy"** to apply changes

---

## Deploy Backend to Digital Ocean VPS

### Step 1: Create Droplet
1. Log in to Digital Ocean
2. Click **"Create"** → **"Droplets"**
3. Choose:
   - **OS**: Ubuntu 24.04 LTS
   - **Plan**: Basic ($6/month - 1GB RAM, 1 vCPU)
   - **Datacenter**: Choose closest to your users
   - **Authentication**: SSH Key (recommended) or Password
4. Click **"Create Droplet"**
5. Note your droplet's IP address

### Step 2: Connect via SSH
```bash
# Windows (PowerShell)
ssh root@YOUR_DROPLET_IP

# Or use PuTTY with your IP and SSH key
```

### Step 3: Initial Server Setup
```bash
# Update system
apt update && apt upgrade -y

# Create a new user (don't use root)
adduser deploy
usermod -aG sudo deploy

# Switch to new user
su - deploy
```

### Step 4: Install Node.js
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### Step 5: Install Redis
```bash
# Install Redis
sudo apt install redis-server -y

# Configure Redis
sudo nano /etc/redis/redis.conf
# Change: supervised no → supervised systemd
# Save and exit (Ctrl+X, Y, Enter)

# Restart Redis
sudo systemctl restart redis
sudo systemctl enable redis

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

### Step 6: Install PM2
```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command it outputs (sudo env PATH=...)
```

### Step 7: Deploy Backend Code
```bash
# Clone your repository
cd ~
git clone https://github.com/yourusername/jersey-allocation.git
cd jersey-allocation/backend

# Install dependencies
npm install

# Build TypeScript
npm run build
```

### Step 8: Configure Environment
```bash
# Create .env file
nano .env

# Paste your backend environment variables
# Update FRONTEND_URL to your Vercel URL
# Save and exit
```

### Step 9: Run Database Migrations
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### Step 10: Start with PM2
```bash
# Start the application
pm2 start dist/index.js --name jersey-backend

# Save PM2 configuration
pm2 save

# View logs
pm2 logs jersey-backend

# Check status
pm2 status
```

### Step 11: Install and Configure NGINX
```bash
# Install NGINX
sudo apt install nginx -y

# Create NGINX configuration
sudo nano /etc/nginx/sites-available/jersey-backend
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/jersey-backend /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test NGINX configuration
sudo nginx -t

# Restart NGINX
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 12: Configure Firewall
```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verify firewall status
sudo ufw status
```

### Step 13: Setup SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Certificate will auto-renew. Test renewal:
sudo certbot renew --dry-run
```

### Step 14: Update Backend Environment
```bash
# Edit .env to use HTTPS
nano ~/jersey-allocation/backend/.env

# Update FRONTEND_URL to use https://
# FRONTEND_URL="https://your-app.vercel.app"

# Restart PM2
pm2 restart jersey-backend
```

---

## Update Google OAuth

### Step 1: Add Production URLs
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add:
   ```
   https://your-app.vercel.app
   ```
5. Under **Authorized redirect URIs**, add:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
6. Click **"Save"**

---

## Post-Deployment Testing

### Test Checklist
- [ ] Frontend loads: `https://your-app.vercel.app`
- [ ] Backend health check: `https://yourdomain.com/health`
- [ ] Google OAuth sign-in works
- [ ] User data saves to database
- [ ] WebSocket connection establishes
- [ ] Jersey booking works end-to-end
- [ ] Real-time updates work
- [ ] Sign out works

### Testing Commands
```bash
# Test backend health
curl https://yourdomain.com/health

# Test WebSocket (from browser console)
# Open your app and check:
console.log(socket.connected)  // Should be true

# Check backend logs
ssh root@YOUR_DROPLET_IP
pm2 logs jersey-backend
```

---

## Monitoring & Maintenance

### PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs jersey-backend

# Restart app
pm2 restart jersey-backend

# Stop app
pm2 stop jersey-backend

# View monitoring dashboard
pm2 monit
```

### Update Backend Code
```bash
# SSH into server
ssh root@YOUR_DROPLET_IP

# Navigate to backend
cd ~/jersey-allocation/backend

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart app
pm2 restart jersey-backend
```

### Database Migrations
```bash
# After schema changes
cd ~/jersey-allocation/backend
npx prisma migrate deploy
pm2 restart jersey-backend
```

### Check Redis
```bash
# Connect to Redis
redis-cli

# Check keys
KEYS *

# Monitor commands in real-time
MONITOR

# Check memory usage
INFO memory

# Exit
exit
```

### NGINX Commands
```bash
# Test configuration
sudo nginx -t

# Restart NGINX
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

### Check Disk Space
```bash
# Check disk usage
df -h

# Clean old logs
pm2 flush  # Clear PM2 logs

# Clean old packages
sudo apt autoremove -y
```

---

## Troubleshooting

### Frontend Issues

**Build fails on Vercel**
```bash
# Check build logs in Vercel dashboard
# Common fixes:
# 1. Verify all environment variables are set
# 2. Check package.json dependencies
# 3. Clear Vercel cache and redeploy
```

**Authentication not working**
- Verify `NEXTAUTH_URL` matches your Vercel URL exactly
- Check `NEXTAUTH_SECRET` is set (generate with `openssl rand -base64 32`)
- Verify Google OAuth redirect URI includes your Vercel URL
- Check browser console for errors

**WebSocket not connecting**
- Verify `NEXT_PUBLIC_BACKEND_URL` points to your backend
- Check backend is running: `pm2 status`
- Verify NGINX is configured for WebSocket (see Step 11)
- Check CORS settings in backend

### Backend Issues

**App won't start**
```bash
# Check PM2 logs
pm2 logs jersey-backend --lines 100

# Common fixes:
# 1. Verify .env file exists and has all variables
# 2. Check Redis is running: redis-cli ping
# 3. Verify database connection: npx prisma db push
# 4. Check port 4000 isn't used: lsof -i :4000
```

**Database connection fails**
```bash
# Test connection
npx prisma db push

# Verify DATABASE_URL format
# Should use -pooler endpoint with pgbouncer=true
# DIRECT_URL should use direct endpoint (no -pooler)
```

**Redis errors**
```bash
# Check Redis status
sudo systemctl status redis

# Restart Redis
sudo systemctl restart redis

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

**High memory usage**
```bash
# Check memory
free -m

# Restart app to clear memory
pm2 restart jersey-backend

# If persistent, upgrade droplet to 2GB RAM ($12/month)
```

**NGINX 502 Bad Gateway**
```bash
# Check backend is running
pm2 status

# Check NGINX error logs
sudo tail -f /var/log/nginx/error.log

# Verify NGINX config
sudo nginx -t

# Restart NGINX
sudo systemctl restart nginx
```

### SSL Certificate Issues
```bash
# Certificate expired
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Restart NGINX after renewal
sudo systemctl restart nginx
```

---

## Cost Estimate

### Monthly Costs

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby (Free) | $0 |
| Digital Ocean VPS | Basic (1GB RAM) | $6 |
| Neon PostgreSQL | Free Tier | $0 |
| Domain (optional) | .com domain | ~$12/year |
| **Total** | | **~$6-7/month** |

### Scaling Up (50-100+ concurrent users)

| Service | Upgraded Plan | Cost |
|---------|---------------|------|
| Vercel | Pro (if needed) | $20/month |
| Digital Ocean VPS | 2GB RAM | $12/month |
| Neon PostgreSQL | Pro (if needed) | $19/month |
| **Total** | | **~$51/month** |

---

## Deployment Checklist

### Before Deployment
- [ ] Code pushed to GitHub
- [ ] All environment variables documented
- [ ] Database migrations tested locally
- [ ] Production build tested: `npm run build`
- [ ] TypeScript errors resolved
- [ ] .env files not committed to git

### Frontend Deployment
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] `NEXTAUTH_URL` updated with production URL
- [ ] Google OAuth redirect URI updated

### Backend Deployment
- [ ] VPS created and SSH access confirmed
- [ ] Node.js, Redis, NGINX installed
- [ ] Backend code deployed and built
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] PM2 running and saved
- [ ] NGINX configured and restarted
- [ ] SSL certificate installed
- [ ] Firewall configured

### Post-Deployment
- [ ] All tests passing
- [ ] Frontend connects to backend
- [ ] Authentication works end-to-end
- [ ] WebSockets connecting
- [ ] Real-time features working
- [ ] PM2 monitoring setup
- [ ] Error logging working

---

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs jersey-backend`
2. Check NGINX logs: `sudo tail -f /var/log/nginx/error.log`
3. Check Vercel deployment logs in dashboard
4. Review Neon database logs in dashboard
5. Check Google OAuth configuration

---

**Last Updated**: February 22, 2026  
**Version**: 1.0.0
