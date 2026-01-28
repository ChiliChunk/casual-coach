import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api.config';

const USER_ID_KEY = '@user_id';
const STRAVA_CONFIG_KEY = '@strava_config';

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

export interface StravaConfig {
  clientId: string;
  authorizationEndpoint: string;
  scopes: string[];
}

export interface AuthResponse {
  athlete: StravaAthlete;
  expiresAt: number;
}

class StravaService {
  private userId: string | null = null;
  private config: StravaConfig | null = null;

  /**
   * Génère un ID utilisateur unique pour cette session
   */
  async getUserId(): Promise<string> {
    if (this.userId) return this.userId;

    let userId = await AsyncStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(USER_ID_KEY, userId);
    }

    this.userId = userId;
    return userId;
  }

  /**
   * Récupère la configuration Strava depuis le backend
   */
  async getConfig(): Promise<StravaConfig> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STRAVA.CONFIG}`;
      const response = await axios.get<StravaConfig>(url);
      this.config = response.data;
      await AsyncStorage.setItem(STRAVA_CONFIG_KEY, JSON.stringify(response.data));
      return this.config;
    } catch (error) {
      console.error('Error fetching config:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status,
        });
      }

      const cachedConfig = await AsyncStorage.getItem(STRAVA_CONFIG_KEY);
      if (cachedConfig) {
        this.config = JSON.parse(cachedConfig);
        return this.config!;
      }

      throw new Error('Failed to fetch Strava configuration');
    }
  }

  /**
   * Échange le code d'autorisation contre des tokens via le backend
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<AuthResponse | null> {
    try {
      const userId = await this.getUserId();

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STRAVA.EXCHANGE}`;
      const response = await axios.post<AuthResponse>(url, {
        code,
        userId,
        redirectUri,
      });

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        console.error('Error message:', error.message);
      }
      return null;
    }
  }

  /**
   * Efface les données locales
   */
  async clearLocalData(): Promise<void> {
    this.userId = null;
    this.config = null;
    await AsyncStorage.removeItem(USER_ID_KEY);
    await AsyncStorage.removeItem(STRAVA_CONFIG_KEY);
  }

  /**
   * Récupère les informations de l'athlète via le backend
   */
  async getAthlete(): Promise<StravaAthlete | null> {
    try {
      const userId = await this.getUserId();

      const response = await axios.get<StravaAthlete>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STRAVA.ATHLETE}`,
        {
          params: { userId },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching athlete:', error);
      return null;
    }
  }

  /**
   * Récupère les activités via le backend
   */
  async getActivities(page: number = 1, perPage: number = 30): Promise<StravaActivity[] | null> {
    try {
      const userId = await this.getUserId();

      const response = await axios.get<StravaActivity[]>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STRAVA.ACTIVITIES}`,
        {
          params: {
            userId,
            page,
            perPage,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      return null;
    }
  }

  /**
   * Récupère une activité spécifique via le backend
   */
  async getActivity(activityId: number): Promise<StravaActivity | null> {
    try {
      const userId = await this.getUserId();

      const response = await axios.get<StravaActivity>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STRAVA.ACTIVITY(activityId)}`,
        {
          params: { userId },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      return null;
    }
  }

  /**
   * Vérifie si l'utilisateur est authentifié via le backend
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const userId = await this.getUserId();

      const response = await axios.get<{ authenticated: boolean }>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STRAVA.CHECK_AUTH}`,
        {
          params: { userId },
        }
      );
      return response.data.authenticated;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Déconnecte l'utilisateur via le backend
   */
  async logout(): Promise<void> {
    try {
      const userId = await this.getUserId();

      await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STRAVA.LOGOUT}`,
        { userId }
      );

      await this.clearLocalData();
    } catch (error) {
      console.error('Error logging out:', error);
      await this.clearLocalData();
    }
  }
}

export default new StravaService();
