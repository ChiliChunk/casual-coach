import { Request, Response, NextFunction } from 'express';
import stravaService from '../services/stravaService';
import tokenStore from '../services/tokenStore';
import { AuthRequest } from '../middleware/auth';

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
export const exchangeToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.body;
    const userId = req.user?.uid;

    console.log('Exchange token request received');
    console.log('User ID:', userId);
    console.log('Code received:', code ? 'Yes' : 'No');

    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const tokenResponse = await stravaService.exchangeCodeForToken(code);

    // Stocker les tokens dans Firestore
    await tokenStore.setTokens(userId, {
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

    const userTokens = userTokensStore.get(userId);

    if (!userTokens) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const tokenResponse = await stravaService.refreshAccessToken(userTokens.refreshToken);

    // Mettre à jour les tokens
    userTokensStore.set(userId, {
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

    const userTokens = userTokensStore.get(userId);

    if (!userTokens) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Vérifier si le token est expiré et le rafraîchir si nécessaire
    if (stravaService.isTokenExpired(userTokens.expiresAt)) {
      const tokenResponse = await stravaService.refreshAccessToken(userTokens.refreshToken);
      userTokens.accessToken = tokenResponse.access_token;
      userTokens.refreshToken = tokenResponse.refresh_token;
      userTokens.expiresAt = tokenResponse.expires_at;
      userTokensStore.set(userId, userTokens);
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

    const userTokens = userTokensStore.get(userId);

    if (!userTokens) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Vérifier si le token est expiré et le rafraîchir si nécessaire
    if (stravaService.isTokenExpired(userTokens.expiresAt)) {
      const tokenResponse = await stravaService.refreshAccessToken(userTokens.refreshToken);
      userTokens.accessToken = tokenResponse.access_token;
      userTokens.refreshToken = tokenResponse.refresh_token;
      userTokens.expiresAt = tokenResponse.expires_at;
      userTokensStore.set(userId, userTokens);
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

    const userTokens = userTokensStore.get(userId);

    if (!userTokens) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Vérifier si le token est expiré et le rafraîchir si nécessaire
    if (stravaService.isTokenExpired(userTokens.expiresAt)) {
      const tokenResponse = await stravaService.refreshAccessToken(userTokens.refreshToken);
      userTokens.accessToken = tokenResponse.access_token;
      userTokens.refreshToken = tokenResponse.refresh_token;
      userTokens.expiresAt = tokenResponse.expires_at;
      userTokensStore.set(userId, userTokens);
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

    const userTokens = userTokensStore.get(userId);

    if (userTokens) {
      // Révoquer le token sur Strava
      try {
        await stravaService.revokeToken(userTokens.accessToken);
      } catch (error) {
        console.error('Error revoking token:', error);
      }

      // Supprimer les tokens du store
      userTokensStore.delete(userId);
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
  const userTokens = await tokenStore.getTokens(userId);

  if (!userTokens) {
    return null;
  }

  // Vérifier si le token est expiré et le rafraîchir si nécessaire
  if (stravaService.isTokenExpired(userTokens.expiresAt)) {
    try {
      const tokenResponse = await stravaService.refreshAccessToken(userTokens.refreshToken);
      await tokenStore.setTokens(userId, {
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

    const userTokens = userTokensStore.get(userId);

    if (!userTokens) {
      res.json({ authenticated: false });
      return;
    }

    // Vérifier si le token peut être rafraîchi
    if (stravaService.isTokenExpired(userTokens.expiresAt)) {
      try {
        const tokenResponse = await stravaService.refreshAccessToken(userTokens.refreshToken);
        userTokens.accessToken = tokenResponse.access_token;
        userTokens.refreshToken = tokenResponse.refresh_token;
        userTokens.expiresAt = tokenResponse.expires_at;
        userTokensStore.set(userId, userTokens);
        res.json({ authenticated: true });
        return;
      } catch (error) {
        userTokensStore.delete(userId);
        res.json({ authenticated: false });
        return;
      }
    }

    res.json({ authenticated: true });
  } catch (error) {
    next(error);
  }
};
