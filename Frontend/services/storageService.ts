import AsyncStorage from '@react-native-async-storage/async-storage';

const TRAINING_PLAN_KEY = '@training_plan';

export interface TrainingPlan {
  course_label: string;
  course_type: string;
  frequency: string;
  duration: string;
  createdAt: string;
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
};
