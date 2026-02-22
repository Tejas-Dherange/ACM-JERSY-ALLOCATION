# Email Whitelist Configuration

This application uses email whitelisting to restrict access to only authorized users.

## How It Works

Only emails listed in the `allowed-emails.csv` file can sign in to the application. When a user attempts to sign in with Google OAuth:

1. **Frontend Check**: NextAuth checks the email against the whitelist during sign-in
2. **Backend Check**: Backend validates the email on every API/WebSocket request
3. **Rejection**: Unauthorized emails are denied access with an error message

## Setup Instructions

### 1. Configure Allowed Emails

Edit the `allowed-emails.csv` file in both frontend and backend directories:

**Frontend**: `frontend/allowed-emails.csv`  
**Backend**: `backend/allowed-emails.csv`

#### CSV Format
```csv
email
user1@example.com
user2@example.com
admin@company.com
john.doe@company.com
```

- First line must be the header: `email`
- One email per line
- Emails are case-insensitive
- Blank lines are ignored

### 2. Keep Both Files in Sync

**Important**: Make sure both `frontend/allowed-emails.csv` and `backend/allowed-emails.csv` contain the same emails.

You can use this command to copy from frontend to backend:

```powershell
# Windows PowerShell
Copy-Item "frontend\allowed-emails.csv" "backend\allowed-emails.csv"
```

```bash
# Linux/Mac
cp frontend/allowed-emails.csv backend/allowed-emails.csv
```

### 3. Production Deployment

#### Vercel (Frontend)
The `allowed-emails.csv` file will be included in your build. To update:
1. Edit `frontend/allowed-emails.csv`
2. Commit and push to GitHub
3. Vercel will automatically redeploy

#### Digital Ocean VPS (Backend)
1. SSH into your server
2. Edit the file:
   ```bash
   nano ~/jersey-allocation/backend/allowed-emails.csv
   ```
3. Restart the application:
   ```bash
   pm2 restart jersey-backend
   ```

## Adding/Removing Users

### Add a User
1. Add their email to `allowed-emails.csv` (both frontend and backend)
2. Redeploy/restart the application
3. User can now sign in with Google OAuth

### Remove a User
1. Remove their email from `allowed-emails.csv` (both frontend and backend)
2. Redeploy/restart the application
3. User will be denied on next sign-in attempt
4. **Note**: Already signed-in users will remain connected until:
   - They sign out
   - Their session expires (30 days)
   - Backend cache expires and they're checked again

## Testing

### Test with Allowed Email
1. Add your email to `allowed-emails.csv`
2. Start the application
3. Sign in with Google OAuth
4. ✅ Should successfully sign in

### Test with Unauthorized Email
1. Remove your email from `allowed-emails.csv` (or use a different account)
2. Start the application
3. Try to sign in with Google OAuth
4. ❌ Should see "Access Denied" error message

## Logs

Check logs to see whitelist activity:

### Frontend Logs
```bash
cd frontend
npm run dev
```
Look for:
- `[Email Whitelist] Loaded X allowed emails`
- `[Auth] Sign-in denied for email: example@example.com`

### Backend Logs
```bash
cd backend
npm run dev

# Or in production
pm2 logs jersey-backend
```
Look for:
- `[Email Whitelist] Loaded X allowed emails`
- `[Email Whitelist] Rejected: example@example.com`
- `[Auth] User email not in whitelist: example@example.com`

## Security Notes

1. **CSV Files Are Not Secret**: The `allowed-emails.csv` files are committed to your repository. They contain email addresses only (no passwords).

2. **Two-Layer Protection**:
   - Frontend: Prevents unauthorized sign-in
   - Backend: Validates on every request (prevents bypass)

3. **Cache Considerations**: Backend caches user validation for 5 minutes. After removing a user from the whitelist:
   - New connections: Immediately blocked
   - Existing connections: Blocked after cache expires (~5 minutes)

4. **Session Expiry**: Users stay signed in for 30 days unless:
   - They sign out manually
   - Their email is removed and they try to make a request after cache expiry

## Troubleshooting

### "Access Denied" for Authorized Email
1. Check email spelling in CSV (no extra spaces)
2. Verify CSV file exists in correct location
3. Check logs: `[Email Whitelist] Loaded X allowed emails`
4. Restart application to reload CSV

### No Emails Loaded
If you see `[Email Whitelist] No emails loaded - allowing all`:
- CSV file doesn't exist or is in wrong location
- CSV file is empty or malformed
- **Warning**: Application allows ALL emails as fallback

### CSV Format Issues
```csv
✅ Correct:
email
user@example.com

❌ Wrong (no header):
user@example.com

❌ Wrong (multiple columns):
email,name
user@example.com,User Name
```

## Example Workflows

### Bulk Import from Existing List
If you have emails in a text file or spreadsheet:

1. Create CSV with header:
   ```csv
   email
   ```

2. Add emails (one per line):
   ```csv
   email
   alice@company.com
   bob@company.com
   charlie@company.com
   ```

3. Copy to both locations:
   ```powershell
   Copy-Item "emails.csv" "frontend\allowed-emails.csv"
   Copy-Item "emails.csv" "backend\allowed-emails.csv"
   ```

### Team Onboarding
When new team members join:
```bash
# Add to CSV
echo "newmember@company.com" >> frontend/allowed-emails.csv
echo "newmember@company.com" >> backend/allowed-emails.csv

# Commit changes
git add frontend/allowed-emails.csv backend/allowed-emails.csv
git commit -m "Add newmember@company.com to whitelist"
git push

# Frontend auto-deploys on Vercel
# Backend restart:
ssh user@your-vps
pm2 restart jersey-backend
```

## Alternative: Environment Variable (Advanced)

For production, you can also load emails from an environment variable:

**Not implemented yet** - Current version uses CSV files only.

If needed, this can be added as an optional feature.
