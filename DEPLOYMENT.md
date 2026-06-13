# DEPLOYMENT Guide

**For: Deploying to Vercel, environment setup, monitoring**

---

## Pre-Deployment Checklist

Before deploying to production:

- [ ] No `console.log()` debugging left in code (especially no logging of frame data)
- [ ] `.env.local` in `.gitignore` (never commit secrets)
- [ ] Run `npm run build` locally — no errors
- [ ] Test `npm run dev` after build
- [ ] Full pipeline works locally: upload → analyzing → all 5 steps → export
- [ ] Mobile responsive verified
- [ ] No console errors in DevTools

---

## Step 1: Prepare for GitHub

### Create Git Repo
```bash
cd rankr
git init
git add .
git commit -m "Initial RANKR MVP"
git branch -M main
git remote add origin https://github.com/[YOUR_USERNAME]/rankr.git
git push -u origin main
```

### .gitignore (Ensure Secrets Stay Local)
```
# Must ignore:
.env.local
.env.*.local
node_modules
.next
dist
.DS_Store

# Optional:
.vercel
```

---

## Step 2: Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel access to GitHub

---

## Step 3: Deploy to Vercel

### Option A: Automatic (Easiest)
```bash
1. Go to vercel.com/new
2. Import GitHub repo (rankr)
3. Vercel auto-detects Next.js
4. Click "Deploy"
5. Wait ~1-2 minutes
```

### Option B: CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from project directory
vercel

# Follow prompts, select "Vercel" when asked
```

### After Deploy
- Vercel assigns you a URL: `https://rankr-[random].vercel.app`
- View deployment: `vercel deploy --prod`

---

## Step 4: Set Environment Variables in Vercel

### In Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click on "rankr" project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

```
GOOGLE_GEMINI_API_KEY=AIza...
NEXT_PUBLIC_URL=https://rankr-[your-vercel-url].vercel.app
```

5. Click "Save"
6. **Redeploy** (Settings → Deployments → Redeploy)

### Verify Variables Loaded
```bash
# In your browser, check if the API works
curl -X POST https://rankr-[your-url].vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"description":"A short test video"}'
# Should return JSON with titles/description/tags/overallScore
```

---

## Step 5: Test End-to-End

### Test the Full Pipeline
1. Visit `https://rankr-[your-url].vercel.app`
2. Drop a short video file (well under 10 min / 300MB)
3. Watch the Analyzing screen progress through:
   extracting → analyzing → generating
4. Confirm the wizard loads with real AI-generated titles, thumbnails (real frames,
   enhanced), description, tags, and an overall score on step 5
5. Test "Copy to clipboard" on each step
6. Check Vercel logs for errors

### Test API Routes Directly
```bash
# Stage 2 (text generation) is easy to test with curl
curl -X POST https://rankr-[your-url].vercel.app/api/generate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"description":"A 10-minute vlog about a day trip to a mountain town."}'

# Should return JSON: { titles, description, tags, overallScore }
```

### Check Logs
```bash
# In Vercel Dashboard
1. Go to Project → Deployments
2. Click latest deployment
3. Go to Logs tab
4. View errors in real-time
```

---

## Step 6: Monitor Performance

### Vercel Analytics (Free)
```bash
1. In Vercel Dashboard → Project
2. Go to "Analytics" tab
3. Watch:
   - Page load times
   - API response times
   - Error rates
   - Usage trends
```

### Check Lighthouse Score
```bash
1. Visit your Vercel URL
2. Right-click → Inspect → DevTools
3. Go to "Lighthouse" tab
4. Run audit
5. Target score: >85 (all categories)
```

### Monitor API Costs
```bash
# Gemini API
1. Go to https://aistudio.google.com/apikey
2. View usage stats
3. Watch token consumption (should stay near $0 for personal use — see GEMINI_API.md)
```

---

## Common Issues & Fixes

### Issue: "API Key not found"
**Cause:** Environment variable not set in Vercel
**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Verify `GOOGLE_GEMINI_API_KEY` is set
3. Redeploy (`vercel deploy --prod`)

### Issue: "Failed to analyze frames" / "Failed to generate content"
**Cause:** Gemini API error or key invalid
**Fix:**
1. Check the Gemini API key is correct
2. Check rate limits (15 req/min on the free tier — unlikely to hit for personal use)
3. Check Vercel logs for error details
4. Test the API route locally first

### Issue: "Build failed"
**Cause:** Code errors, missing dependencies
**Fix:**
1. Run `npm run build` locally
2. Fix any errors shown
3. Commit and push to GitHub
4. Vercel auto-redeploys

---

## Maintenance (After Launch)

### Occasionally
- [ ] Check Vercel Logs for errors
- [ ] Review Gemini API token usage (should remain negligible)
- [ ] Check Lighthouse score after major UI changes

### If This Ever Becomes a Product
- [ ] Add a database (Supabase/Firebase) for user data
- [ ] Add payments (Stripe) and an access gate
- [ ] Add rate limiting per user
- [ ] Upgrade Gemini to Google Cloud billing if volume grows
- [ ] Add error tracking (Sentry)

---

## Rollback (If Something Breaks)

```bash
# In Vercel Dashboard:
1. Go to Deployments
2. Find previous good deployment
3. Click "..." → "Promote to Production"
4. Takes <1 minute to rollback

# Or locally:
git revert HEAD
git push
# Vercel auto-redeploys
```

---

## Custom Domain (Optional)

After launch, add a custom domain:

1. Buy domain (Vercel, Namecheap, GoDaddy, etc.)
2. In Vercel → Settings → Domains
3. Add your domain
4. Follow DNS setup instructions
5. Takes ~10 minutes to propagate

---

## Security Checklist

- [ ] `.env.local` in `.gitignore`
- [ ] No secrets committed to GitHub
- [ ] `GOOGLE_GEMINI_API_KEY` only used server-side (never exposed to the client)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Error messages don't expose stack traces
- [ ] No console logs of frame/image data in production code

---

## URLs to Know

```
Vercel Dashboard:     https://vercel.com/dashboard
Gemini API Console:   https://aistudio.google.com/apikey
Your App:             https://rankr-[your-id].vercel.app
```

---

**Deploy to Vercel, run the pipeline end-to-end, and start using it!**
