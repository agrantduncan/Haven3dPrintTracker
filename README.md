# Haven 3D Print Tracker

Track which Frosthaven terrain tiles, monster standees, and obstacle pieces you have printed — and which scenarios you're ready to play.

## Local Dev

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

## Running Tests

```bash
npm run test
```

20 tests across status utilities, inventory hook, and scenario helpers.

## Data Notes

- **terrain.json** covers all 138 Frosthaven scenarios (scenario 102 does not exist in the game and is intentionally absent)
- **monsters.json** has 101 unique monster types across 137 scenarios; scenario 4 is split into 4A and 4B; scenario 91 has no monsters; scenario 93 monster data is unknown
- **obstacles.json** is a placeholder — edit `src/data/obstacles.json` to add per-scenario counts manually as you figure them out
- Monster images in `public/images/monsters/` are stat card variants from the worldhaven repo

## Setting up Vercel (for hosting)

1. Push this repo to GitHub
2. Go to vercel.com → Add New Project → import the repo
3. Vercel auto-detects Vite — no config needed
4. Every git push to main auto-deploys

## Future: Gloomhaven support

Data files are structured with game modularity in mind. Add a game selector and Gloomhaven terrain/monster JSON files when ready.
