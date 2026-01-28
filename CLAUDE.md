# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style Rules

- Do not generate or modify README files
- Do not generate comments in the code
- Do not generate console.log or print statements in the code
- Delete tmpclaude* files when you've created one
- Use [constants/theme.ts](Frontend/constants/theme.ts) for common style modifications (colors, fonts, spacing, borderRadius, shadows)

## Project Architecture

This is a mobile coaching app with Strava integration, split into two main parts:

### Backend (Node.js/Express/TypeScript)
- MVC architecture pattern
- Controllers handle HTTP requests ([controllers/](Backend/src/controllers/))
- Services contain business logic ([services/](Backend/src/services/))
- Routes define API endpoints ([routes/](Backend/src/routes/))
- Middleware for error handling and logging ([middleware/](Backend/src/middleware/))
- TypeScript compiled to `dist/` directory
- Uses Google Gemini AI for training plan generation
- Secure Strava OAuth flow (credentials stored server-side)

### Frontend (React Native/Expo)
- React Navigation with bottom tabs (Plan, Profile)
- Splash screen with fade animation on app launch
- Centralized theme system in [constants/theme.ts](Frontend/constants/theme.ts)
- API configuration in [config/api.config.ts](Frontend/config/api.config.ts)
- Two main screens: [PlanScreen.tsx](Frontend/screens/PlanScreen.tsx) and [StravaProfileScreen.tsx](Frontend/screens/StravaProfileScreen.tsx)
- Onboarding popup component for first-time users

### Key Integration Points
- Backend stores Strava tokens securely (via tokenStorageService)
- Frontend fetches Strava config from backend (never exposes CLIENT_SECRET)
- API communication through centralized [api.config.ts](Frontend/config/api.config.ts)

## Development Commands

### Backend
```bash
cd Backend
npm install              # Install dependencies
npm run dev             # Start dev server with hot reload (ts-node-dev)
npm run build           # Compile TypeScript + copy prompts/*.txt and mock/*.json to dist/
npm start               # Run production build from dist/
npm run lint            # Run ESLint
```

Backend runs on http://localhost:3000

### Frontend
```bash
cd Frontend
npm install              # Install dependencies
npm start               # Start Expo dev server
```

### Building for Production
```bash
cd Frontend
eas build --profile preview --platform android    # Build Android APK (preview)
eas build --profile production --platform android # Build Android APK (production)
```

See [eas.json](Frontend/eas.json) for build profiles (development, preview, production).

## Important Configuration

### Expo Go Development (Local IP Required)
When using Expo Go, the frontend must connect to the backend via local IP address (not localhost).

1. Find your local IP:
   ```bash
   ipconfig  # Windows - look for "Adresse IPv4" in Wi-Fi section
   ifconfig  # macOS/Linux - look for inet address
   ```

2. Update [Frontend/config/api.config.ts](Frontend/config/api.config.ts):
   ```typescript
   BASE_URL: 'http://192.168.1.78:3000/api/v1'  // Replace with your IP
   ```

3. Ensure phone and PC are on the same WiFi network

### Backend Environment Variables
Create `Backend/.env` from `Backend/.env.example`:
- `STRAVA_CLIENT_ID` - Strava OAuth client ID
- `STRAVA_CLIENT_SECRET` - Strava OAuth secret
- `GEMINI_API_KEY` - Google Gemini API key

## API Endpoints

All endpoints are prefixed with `/api/v1`:

### Strava Routes
- `GET /strava/config` - Get Strava OAuth config (client ID only)
- `POST /strava/auth/exchange` - Exchange OAuth code for tokens
- `POST /strava/auth/refresh` - Refresh access token
- `GET /strava/auth/check` - Check auth status
- `POST /strava/auth/logout` - Logout user
- `GET /strava/athlete` - Get athlete profile
- `GET /strava/activities` - Get recent activities

### Training Routes
- `POST /training/generate` - Generate AI training plan
- `GET /training/mock` - Get mock training data

### Health
- `GET /health` - Health check endpoint

## Troubleshooting

If frontend cannot connect to backend:
1. Verify backend is running (check `http://localhost:3000/api/v1/health`)
2. Verify IP address is correct in [api.config.ts](Frontend/config/api.config.ts)
3. Check Windows Firewall (allow port 3000)
4. Test from phone browser: `http://YOUR_IP:3000/api/v1/health`
