# Deploy to Vercel

## Quick Deploy

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts** - Vercel will automatically detect your Express app

## Manual Deploy

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's an Express app
5. Click "Deploy"

## What's Changed

- ✅ Added `vercel.json` - Minimal config for Express server
- ✅ Added `vercel-build` script - Builds CSS during deployment
- ✅ Added `.vercelignore` - Excludes unnecessary files
- ✅ No changes to your existing code!

## Local Development

```bash
# Start development server
npm start

# Or with auto-restart
npm run dev
```

Your app works exactly the same locally and on Vercel! 🚀
