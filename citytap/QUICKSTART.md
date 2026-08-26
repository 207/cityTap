# CityTap - Quick Start Guide

Get CityTap running in 2 minutes!

## Installation

```bash
cd citytap
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## How to Play

1. A pin drops on the globe
2. Explore the globe (click and drag to rotate, scroll to zoom)
3. Type the city name where you think the pin is
4. Select from autocomplete and press Enter
5. See your score and continue to next round
6. After 5 rounds, share your results!

## Scoring

- **Perfect** (0-20 km): 100 points
- **Close** (50 km): 85 points  
- **Fair** (100 km): 50 points
- **Far** (500+ km): 10 points
- **Bonus**: +10 points if you guess the correct country

Maximum score: **500 points** (5 rounds × 100)

## Daily Challenge

Everyone gets the same 5 cities each day. Compare your score with friends!

## Share Results

Click "Share Results" at the end to copy your emoji summary:

```
CityTap #142
🟩 100  🟨 85  🟩 92  🟧 44  🟩 100
Total: 421/500
```

## Production Deployment

### 1. Get Mapbox Token
Sign up at https://mapbox.com (free tier available)

### 2. Set Environment Variable
Create `.env` file:
```
VITE_MAPBOX_TOKEN=your_token_here
```

### 3. Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Add your Mapbox token in Vercel dashboard under Environment Variables.

## Troubleshooting

### Map Not Loading
- Check browser console for errors
- Verify Mapbox token is set correctly
- Try clearing browser cache

### Build Fails
- Ensure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again

### Dev Server Won't Start
- Check if port 5173 is available
- Try `npm run dev -- --port 3000` to use a different port

## Files Overview

- `src/App.jsx` - Main game logic
- `src/components/Globe.jsx` - 3D globe with Mapbox
- `src/components/SearchBox.jsx` - City search
- `src/data/cities.json` - 480+ cities database
- `src/utils/gameLogic.js` - Scoring and distance calculations

## Tips for Development

### Hot Reload
Changes to React components auto-refresh in the browser.

### Debug Mode
Open browser DevTools (F12) to see:
- Console logs
- Network requests
- React component tree (install React DevTools extension)

### Testing Different Days
Edit `gameLogic.js` to change the day number:
```javascript
export function getDayNumber() {
  return 100; // Test day 100
}
```

## Customization

### Change Number of Rounds
In `App.jsx`:
```javascript
const totalRounds = 5; // Change to 3, 7, etc.
```

### Adjust Scoring
In `utils/gameLogic.js`, modify `calculateScore()` function.

### Add More Cities
Add entries to `data/cities.json`:
```json
{
  "name": "City Name",
  "country": "Country",
  "lat": 12.345,
  "lng": 67.890,
  "pop": 1000000
}
```

## Performance Tips

### Reduce Bundle Size
Lazy load the Globe component:
```javascript
const Globe = lazy(() => import('./components/Globe'));
```

### Cache City Data
City database is already optimized at ~100KB.

## Next Steps

1. ✅ Play a test game locally
2. ✅ Check that all features work
3. 🔲 Get production Mapbox token
4. 🔲 Deploy to hosting platform
5. 🔲 Share with friends!

## Need Help?

- Check `README.md` for detailed documentation
- See `DEPLOYMENT.md` for deployment guides
- Review `CityTap-GameDesignSpec.md` for game mechanics

---

**Have fun building! 🌍**
