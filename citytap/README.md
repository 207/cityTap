# CityTap

A reverse geography game where the globe drops a pin and you name the nearest city.

## Concept

CityTap inverts Maptap: instead of placing a pin on a map for a given city name, the game drops a pin on an unlabeled globe and you must identify the city by typing its name.

## Features

- **Daily Challenge**: 5 rounds per day, same pins for all players
- **Interactive Globe**: 3D satellite terrain globe with rotation and zoom
- **Smart Search**: Autocomplete city search with fuzzy matching
- **Distance Scoring**: Score based on proximity to correct city (0-100 points per round)
- **Country Bonus**: +10 bonus points for guessing a city in the correct country
- **Shareable Results**: Copy emoji-formatted results to share with friends
- **Persistent Pins**: Previous guesses and correct cities remain visible on the globe

## Installation

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

### Build for Production

```bash
npm run build
npm run preview
```

## Gameplay

### How to Play

1. A pin appears on the globe at a mystery location
2. Explore the globe by rotating and zooming to identify landmarks
3. Type the name of the city where you think the pin is located
4. Select from the autocomplete suggestions and submit
5. View your score based on distance accuracy
6. Complete 5 rounds and share your results

### Scoring

- **0-20 km**: 100 points (perfect)
- **50 km**: 85 points
- **100 km**: 50 points
- **500 km**: 10 points (floor)
- **Same country bonus**: +10 points (max 100 total)

Total possible score: 500 points (5 rounds × 100 points)

### Score Emojis

- 🟩 Green: 80-100 points (excellent)
- 🟨 Yellow: 50-79 points (good)
- 🟧 Orange: 20-49 points (fair)
- 🟥 Red: 0-19 points (needs work)

## City Database

The game includes 480+ cities from around the world, representing major population centers from most countries. Cities are selected from:

- Top 3 most populous cities per country
- Major metropolitan areas
- Capitals and regional centers

Database includes:
- City name (English)
- Country
- Coordinates (latitude/longitude)
- Population

## Technical Stack

- **Frontend**: React 18 + Vite
- **Globe**: Mapbox GL JS with satellite terrain
- **Search**: Custom fuzzy search with population ranking
- **Scoring**: Haversine formula for great-circle distance

## Project Structure

```
citytap/
├── src/
│   ├── components/
│   │   ├── Globe.jsx           # 3D globe with Mapbox GL
│   │   ├── SearchBox.jsx       # City search with autocomplete
│   │   ├── RevealScreen.jsx    # Round results display
│   │   └── ResultsScreen.jsx   # Final results & sharing
│   ├── data/
│   │   └── cities.json         # City database (480+ cities)
│   ├── utils/
│   │   └── gameLogic.js        # Scoring, distance, daily seed
│   ├── App.jsx                 # Main game orchestration
│   ├── App.css                 # Global styles
│   ├── index.css               # Base styles
│   └── main.jsx                # React entry point
├── package.json
└── README.md
```

## Mapbox Token

This project uses Mapbox GL for rendering the globe. The current implementation includes a public demo token for testing purposes.

### For Production

1. Sign up for a free Mapbox account at https://mapbox.com
2. Create an access token
3. Replace the token in `src/components/Globe.jsx`:
   ```javascript
   const MAPBOX_TOKEN = 'your_token_here';
   ```

Alternatively, use an environment variable:
1. Create a `.env` file:
   ```
   VITE_MAPBOX_TOKEN=your_token_here
   ```
2. Update Globe.jsx:
   ```javascript
   const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
   ```

## Daily Seed System

The game generates the same 5 cities for all players each day using a deterministic seed based on the day number. This enables:
- Fair competition (everyone gets the same pins)
- Shareable results (comparable across players)
- Wordle-style daily ritual

## Future Enhancements

Potential features for future versions:
- Difficulty modes (easy/medium/hard)
- Practice mode with unlimited rounds
- Regional challenges (Europe only, Asia only, etc.)
- Hints system (show country, continent, population range)
- Leaderboards and streaks
- Multi-language support
- Mobile app

## Contributing

This is an MVP implementation. Contributions welcome for:
- UI/UX improvements
- Performance optimizations
- Additional city data
- Bug fixes
- Feature enhancements

## License

MIT License - feel free to use, modify, and distribute.

## Credits

- Game design inspired by Maptap.gg
- Maps powered by Mapbox GL JS
- City data from GeoNames and OpenStreetMap

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify Mapbox token is valid
3. Ensure Node.js 18+ is installed
4. Try clearing browser cache

---

**Have fun exploring the world! 🌍**
