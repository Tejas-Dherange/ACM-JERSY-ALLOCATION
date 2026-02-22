# Step-by-Step Production Deployment Guide

Complete guide for deploying Jersey Allocation App to production:
- **Frontend**: Vercel (Next.js)
- **Backend**: Digital Ocean VPS (Docker + Docker Compose)
- **Database**: Neon PostgreSQL (already setup)
- **Redis**: Self-hosted on VPS (Docker container)

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Part 1: Prepare for Deployment](#part-1-prepare-for-deployment)
3. [Part 2: Deploy Backend to Digital Ocean](#part-2-deploy-backend-to-digital-ocean)
4. [Part 3: Deploy Frontend to Vercel](#part-3-deploy-frontend-to-vercel)
5. [Part 4: Configure Domain & SSL](#part-4-configure-domain--ssl)
6. [Part 5: Post-Deployment Testing](#part-5-post-deployment-testing)
7. [Part 6: Maintenance & Monitoring](#part-6-maintenance--monitoring)

---

## Prerequisites

### Required Accounts
- ✅ GitHub account (for code repository)
- ✅ Vercel account (sign up at https://vercel.com)
- ✅ Digital Ocean account (sign up at https://digitalocean.com)
- ✅ Neon PostgreSQL (already configured)
- ✅ Google Cloud Console (OAuth already configured)
- ✅ Cloudinary account (already configured)

### Optional (Recommended)
- Domain name (e.g., yourdomain.com from Namecheap, GoDaddy)
- SSH key pair for secure VPS access

### Local Requirements
- Git installed
- SSH client (built-in on Windows 10+, macOS, Linux)

---

## Part 1: Prepare for Deployment

### Step 1.1: Update Docker Compose for Production

Update `docker-compose.yml` to enable backend service:

```yaml
version: '3.9'

services:
  # ── Redis ──────────────────────────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: jersey-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: [ 'CMD', 'redis-cli', 'ping' ]
      interval: 10s
      timeout: 5s
      retries: 5

  # ── Backend ────────────────────────────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: jersey-backend
    restart: unless-stopped
    ports:
      - '4000:4000'
    env_file:
      - ./backend/.env.production
    environment:
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: [ 'CMD', 'wget', '-qO-', 'http://localhost:4000/api/health' ]
      interval: 15s
      timeout: 5s
      retries: 3

volumes:
  redis_data:
```

### Step 1.2: Create Production Environment File

Create `backend/.env.production`:

```bash
cd backend
cp .env .env.production
```

Edit `backend/.env.production`:

```env
# Server
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-app-name.vercel.app  # Update after Vercel deployment

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@your-neon-endpoint.aws.neon.tech/dbname?sslmode=require&pgbouncer=true&connect_timeout=10&pool_timeout=10&connection_limit=10"
DIRECT_URL="postgresql://user:password@your-neon-endpoint.aws.neon.tech/dbname?sslmode=require"

# Redis (Docker container)
REDIS_URL=redis://redis:6379

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Auth Secret (must match frontend)
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-auth-secret-here

# Backend API Key (CHANGE THIS - generate new secure key)
BACKEND_API_KEY=GENERATE_NEW_KEY_HERE  # Run: openssl rand -base64 32

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### Step 1.3: Generate Secure API Key

On your local machine:

```bash
# Generate secure backend API key
openssl rand -base64 32
```

Copy the output and update both:
- `backend/.env.production` → `BACKEND_API_KEY`
- Save this for frontend deployment (you'll need it in Vercel)

### Step 1.4: Push Code to GitHub

```bash
# Initialize git (if not already done)
cd "d:\PerSonal Projects\Jersy-Allocation"
git init

# Add .gitignore to exclude sensitive files
echo "node_modules/
.env
.env.local
.env.production
.next/
dist/
*.log" > .gitignore

# Add and commit
git add .
git commit -m "Production ready - Jersey Allocation App"

# Create GitHub repository (go to github.com/new)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/jersey-allocation.git
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy Backend to Digital Ocean

### Step 2.1: Create Digital Ocean Droplet

1. **Login to Digital Ocean**: https://cloud.digitalocean.com

2. **Create Droplet**:
   - Click **"Create"** → **"Droplets"**
   - Choose image: **Ubuntu 22.04 LTS**
   - Plan: **Basic**
   - CPU options: **Regular (2 GB / 1 CPU)** - $18/month (recommended minimum)
   - Datacenter: Choose closest to your users
   - Authentication: **SSH Key** (recommended) or **Password**
   - Hostname: `jersey-backend`
   - Click **"Create Droplet"**

3. **Wait for droplet creation** (1-2 minutes)

4. **Note your droplet's IP address** (e.g., `123.45.67.89`)

### Step 2.2: Connect to VPS

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# If using password, enter it when prompted
# If using SSH key, it should connect automatically
```

### Step 2.3: Install Docker & Docker Compose

```bash
# Update system packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version

# Enable Docker to start on boot
systemctl enable docker
systemctl start docker
```

### Step 2.4: Setup Application Directory

```bash
# Create app directory
mkdir -p /var/www/jersey-app
cd /var/www/jersey-app

# Clone your repository
git clone https://github.com/YOUR_USERNAME/jersey-allocation.git .

# Verify files
ls -la
```

### Step 2.5: Configure Production Environment

```bash
# Navigate to backend
cd backend

# Create production environment file
nano .env.production
```

Paste your production environment variables (from Step 1.2), then:
- Press `Ctrl + X`
- Press `Y` to save
- Press `Enter` to confirm

**Important**: Update `FRONTEND_URL` later after Vercel deployment.

### Step 2.6: Build and Start Docker Containers

```bash
# Go to project root
cd /var/www/jersey-app

# Build and start containers
docker-compose up -d --build

# This will:
# 1. Build the backend Docker image
# 2. Pull Redis image
# 3. Start both containers
# 4. Run database migrations automatically
```

### Step 2.7: Verify Deployment

```bash
# Check container status
docker-compose ps

# Should show:
# jersey-redis   running (healthy)
# jersey-backend running (healthy)

# View logs
docker-compose logs -f backend

# Press Ctrl+C to exit logs

# Test health endpoint
curl http://localhost:4000/api/health

# Should return: {"status":"ok"}
```

### Step 2.8: Configure Firewall

```bash
# Enable UFW firewall
ufw allow ssh
ufw allow 4000/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Check status
ufw status
```

### Step 2.9: Setup Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
apt install nginx -y

# Create Nginx configuration
nano /etc/nginx/sites-available/jersey-backend
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;  # e.g., api.yourdomain.com or 123.45.67.89

    client_max_body_size 10M;

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
        
        # WebSocket support
        proxy_read_timeout 86400;
    }
}
```

Save and enable:

```bash
# Enable site
ln -s /etc/nginx/sites-available/jersey-backend /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

### Step 2.10: Setup SSL with Let's Encrypt (If using domain)

**Skip this if using IP address directly**

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d api.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose option 2: Redirect HTTP to HTTPS

# Certbot will automatically:
# - Get SSL certificate
# - Update Nginx config
# - Setup auto-renewal
```

### Step 2.11: Setup Auto-Restart on Reboot

```bash
# Create systemd service
nano /etc/systemd/system/jersey-app.service
```

Paste:

```ini
[Unit]
Description=Jersey Allocation App
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/jersey-app
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down

[Install]
WantedBy=multi-user.target
```

Enable service:

```bash
# Enable service
systemctl enable jersey-app.service

# Test service
systemctl status jersey-app.service
```

---

## Part 3: Deploy Frontend to Vercel

### Step 3.1: Prepare Frontend Environment Variables

Before deploying, prepare these values:

```env
# NextAuth
NEXTAUTH_URL=https://your-app-name.vercel.app  # Will be provided by Vercel
AUTH_SECRET=your-auth-secret-here  # Generate with: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend URLs
NEXT_PUBLIC_BACKEND_URL=http://YOUR_DROPLET_IP:4000  # or https://api.yourdomain.com
BACKEND_URL=http://YOUR_DROPLET_IP:4000  # or https://api.yourdomain.com
BACKEND_API_KEY=YOUR_GENERATED_API_KEY  # From Step 1.3

# Database
DATABASE_URL="postgresql://user:password@your-neon-endpoint.aws.neon.tech/dbname?sslmode=require&pgbouncer=true&connect_timeout=10&pool_timeout=10&connection_limit=5"
DIRECT_URL="postgresql://user:password@your-neon-endpoint.aws.neon.tech/dbname?sslmode=require"
```

### Step 3.2: Import to Vercel

1. **Go to Vercel**: https://vercel.com/new

2. **Import Git Repository**:
   - Click **"Add New"** → **"Project"**
   - Select **GitHub**
   - Choose your `jersey-allocation` repository
   - Click **"Import"**

3. **Configure Project**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `frontend`
   - Click **"Edit"** next to Root Directory
   - Select `frontend` folder
   - Click **"Continue"**

### Step 3.3: Add Environment Variables in Vercel

1. **Expand "Environment Variables"** section

2. **Add each variable** from Step 3.1:
   - Key: `AUTH_SECRET`
   - Value: `your-auth-secret-here` (generate with: openssl rand -base64 32)
   - Environment: **Production**, **Preview**, **Development** (check all)
   - Click **"Add"**

3. **Repeat for all variables**:
   - `NEXTAUTH_URL` (leave as-is for now, update later)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_BACKEND_URL`
   - `BACKEND_URL`
   - `BACKEND_API_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`

### Step 3.4: Deploy

1. Click **"Deploy"**

2. **Wait for build** (2-5 minutes)
   - Vercel will:
     - Install dependencies
     - Build Next.js app
     - Deploy to edge network

3. **Get your deployment URL**:
   - After successful deployment, you'll see: `https://your-app-name.vercel.app`
   - Copy this URL

### Step 3.5: Update NEXTAUTH_URL

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **Edit `NEXTAUTH_URL`**:
   - Update value to: `https://your-app-name.vercel.app`
   - Click **"Save"**

3. **Redeploy**:
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

### Step 3.6: Update Backend FRONTEND_URL

1. **SSH to Digital Ocean**:
   ```bash
   ssh root@YOUR_DROPLET_IP
   cd /var/www/jersey-app/backend
   ```

2. **Edit environment file**:
   ```bash
   nano .env.production
   ```

3. **Update `FRONTEND_URL`**:
   ```env
   FRONTEND_URL=https://your-app-name.vercel.app
   ```

4. **Restart backend**:
   ```bash
   cd /var/www/jersey-app
   docker-compose restart backend
   ```

---

## Part 4: Configure Domain & SSL

### Option A: Using Custom Domain for Frontend (Vercel)

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Domains**

2. **Add Domain**:
   - Enter: `yourdomain.com` or `app.yourdomain.com`
   - Click **"Add"**

3. **Configure DNS**:
   - Vercel will show DNS records to add
   - Go to your domain registrar (Namecheap, GoDaddy, etc.)
   - Add the A/CNAME records shown by Vercel
   - Wait for DNS propagation (5-30 minutes)

4. **Update Environment Variables**:
   - After domain is verified, update `NEXTAUTH_URL` to your custom domain
   - Update backend `FRONTEND_URL` to match

### Option B: Using Custom Domain for Backend (Digital Ocean)

**If you want `api.yourdomain.com` instead of IP address:**

1. **Add DNS A Record**:
   - Go to your domain registrar
   - Add A record:
     - Name: `api`
     - Value: Your Digital Ocean droplet IP
     - TTL: 300 seconds

2. **Update Nginx** (on VPS):
   ```bash
   nano /etc/nginx/sites-available/jersey-backend
   ```
   
   Update `server_name`:
   ```nginx
   server_name api.yourdomain.com;
   ```

3. **Get SSL Certificate**:
   ```bash
   certbot --nginx -d api.yourdomain.com
   ```

4. **Update Frontend URLs**:
   - In Vercel environment variables, update:
     - `NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com`
     - `BACKEND_URL=https://api.yourdomain.com`
   - Redeploy frontend

---

## Part 5: Post-Deployment Testing

### Step 5.1: Update Google OAuth

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials

2. **Edit OAuth 2.0 Client**:
   - Click on your OAuth client

3. **Add Authorized JavaScript Origins**:
   - `https://your-app-name.vercel.app`
   - Or your custom domain: `https://yourdomain.com`

4. **Add Authorized Redirect URIs**:
   - `https://your-app-name.vercel.app/api/auth/callback/google`
   - Or: `https://yourdomain.com/api/auth/callback/google`

5. **Save changes**

### Step 5.2: Test Complete Flow

1. **Visit your frontend**: `https://your-app-name.vercel.app`

2. **Test authentication**:
   - Click **"Sign in with Google"**
   - Login with authorized email (from whitelist)
   - Should redirect to `/dashboard`

3. **Test WebSocket connection**:
   - Dashboard should show jersey grid
   - Connection indicator should show "Connected"

4. **Test jersey booking**:
   - Click on an available jersey
   - Fill complete booking form:
     - Full Name
     - Contact Number
     - Select Hoodie Size
     - Name to Print
     - Upload Payment Screenshot
     - Select Payment Mode
   - Click **"Confirm Booking"**
   - Jersey should show "Taken" with print name

5. **Test admin dashboard**:
   - Go to: `https://your-app-name.vercel.app/admin`
   - Login with: `tejasdherange0099@gmail.com`
   - Should show all bookings with details

6. **Test real-time updates**:
   - Open dashboard in two browsers
   - Book jersey in one browser
   - Should immediately update in second browser

### Step 5.3: Verify Backend Health

```bash
# From your local machine:

# Test health endpoint
curl https://api.yourdomain.com/api/health
# or
curl http://YOUR_DROPLET_IP:4000/api/health

# Should return: {"status":"ok"}
```

### Step 5.4: Check Backend Logs

```bash
# SSH to VPS
ssh root@YOUR_DROPLET_IP

# View logs
cd /var/www/jersey-app
docker-compose logs -f backend

# Look for:
# - "Server listening on port 4000"
# - "Redis connected"
# - "Worker ready"
# - No errors
```

---

## Part 6: Maintenance & Monitoring

### Daily Monitoring

**Check Status**:
```bash
ssh root@YOUR_DROPLET_IP
cd /var/www/jersey-app
docker-compose ps
```

**View Logs**:
```bash
# Backend logs
docker-compose logs -f backend

# Redis logs
docker-compose logs redis
```

### Update Application

**When you push new code to GitHub:**

```bash
# SSH to VPS
ssh root@YOUR_DROPLET_IP
cd /var/www/jersey-app

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f backend
```

**Frontend auto-deploys** when you push to GitHub (Vercel handles this).

### Database Backups

**Neon automatically backs up your database**, but to export manually:

```bash
# From VPS
pg_dump "YOUR_DATABASE_URL" > backup.sql
```

### Redis Data Persistence

Redis data persists in Docker volume `redis_data`. To backup:

```bash
# Backup Redis data
docker-compose exec redis redis-cli BGSAVE

# Copy dump.rdb
docker cp jersey-redis:/data/dump.rdb ./redis-backup.rdb
```

### Restart Services

```bash
# Restart backend only
docker-compose restart backend

# Restart redis only
docker-compose restart redis

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Start all services
docker-compose up -d
```

### Clear Redis Cache

```bash
# From VPS
docker-compose exec redis redis-cli FLUSHALL
```

### View Resource Usage

```bash
# Check disk space
df -h

# Check memory
free -h

# Check Docker stats
docker stats
```

### Setup Monitoring (Optional)

**Install monitoring tools**:

```bash
# Install htop
apt install htop -y

# Run interactive monitor
htop

# Install netdata (web-based monitoring)
wget -O /tmp/netdata-kickstart.sh https://my-netdata.io/kickstart.sh
sh /tmp/netdata-kickstart.sh

# Access at: http://YOUR_DROPLET_IP:19999
```

---

## Troubleshooting

### Issue: Backend not starting

```bash
# Check logs
docker-compose logs backend

# Common causes:
# - Database connection error → Check DATABASE_URL
# - Redis connection error → Check if Redis container is running
# - Port already in use → Check: sudo lsof -i :4000
```

### Issue: Frontend can't connect to backend

```bash
# Check CORS settings
# Verify FRONTEND_URL in backend .env.production matches Vercel URL

# Test backend health
curl http://YOUR_DROPLET_IP:4000/api/health

# Check firewall
ufw status
```

### Issue: WebSocket connection failed

```bash
# Verify nginx WebSocket configuration
# Check proxy_read_timeout in nginx config
# Ensure Connection 'upgrade' header is set
```

### Issue: OAuth redirect mismatch

```bash
# Verify Google Console authorized redirect URIs
# Must exactly match: https://your-domain.com/api/auth/callback/google
```

### Issue: Database connection timeout

```bash
# Check Neon database status
# Verify DATABASE_URL has correct credentials
# Ensure &pgbouncer=true is in connection string
```

---

## Summary

### ✅ What You've Deployed

**Backend (Digital Ocean)**:
- 🐳 Docker container running Node.js app
- 🔴 Redis container for state management
- 🔒 Nginx reverse proxy with SSL
- 🔄 Auto-restart on server reboot
- 📊 Health monitoring endpoints

**Frontend (Vercel)**:
- ⚡ Next.js app on global edge network
- 🚀 Auto-deploy on Git push
- 🔐 Google OAuth authentication
- 📱 Real-time WebSocket updates
- 🎨 Responsive UI

**Database (Neon)**:
- 🐘 PostgreSQL with connection pooling
- ☁️ Managed hosting
- 💾 Automatic backups

**Storage (Cloudinary)**:
- 📸 Payment screenshot uploads
- 🖼️ Image optimization
- 🌍 CDN delivery

### 🎯 Your Production URLs

- Frontend: `https://your-app-name.vercel.app`
- Backend: `http://YOUR_DROPLET_IP:4000` or `https://api.yourdomain.com`
- Admin: `https://your-app-name.vercel.app/admin`

### 🚀 You're Live!

Your Jersey Allocation App is now running in production with:
- Real-time jersey reservations
- Complete booking forms
- Cloudinary image uploads
- Admin dashboard
- Email whitelist protection
- Docker-based deployment
- Self-hosted Redis

**Need help?** Check logs on VPS with `docker-compose logs -f backend`
