// Configuration de l'API backend
// Pour Expo Go, utilisez l'adresse IP locale de votre machine au lieu de localhost
// Exemple: 'http://192.168.1.78:3000/api/v1'
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.78:3000/api/v1',
  ENDPOINTS: {
    STRAVA: {
      CONFIG: '/strava/config',
      EXCHANGE: '/strava/auth/exchange',
      REFRESH: '/strava/auth/refresh',
      CHECK_AUTH: '/strava/auth/check',
      LOGOUT: '/strava/auth/logout',
      ATHLETE: '/strava/athlete',
      ACTIVITIES: '/strava/activities',
      ACTIVITY: (id: number) => `/strava/activities/${id}`,
    },
    TRAINING: {
      GENERATE: '/training/generate',
      MOCK: '/training/mock',
    },
  },
};
