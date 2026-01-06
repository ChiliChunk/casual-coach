import axios, { AxiosInstance } from 'axios';
import stravaConfig from '../config/strava.config';

export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile_medium: string;
  profile: string;
  city: string;
  state: string;
  country: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  total_elevation_gain: number;
  map: {
    summary_polyline: string;
  };
}

export interface FilteredActivity {
  name: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: string;
  start_date: string;
  average_speed: number;
  average_heartrate?: number;
}

export interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: StravaAthlete;
}

export interface UserTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class StravaService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: stravaConfig.apiBaseUrl,
    });
  }

  /**
   * Échange le code d'autorisation contre des tokens d'accès
   */
  async exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
    try {
      console.log('Exchanging code for token...');
      console.log('Code:', code);
      console.log('Client ID:', stravaConfig.clientId);
      
      const response = await axios.post<StravaTokenResponse>(
        stravaConfig.tokenEndpoint,
        {
          client_id: stravaConfig.clientId,
          client_secret: stravaConfig.clientSecret,
          code: code,
          grant_type: 'authorization_code',
        }
      );

      console.log('Token exchange successful');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Strava API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
      } else {
        console.error('Error exchanging code for token:', error);
      }
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * Rafraîchit le token d'accès en utilisant le refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse> {
    try {
      const response = await axios.post<StravaTokenResponse>(
        stravaConfig.tokenEndpoint,
        {
          client_id: stravaConfig.clientId,
          client_secret: stravaConfig.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Vérifie si le token est expiré
   */
  isTokenExpired(expiresAt: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    return now >= expiresAt;
  }

  /**
   * Récupère les informations de l'athlète
   */
  async getAthlete(accessToken: string): Promise<StravaAthlete> {
    try {
      const response = await this.axiosInstance.get<StravaAthlete>('/athlete', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching athlete:', error);
      throw new Error('Failed to fetch athlete data');
    }
  }

  /**
   * Récupère les activités de l'athlète
   */
  async getActivities(
    accessToken: string,
    page: number = 1,
    perPage: number = 30
  ): Promise<StravaActivity[]> {
    try {
      const response = await this.axiosInstance.get<StravaActivity[]>('/athlete/activities', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          page,
          per_page: perPage,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw new Error('Failed to fetch activities');
    }
  }

  /**
   * Récupère une activité spécifique
   */
  async getActivity(accessToken: string, activityId: number): Promise<StravaActivity> {
    try {
      const response = await this.axiosInstance.get<StravaActivity>(
        `/activities/${activityId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      throw new Error('Failed to fetch activity');
    }
  }

  /**
   * Révoque le token d'accès
   */
  async revokeToken(accessToken: string): Promise<void> {
    try {
      await axios.post(stravaConfig.revokeEndpoint, {
        access_token: accessToken,
      });
    } catch (error) {
      console.error('Error revoking token:', error);
      throw new Error('Failed to revoke token');
    }
  }

  /**
   * Retourne la configuration publique (sans secrets)
   */
  getPublicConfig() {
    return {
      clientId: stravaConfig.clientId,
      authorizationEndpoint: stravaConfig.authorizationEndpoint,
      scopes: stravaConfig.scopes,
    };
  }
}

export default new StravaService();
