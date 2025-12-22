import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STRAVA_CONFIG } from '../config/strava.config';

const STRAVA_TOKEN_KEY = '@strava_token';
const STRAVA_REFRESH_TOKEN_KEY = '@strava_refresh_token';
const STRAVA_EXPIRES_AT_KEY = '@strava_expires_at';

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

export interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: StravaAthlete;
}

class StravaService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;

  async saveTokens(tokenResponse: StravaTokenResponse): Promise<void> {
    this.accessToken = tokenResponse.access_token;
    this.refreshToken = tokenResponse.refresh_token;
    this.expiresAt = tokenResponse.expires_at;

    await AsyncStorage.setItem(STRAVA_TOKEN_KEY, tokenResponse.access_token);
    await AsyncStorage.setItem(STRAVA_REFRESH_TOKEN_KEY, tokenResponse.refresh_token);
    await AsyncStorage.setItem(STRAVA_EXPIRES_AT_KEY, tokenResponse.expires_at.toString());
  }

  async loadTokens(): Promise<boolean> {
    try {
      const accessToken = await AsyncStorage.getItem(STRAVA_TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(STRAVA_REFRESH_TOKEN_KEY);
      const expiresAt = await AsyncStorage.getItem(STRAVA_EXPIRES_AT_KEY);

      if (accessToken && refreshToken && expiresAt) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresAt = parseInt(expiresAt);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading tokens:', error);
      return false;
    }
  }

  async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;

    await AsyncStorage.removeItem(STRAVA_TOKEN_KEY);
    await AsyncStorage.removeItem(STRAVA_REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(STRAVA_EXPIRES_AT_KEY);
  }

  isTokenExpired(): boolean {
    if (!this.expiresAt) return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= this.expiresAt;
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await axios.post<StravaTokenResponse>(
        STRAVA_CONFIG.TOKEN_ENDPOINT,
        {
          client_id: STRAVA_CONFIG.CLIENT_ID,
          client_secret: STRAVA_CONFIG.CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }
      );

      await this.saveTokens(response.data);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  async exchangeCodeForToken(code: string): Promise<StravaTokenResponse | null> {
    try {
      const response = await axios.post<StravaTokenResponse>(
        STRAVA_CONFIG.TOKEN_ENDPOINT,
        {
          client_id: STRAVA_CONFIG.CLIENT_ID,
          client_secret: STRAVA_CONFIG.CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
        }
      );

      await this.saveTokens(response.data);
      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return null;
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      const loaded = await this.loadTokens();
      if (!loaded) return null;
    }

    if (this.isTokenExpired()) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) return null;
    }

    return this.accessToken;
  }

  async getAthlete(): Promise<StravaAthlete | null> {
    const token = await this.getValidAccessToken();
    if (!token) return null;

    try {
      const response = await axios.get<StravaAthlete>(
        `${STRAVA_CONFIG.API_BASE_URL}/athlete`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching athlete:', error);
      return null;
    }
  }

  async getActivities(page: number = 1, perPage: number = 30): Promise<StravaActivity[] | null> {
    const token = await this.getValidAccessToken();
    if (!token) return null;

    try {
      const response = await axios.get<StravaActivity[]>(
        `${STRAVA_CONFIG.API_BASE_URL}/athlete/activities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page,
            per_page: perPage,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      return null;
    }
  }

  async getActivity(activityId: number): Promise<StravaActivity | null> {
    const token = await this.getValidAccessToken();
    if (!token) return null;

    try {
      const response = await axios.get<StravaActivity>(
        `${STRAVA_CONFIG.API_BASE_URL}/activities/${activityId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const hasTokens = await this.loadTokens();
    if (!hasTokens) return false;

    if (this.isTokenExpired()) {
      return await this.refreshAccessToken();
    }

    return true;
  }

  async logout(): Promise<void> {
    const token = await this.getValidAccessToken();

    if (token) {
      try {
        await axios.post(
          STRAVA_CONFIG.REVOKE_ENDPOINT,
          { access_token: token }
        );
      } catch (error) {
        console.error('Error revoking token:', error);
      }
    }

    await this.clearTokens();
  }
}

export default new StravaService();
