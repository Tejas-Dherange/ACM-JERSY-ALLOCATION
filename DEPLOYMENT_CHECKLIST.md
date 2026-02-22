# 🚀 Deployment Checklist

Complete this checklist to ensure successful deployment.

---

## ✅ Pre-Deployment

- [ ] Code committed and pushed to GitHub
- [ ] Generated secure `BACKEND_API_KEY` using `openssl rand -base64 32`
- [ ] Created `backend/.env.production` file
- [ ] Verified all credentials are correct (database, Google OAuth, Cloudinary)
- [ ] Updated `docker-compose.yml` (backend service uncommented)

---

## ✅ Digital Ocean VPS Setup

### Account & Droplet
- [ ] Created Digital Ocean account
- [ ] Created Ubuntu 22.04 droplet (minimum 2GB RAM)
- [ ] Noted droplet IP address: `_________________`
- [ ] Can SSH into droplet: `ssh root@YOUR_IP`

### Software Installation
- [ ] Installed Docker: `curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh`
- [ ] Installed Docker Compose: `apt install docker-compose -y`
- [ ] Verified installations: `docker --version` and `docker-compose --version`

### Application Setup
- [ ] Created app directory: `mkdir -p /var/www/jersey-app`
- [ ] Cloned repository: `git clone YOUR_REPO_URL /var/www/jersey-app`
- [ ] Created `backend/.env.production` on VPS
- [ ] Pasted production environment variables

### Docker Deployment
- [ ] Built and started containers: `docker-compose up -d --build`
- [ ] Verified containers running: `docker-compose ps` (both healthy)
- [ ] Checked logs: `docker-compose logs backend` (no errors)
- [ ] Tested health endpoint: `curl http://localhost:4000/api/health` (returns ok)

### Firewall Configuration
- [ ] Allowed SSH: `ufw allow ssh`
- [ ] Allowed backend port: `ufw allow 4000/tcp`
- [ ] Allowed HTTP: `ufw allow 80/tcp`
- [ ] Allowed HTTPS: `ufw allow 443/tcp`
- [ ] Enabled firewall: `ufw --force enable`
- [ ] Verified firewall: `ufw status`

### Nginx Setup (Optional)
- [ ] Installed Nginx: `apt install nginx -y`
- [ ] Created config: `/etc/nginx/sites-available/jersey-backend`
- [ ] Enabled site: `ln -s /etc/nginx/sites-available/jersey-backend /etc/nginx/sites-enabled/`
- [ ] Tested config: `nginx -t`
- [ ] Restarted Nginx: `systemctl restart nginx`

### SSL Setup (If using domain)
- [ ] Installed Certbot: `apt install certbot python3-certbot-nginx -y`
- [ ] Obtained certificate: `certbot --nginx -d api.yourdomain.com`
- [ ] Certificate installed successfully

### Auto-restart Setup
- [ ] Created systemd service: `/etc/systemd/system/jersey-app.service`
- [ ] Enabled service: `systemctl enable jersey-app.service`
- [ ] Tested service: `systemctl status jersey-app.service`

---

## ✅ Vercel Deployment

### Repository Import
- [ ] Logged into Vercel: https://vercel.com
- [ ] Imported GitHub repository
- [ ] Set Root Directory to `frontend`
- [ ] Framework detected as Next.js

### Environment Variables
Added all required variables:
- [ ] `AUTH_SECRET`
- [ ] `NEXTAUTH_URL` (temporary value)
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `NEXT_PUBLIC_BACKEND_URL` (your VPS IP or domain)
- [ ] `BACKEND_URL` (your VPS IP or domain)
- [ ] `BACKEND_API_KEY` (must match backend)
- [ ] `DATABASE_URL`
- [ ] `DIRECT_URL`

### Deployment
- [ ] Clicked "Deploy"
- [ ] Build completed successfully
- [ ] Noted Vercel URL: `https://_______________________.vercel.app`
- [ ] Updated `NEXTAUTH_URL` to actual Vercel URL
- [ ] Redeployed after updating `NEXTAUTH_URL`

---

## ✅ Post-Deployment Configuration

### Update Backend
- [ ] SSH to VPS: `ssh root@YOUR_IP`
- [ ] Edited `backend/.env.production`
- [ ] Updated `FRONTEND_URL` to Vercel URL
- [ ] Restarted backend: `docker-compose restart backend`
- [ ] Verified restart: `docker-compose logs backend`

### Google OAuth Configuration
- [ ] Opened Google Cloud Console: https://console.cloud.google.com/apis/credentials
- [ ] Edited OAuth 2.0 Client
- [ ] Added JavaScript origin: Your Vercel URL
- [ ] Added redirect URI: `https://YOUR_VERCEL_URL/api/auth/callback/google`
- [ ] Saved changes

### DNS Configuration (If using custom domains)
- [ ] Added A record for backend: `api.yourdomain.com → VPS_IP`
- [ ] Added domain to Vercel for frontend
- [ ] Configured Vercel DNS records
- [ ] Waited for DNS propagation (5-30 minutes)
- [ ] Verified DNS: `nslookup yourdomain.com`

---

## ✅ Testing

### Backend Health
- [ ] Tested health endpoint: `curl http://YOUR_VPS_IP:4000/api/health`
- [ ] Returns: `{"status":"ok"}`
- [ ] Or with domain: `curl https://api.yourdomain.com/api/health`

### Frontend Access
- [ ] Visited: `https://your-vercel-url.vercel.app`
- [ ] Page loads without errors
- [ ] No console errors in browser dev tools

### Authentication
- [ ] Clicked "Sign in with Google"
- [ ] Successfully logged in with authorized email
- [ ] Redirected to `/dashboard` after login
- [ ] User profile shows in header

### WebSocket Connection
- [ ] Dashboard shows "Connected" status
- [ ] Jersey grid loads (100 jerseys visible)
- [ ] Connection indicator is green

### Jersey Booking
- [ ] Clicked available jersey number
- [ ] Booking form modal opens
- [ ] Filled all fields:
  - [ ] Full Name
  - [ ] Contact Number
  - [ ] Selected Hoodie Size
  - [ ] Entered Print Name (uppercase)
  - [ ] Uploaded payment screenshot
  - [ ] Selected payment mode
- [ ] Clicked "Confirm Booking"
- [ ] Success message appears
- [ ] Jersey card shows "Taken" with print name
- [ ] Jersey number highlighted in header

### Real-time Updates
- [ ] Opened dashboard in second browser/incognito
- [ ] Logged in with different authorized email
- [ ] Booked jersey in first browser
- [ ] Jersey immediately updates in second browser
- [ ] Print name visible on card

### Cloudinary Upload
- [ ] Payment screenshot uploaded successfully
- [ ] No upload errors in console
- [ ] Image URL starts with `https://res.cloudinary.com`

### Admin Dashboard
- [ ] Visited: `https://YOUR_VERCEL_URL/admin`
- [ ] Logged in as: `tejasdherange0099@gmail.com`
- [ ] Dashboard shows booking statistics
- [ ] Table displays all bookings with:
  - [ ] Jersey number
  - [ ] Full name
  - [ ] Print name
  - [ ] Hoodie size
  - [ ] Payment mode
  - [ ] Booked timestamp
- [ ] Search functionality works
- [ ] Can see payment screenshot

### Email Whitelist
- [ ] Tried login with non-whitelisted email
- [ ] Access denied correctly
- [ ] Tried login with whitelisted email
- [ ] Access granted

---

## ✅ Monitoring Setup

### VPS Monitoring
- [ ] Can view logs: `docker-compose logs -f backend`
- [ ] Can check status: `docker-compose ps`
- [ ] Can view resource usage: `docker stats`
- [ ] Setup monitoring (optional): `htop` or Netdata

### Vercel Monitoring
- [ ] Can access Vercel dashboard
- [ ] Can view deployment logs
- [ ] Can view function logs
- [ ] Can see analytics

### Database Monitoring
- [ ] Can access Neon console
- [ ] Can view connection pool usage
- [ ] Can run queries
- [ ] Automatic backups enabled

---

## ✅ Documentation

- [ ] Saved VPS IP address
- [ ] Saved Vercel URL
- [ ] Saved all credentials securely
- [ ] Documented custom domain (if any)
- [ ] Saved deployment commands
- [ ] Documented environment variables
- [ ] Created backup of `.env.production`

---

## ✅ Final Verification

### Production Ready
- [ ] ✅ Frontend accessible and working
- [ ] ✅ Backend healthy and responding
- [ ] ✅ Database connected and storing data
- [ ] ✅ Redis working (state management)
- [ ] ✅ WebSocket real-time updates working
- [ ] ✅ Authentication working
- [ ] ✅ File uploads to Cloudinary working
- [ ] ✅ Admin dashboard functional
- [ ] ✅ Email whitelist protecting access
- [ ] ✅ All 21 emails can access
- [ ] ✅ Non-whitelisted emails blocked
- [ ] ✅ Print names showing on cards
- [ ] ✅ Complete booking form working
- [ ] ✅ No errors in logs
- [ ] ✅ SSL/HTTPS working (if configured)

---

## 🎉 Deployment Complete!

Your Jersey Allocation App is now live in production!

**Your URLs:**
- Frontend: `https://____________________________`
- Backend: `http://____________________________:4000`
- Admin: `https://____________________________/admin`

**Next Steps:**
1. Share frontend URL with authorized users
2. Monitor logs for first few days: `docker-compose logs -f backend`
3. Check Vercel analytics for traffic
4. Setup regular database backups
5. Monitor VPS resource usage

**Need to update code?**
```bash
# On VPS
cd /var/www/jersey-app
git pull origin main
docker-compose up -d --build
```

**Need help?**
- View logs: `docker-compose logs -f backend`
- Check status: `docker-compose ps`
- Restart: `docker-compose restart`
- See [DEPLOYMENT_STEPS.md](DEPLOYMENT_STEPS.md) for detailed guide
