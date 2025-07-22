# 🏖️ Beach Match

An interactive, browser-based match-3 game designed to drive engagement, ad impressions, stream time, and community relevance for The Beach radio station.

## Features

- **6x6 Match-3 Grid** with beach-themed pieces
- **Song Quiz Mini-Games** triggered after matches
- **Stream Integration** - Gain lives and points while listening
- **Sponsor Engagement** - Click rewards system
- **Power-Up System** - Special pieces with unique effects
- **Beach Events** - Rocket launches, weather bonuses
- **Daily Challenges** - Streak rewards and progression
- **Lives System** - Regenerating gameplay with engagement bonuses
- **Real-time Radio Stream** - Integrated 98.5 The Beach player
- **Mobile Responsive** - Optimized for all devices
- **Score Tracking** - High scores and statistics
- **Match Detection** - Automatic combo and special piece creation

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **localStorage** - Client-side persistence

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd beach-match
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
beach-match/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage with game
├── components/            # React components
│   ├── BeachMatchGame.tsx # Main match-3 game component
│   └── SongQuizModal.tsx  # Song guessing mini-game
├── lib/                   # Game logic and utilities
│   ├── audioManager.ts    # Stream/audio handling
│   ├── engagementTracker.ts # Bonus tracking
│   ├── eventManager.ts    # Special events system
│   ├── gameEngine.ts      # Match-3 game logic
│   ├── powerUpSystem.ts   # Special piece effects
│   ├── types.ts           # TypeScript definitions
│   └── useBeachMatch.ts   # Main game state hook
└── public/                # Static assets
    └── icons/             # Game piece SVG icons

## Game Features

### Core Match-3 Gameplay
- 6x6 grid with 5 beach-themed pieces
- Standard match-3 mechanics with swapping
- Combo system and special power-ups
- Lives system with regeneration

### Engagement Integration
- **Stream Bonuses**: +1 Life every 5 minutes, +100 points
- **Song Mini-Games**: 30% chance after matches, +200 points if correct
- **Sponsor Rewards**: Click ads for +50 points, +1 life
- **Daily Challenges**: Streak rewards and progression

### Beach-Themed Events
- Rocket launches, weather events
- Time-based bonuses and multipliers
- Special piece effects during events

### Power-Up System
- Standard: Line Clear, Color Bomb, Lightning
- Engagement: Music Note, Radio Wave, Beach Bomb
- Earned through gameplay and listening

## Customization

### Adding New Pieces or Power-Ups

Edit `lib/types.ts` to add new piece types:

```typescript
export type PieceType = 'beach_ball' | 'microphone' | 'rocket' | 'palm_tree' | 'boat' | 'new_piece';
export type PowerUpType = 'line_clear' | 'color_bomb' | 'lightning' | 'new_powerup';
```

### Modifying Game Balance

Update `lib/gameEngine.ts` to adjust:
- Match scoring values
- Power-up spawn rates  
- Grid refill logic
- Special piece effects

### Adding New Events

Update `lib/eventManager.ts` to create custom Beach events with multipliers and effects.

## Audio Stream

Currently configured for The Beach radio stream:
```
https://streamdb5web.securenetsystems.net/cirruscontent/WSBH
```

Update the `STREAM_URL` in `components/AudioPlayer.tsx` to change the stream source.

## Data Persistence

Game state is automatically saved to `localStorage`:
- Completed tasks
- Listen time accumulation
- Current listening session
- Match completion and scoring

## Future Enhancements

- [ ] Firebase backend integration
- [ ] User authentication
- [ ] Admin dashboard for task management
- [ ] Push notifications for events
- [ ] Weekly/monthly card rotations
- [ ] Advanced anti-cheat measures
- [ ] Prize redemption system
- [ ] Analytics and reporting

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Deploy automatically

### Other Platforms

```bash
npm run build
npm start
```

Or build static export:

```bash
npm run build
npx next export
```

## Environment Variables

Currently no environment variables required. For future Firebase integration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
# ... other Firebase config
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary to The Beach radio station.

## Support

For technical support or feature requests, contact the development team.

---

🏖️ **The Beach Radio** - Your Space Coast Sound 