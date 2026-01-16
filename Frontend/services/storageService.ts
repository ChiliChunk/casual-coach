import AsyncStorage from '@react-native-async-storage/async-storage';

const TRAINING_PLAN_KEY = '@training_plan';
const TRAINING_SESSIONS_KEY = '@training_sessions';

export interface TrainingPlan {
  course_label: string;
  course_type: string;
  course_km: string;
  course_elevation: string;
  frequency: string;
  duration: string;
  user_presentation: string;
  stravaConnected?: boolean;
  createdAt: string;
}

export interface Exercise {
  name: string;
  details: string;
}

export interface Session {
  session_number: number;
  title: string;
  intensity: string;
  description: string;
  exercises: Exercise[];
  done?: boolean;
  optional?: boolean;
}

export interface Week {
  week_number: number;
  focus: string;
  sessions: Session[];
}

export interface TrainingSchedule {
  weeks: Week[];
  savedAt?: string;
}

export const storageService = {
  /**
   * Save training plan to local storage
   */
  async saveTrainingPlan(planData: Omit<TrainingPlan, 'createdAt'>): Promise<void> {
    try {
      const plan: TrainingPlan = {
        ...planData,
        createdAt: new Date().toISOString(),
      };
      const jsonValue = JSON.stringify(plan);
      await AsyncStorage.setItem(TRAINING_PLAN_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving training plan:', error);
      throw error;
    }
  },

  /**
   * Get training plan from local storage
   */
  async getTrainingPlan(): Promise<TrainingPlan | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(TRAINING_PLAN_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting training plan:', error);
      return null;
    }
  },

  /**
   * Delete training plan from local storage
   */
  async deleteTrainingPlan(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TRAINING_PLAN_KEY);
    } catch (error) {
      console.error('Error deleting training plan:', error);
      throw error;
    }
  },

  /**
   * Check if a training plan exists
   */
  async hasTrainingPlan(): Promise<boolean> {
    try {
      const plan = await this.getTrainingPlan();
      return plan !== null;
    } catch (error) {
      console.error('Error checking training plan:', error);
      return false;
    }
  },

  /**
   * Save training sessions to local storage
   */
  async saveTrainingSessions(sessions: TrainingSchedule): Promise<void> {
    try {
      const data = {
        ...sessions,
        savedAt: new Date().toISOString(),
      };
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(TRAINING_SESSIONS_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving training sessions:', error);
      throw error;
    }
  },

  /**
   * Get training sessions from local storage
   */
  async getTrainingSessions(): Promise<TrainingSchedule | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(TRAINING_SESSIONS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting training sessions:', error);
      return null;
    }
  },

  /**
   * Delete training sessions from local storage
   */
  async deleteTrainingSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TRAINING_SESSIONS_KEY);
    } catch (error) {
      console.error('Error deleting training sessions:', error);
      throw error;
    }
  },
};
