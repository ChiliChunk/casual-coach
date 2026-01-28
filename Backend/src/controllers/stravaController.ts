import { Request, Response, NextFunction } from 'express';
import stravaService from '../services/stravaService';
import tokenStorage from '../services/tokenStorageService';

/**
 * Retourne la configuration publique de Strava
 */
export const getConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const config = stravaService.getPublicConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
};

/**
 * Échange le code d'autorisation contre des tokens
 */
export const exchangeToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, userId, redirectUri } = req.body;

    console.log('Exchange token request received');
    console.log('User ID:', userId);
    console.log('Code received:', code ? 'Yes' : 'No');
    console.log('Redirect URI:', redirectUri);

    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    if (!redirectUri) {
      res.status(400).json({ error: 'Redirect URI is required' });
      return;
    }

    const tokenResponse = await stravaService.exchangeCodeForToken(code, redirectUri);

    tokenStorage.set(userId, {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: tokenResponse.expires_at,
    });

    console.log('Token stored for user:', userId);

    // Retourner les données de l'athlète sans exposer les tokens
    res.json({
      athlete: tokenResponse.athlete,
      expiresAt: tokenResponse.expires_at,
    });
  } catch (error) {
    console.error('Error in exchangeToken controller:', error);
    next(error);
  }
};

/**
 * Rafraîchit le token d'accès
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const userTokens = tokenStorage.get(userId);

    if (!userTokens) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const tokenResponse = await stravaService.refreshAccessToken(userTokens.refreshToken);

    tokenStorage.set(userId, {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: tokenResponse.expires_at,
    });

    res.json({
      expiresAt: tokenResponse.expires_at,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère les informations de l'athlète
 */
export const getAthlete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const userTokens = tokenStorage.get(userId);

    if (!userTokens) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (stravaService.isTokenExpired(userTokens.expiresAt)) {
      const tokenResponse = await stravaService.refreshAccessToken(userTokens.refreshToken);
      tokenStorage.set(userId, {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: tokenResponse.expires_at,
      });
    }

    const athlete = await stravaService.getAthlete(userTokens.accessToken);
    res.json(athlete);
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère les activités de l'athlète
 */
export const getActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, page, perPage } = req.query;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const userTokens = tokenStorage.get(userId);

    if (!userTokens) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (stravaService.isTokenExpired(userTokens.expiresAt)) {
      const tokenResponse = await stravaService.refreshAccessToken(userTokens.refreshToken);
      tokenStorage.set(userId, {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: tokenResponse.expires_at,
      });
    }

    const pageNum = page ? parseInt(page as string, 10) : 1;
    const perPageNum = perPage ? parseInt(perPage as string, 10) : 30;

    const activities = await stravaService.getActivities(
      userTokens.accessToken,
      pageNum,
      perPageNum
    );
    res.json(activities);
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère une activité spécifique
 */
export const getActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityId } = req.params;
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const userTokens = tokenStorage.get(userId);

    if (!userTokens) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (stravaService.isTokenExpired(userTokens.expiresAt)) {
      const tokenResponse = await stravaService.refreshAccessToken(userTokens.refreshToken);
      tokenStorage.set(userId, {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: tokenResponse.expires_at,
      });
    }

    const activity = await stravaService.getActivity(
      userTokens.accessToken,
      parseInt(activityId, 10)
    );
    res.json(activity);
  } catch (error) {
    next(error);
  }
};

/**
 * Déconnecte l'utilisateur de Strava
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const userTokens = tokenStorage.get(userId);

    if (userTokens) {
      try {
        await stravaService.revokeToken(userTokens.accessToken);
      } catch (error) {
        console.error('Error revoking token:', error);
      }

      tokenStorage.delete(userId);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper pour récupérer un access token valide pour un utilisateur
 */
export const getValidAccessToken = async (userId: string): Promise<string | null> => {
  const userTokens = tokenStorage.get(userId);

  if (!userTokens) {
    return null;
  }

  if (stravaService.isTokenExpired(userTokens.expiresAt)) {
    try {
      const tokenResponse = await stravaService.refreshAccessToken(userTokens.refreshToken);
      tokenStorage.set(userId, {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: tokenResponse.expires_at,
      });
      return tokenResponse.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  return userTokens.accessToken;
};

/**
 * Vérifie si l'utilisateur est authentifié
 */
export const checkAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const userTokens = tokenStorage.get(userId);

    if (!userTokens) {
      res.json({ authenticated: false });
      return;
    }

    if (stravaService.isTokenExpired(userTokens.expiresAt)) {
      try {
        const tokenResponse = await stravaService.refreshAccessToken(userTokens.refreshToken);
        tokenStorage.set(userId, {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt: tokenResponse.expires_at,
        });
        res.json({ authenticated: true });
        return;
      } catch (error) {
        tokenStorage.delete(userId);
        res.json({ authenticated: false });
        return;
      }
    }

    res.json({ authenticated: true });
  } catch (error) {
    next(error);
  }
};
