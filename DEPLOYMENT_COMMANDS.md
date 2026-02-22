# Quick Deployment Commands Reference

This is a quick reference of all commands needed for deployment.
For detailed explanations, see [DEPLOYMENT_STEPS.md](DEPLOYMENT_STEPS.md)

---

## Local Preparation

```bash
# Generate secure API key
openssl rand -base64 32

# Create production env file
cd backend
cp .env.production.example .env.production
# Edit .env.production with your values

# Push to GitHub
cd ..
git add .
git commit -m "Production ready"
git push origin main
```

---

## Digital Ocean VPS Setup

### Initial Setup (One-time)

```bash
# SSH into VPS
ssh root@YOUR_DROPLET_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose -y

# Clone repository
mkdir -p /var/www/jersey-app
cd /var/www/jersey-app
git clone https://github.com/YOUR_USERNAME/jersey-allocation.git .

# Configure environment
cd backend
nano .env.production
# Paste your production environment variables

# Start services
cd /var/www/jersey-app
docker-compose up -d --build

# Configure firewall
ufw allow ssh
ufw allow 4000/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Install Nginx (optional but recommended)
apt install nginx -y
nano /etc/nginx/sites-available/jersey-backend
# Paste nginx config from DEPLOYMENT_STEPS.md

ln -s /etc/nginx/sites-available/jersey-backend /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Setup SSL (if using domain)
apt install certbot python3-certbot-nginx -y
certbot --nginx -d api.yourdomain.com
```

### Deployment Commands

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Start services
docker-compose up -d

# Update application
git pull origin main
docker-compose up -d --build

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL

# View backend shell
docker-compose exec backend sh

# Database backup
pg_dump "YOUR_DATABASE_URL" > backup.sql
```

---

## Vercel Deployment

### Environment Variables to Add in Vercel

```env
AUTH_SECRET=your-auth-secret-here
NEXTAUTH_URL=https://your-app-name.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_BACKEND_URL=http://YOUR_DROPLET_IP:4000
BACKEND_URL=http://YOUR_DROPLET_IP:4000
BACKEND_API_KEY=YOUR_GENERATED_KEY
DATABASE_URL="postgresql://user:password@your-neon-endpoint.aws.neon.tech/dbname?sslmode=require&pgbouncer=true&connect_timeout=10&pool_timeout=10&connection_limit=5"
DIRECT_URL="postgresql://user:password@your-neon-endpoint.aws.neon.tech/dbname?sslmode=require"
```

### Deployment Steps

1. Go to https://vercel.com/new
2. Import GitHub repository
3. Set Root Directory to `frontend`
4. Add all environment variables above
5. Deploy
6. Update `NEXTAUTH_URL` after deployment
7. Redeploy

---

## Post-Deployment

### Update Backend with Vercel URL

```bash
ssh root@YOUR_DROPLET_IP
cd /var/www/jersey-app/backend
nano .env.production
# Update FRONTEND_URL=https://your-app-name.vercel.app

cd /var/www/jersey-app
docker-compose restart backend
```

### Update Google OAuth

1. Go to https://console.cloud.google.com/apis/credentials
2. Add JavaScript origins: `https://your-app-name.vercel.app`
3. Add redirect URI: `https://your-app-name.vercel.app/api/auth/callback/google`

### Test Deployment

```bash
# Test backend health
curl http://YOUR_DROPLET_IP:4000/api/health

# Test frontend
open https://your-app-name.vercel.app

# Test admin
open https://your-app-name.vercel.app/admin
```

---

## Monitoring

```bash
# View all logs
docker-compose logs

# Follow backend logs
docker-compose logs -f backend

# Follow redis logs
docker-compose logs -f redis

# Check resource usage
docker stats

# Check disk space
df -h

# Check memory
free -h
```

---

## Troubleshooting

```bash
# Restart everything
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# View container details
docker-compose ps
docker inspect jersey-backend

# Enter backend container
docker-compose exec backend sh

# Check nginx
nginx -t
systemctl status nginx
systemctl restart nginx

# Check firewall
ufw status

# View system logs
journalctl -u docker -f
```

---

## Maintenance

```bash
# Weekly: Update system packages
apt update && apt upgrade -y
docker system prune -f

# Monthly: Backup database
pg_dump "YOUR_DATABASE_URL" > backup-$(date +%Y%m%d).sql

# When needed: Pull latest code
cd /var/www/jersey-app
git pull origin main
docker-compose up -d --build
```
