# CityTap Deployment Guide

This guide covers deploying CityTap to various hosting platforms.

## Prerequisites

- Mapbox access token (sign up at https://mapbox.com)
- Node.js 18+ installed locally for building

## Quick Deploy Options

### 1. Vercel (Recommended for MVP)

Vercel offers free hosting with automatic builds and deployments.

**Steps:**

1. Push your code to GitHub/GitLab/Bitbucket
2. Visit https://vercel.com and sign up
3. Click "New Project" and import your repository
4. Add environment variable:
   - Name: `VITE_MAPBOX_TOKEN`
   - Value: Your Mapbox token
5. Deploy!

**Configuration:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 2. Netlify

Similar to Vercel with free tier and easy setup.

**Steps:**

1. Push code to Git repository
2. Visit https://netlify.com and sign up
3. Click "Add new site" → "Import an existing project"
4. Connect your repository
5. Add environment variable in site settings:
   - Key: `VITE_MAPBOX_TOKEN`
   - Value: Your Mapbox token
6. Deploy!

**Configuration:**
- Build command: `npm run build`
- Publish directory: `dist`

### 3. GitHub Pages

Free hosting for static sites.

**Steps:**

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Update `package.json`:
   ```json
   {
     "homepage": "https://yourusername.github.io/citytap",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. Update `vite.config.js`:
   ```javascript
   export default {
     base: '/citytap/',
     // ... rest of config
   }
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

**Note:** You'll need to hardcode the Mapbox token or use a different method for secrets.

### 4. Cloudflare Pages

Fast global CDN with free tier.

**Steps:**

1. Push code to GitHub
2. Visit https://pages.cloudflare.com
3. Create a new project and connect your repository
4. Set build settings:
   - Build command: `npm run build`
   - Build output: `dist`
5. Add environment variable `VITE_MAPBOX_TOKEN`
6. Deploy!

### 5. Self-Hosted (VPS/Cloud)

For more control over hosting.

**Steps:**

1. Build the project:
   ```bash
   npm run build
   ```

2. Copy the `dist` folder to your server

3. Serve with nginx:
   ```nginx
   server {
       listen 80;
       server_name citytap.example.com;
       root /var/www/citytap/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. Enable HTTPS with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d citytap.example.com
   ```

## Environment Variables

The app needs a Mapbox access token. Configure it based on your deployment platform:

### Development (.env file)
```bash
VITE_MAPBOX_TOKEN=pk.your_token_here
```

### Production

Most platforms let you set environment variables through their dashboard:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment variables
- **Cloudflare Pages**: Settings → Environment variables

Then update `src/components/Globe.jsx`:

```javascript
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'fallback_public_token';
```

## Performance Optimization

### 1. Code Splitting

Mapbox GL is large (~2MB). Consider lazy loading:

```javascript
// App.jsx
import { lazy, Suspense } from 'react';
const Globe = lazy(() => import('./components/Globe'));

// In component:
<Suspense fallback={<div>Loading globe...</div>}>
  <Globe {...props} />
</Suspense>
```

### 2. Compression

Most platforms enable gzip/brotli automatically. If self-hosting, enable in nginx:

```nginx
gzip on;
gzip_types text/css application/javascript image/svg+xml;
```

### 3. CDN

Use a CDN for faster global delivery:
- Cloudflare (free tier available)
- AWS CloudFront
- Google Cloud CDN

### 4. Image Optimization

Mapbox tiles are already optimized, but if you add custom assets:
- Use WebP format for images
- Compress with tools like ImageOptim
- Serve responsive images

## Monitoring & Analytics

### 1. Error Tracking

Add Sentry for error monitoring:

```bash
npm install @sentry/react
```

```javascript
// main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
});
```

### 2. Analytics

Add Google Analytics or Plausible:

```html
<!-- index.html -->
<script defer data-domain="citytap.com" src="https://plausible.io/js/script.js"></script>
```

### 3. Performance Monitoring

Use Web Vitals:

```bash
npm install web-vitals
```

```javascript
// main.jsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## Custom Domain

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Netlify
1. Go to Site Settings → Domain management
2. Add custom domain
3. Configure DNS

### Cloudflare Pages
1. Go to Custom domains
2. Add domain
3. Cloudflare handles DNS automatically if using their nameservers

## Backup & Rollback

### Git Tags
Tag releases for easy rollback:

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

### Vercel
Deployments are automatically saved. Rollback via dashboard:
1. Go to Deployments
2. Find previous deployment
3. Click "Promote to Production"

## Security

### 1. Environment Variables
- Never commit `.env` files
- Use platform-specific secrets management
- Rotate tokens periodically

### 2. HTTPS
- Always use HTTPS in production
- Enable HSTS headers
- Force HTTPS redirects

### 3. CSP Headers
Add Content Security Policy:

```javascript
// vite.config.js
export default {
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.mapbox.com;"
    }
  }
}
```

## Troubleshooting

### Build Fails
- Check Node.js version (18+ required)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Verify environment variables are set

### Mapbox Not Loading
- Check browser console for CORS errors
- Verify Mapbox token is valid
- Check token permissions (needs Public scope)

### Blank Page
- Check browser console for errors
- Verify all assets are served correctly
- Check base URL in `vite.config.js` matches deployment path

### Slow Performance
- Enable CDN
- Optimize images and assets
- Consider lazy loading Mapbox GL
- Check network tab for large downloads

## Cost Estimates

### Free Tier Limits

**Vercel:**
- 100GB bandwidth/month
- Unlimited deployments
- Custom domains included

**Netlify:**
- 100GB bandwidth/month
- 300 build minutes/month
- Custom domains included

**Cloudflare Pages:**
- Unlimited bandwidth
- 500 builds/month
- Custom domains included

**Mapbox:**
- 50,000 free map loads/month
- Additional loads: $5 per 1,000

### Scaling Up

For production with high traffic:
- Vercel Pro: $20/month (1TB bandwidth)
- Netlify Pro: $19/month (400 build minutes)
- Cloudflare Pages Pro: $20/month (5,000 builds)
- Mapbox: Pay-as-you-go after free tier

## Checklist

Before deploying:

- [ ] Replace demo Mapbox token with your own
- [ ] Set up environment variables on hosting platform
- [ ] Test build locally: `npm run build && npm run preview`
- [ ] Add custom domain (optional)
- [ ] Set up analytics (optional)
- [ ] Enable HTTPS
- [ ] Test on mobile devices
- [ ] Set up error monitoring (optional)
- [ ] Configure caching headers
- [ ] Add social media preview meta tags

## Support

For deployment issues:
- Check platform documentation
- Review build logs for errors
- Verify environment variables
- Test locally with `npm run preview`

---

Happy deploying! 🚀
