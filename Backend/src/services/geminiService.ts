import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config';
import fs from 'fs';
import path from 'path';

interface TrainingPlanInput {
  course_label: string;
  course_type: string;
  course_km: string;
  course_elevation: string;
  frequency: string;
  duration: string;
}

interface TrainingSession {
  session_number: number;
  title: string;
  type: 'endurance' | 'fractionné' | 'sortie_longue' | 'récupération' | 'tempo';
  duration_minutes: number;
  distance_km?: number;
  intensity: 'faible' | 'modérée' | 'élevée';
  description: string;
  exercises: Array<{
    name: string;
    details: string;
  }>;
  tips: string[];
}

interface TrainingWeek {
  week_number: number;
  phase: 'préparation' | 'développement' | 'affûtage';
  focus: string;
  sessions: TrainingSession[];
}

interface TrainingPlanResponse {
  plan_overview: {
    total_weeks: number;
    sessions_per_week: number;
    course_type: string;
    objective: string;
  };
  weeks: TrainingWeek[];
  general_recommendations: string[];
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private systemPrompt: string;
  private userPromptTemplate: string;

  constructor() {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);

    this.systemPrompt = fs.readFileSync(
      path.join(__dirname, '../prompts/training-plan-system.txt'),
      'utf-8'
    );

    this.userPromptTemplate = fs.readFileSync(
      path.join(__dirname, '../prompts/training-plan-user.txt'),
      'utf-8'
    );
  }

  private generateUserPrompt(planData: TrainingPlanInput): string {
    const courseTypeLabel = planData.course_type === 'road_running' ? 'course sur route' : 'trail';

    return this.userPromptTemplate
      .replace(/\{\{course_label\}\}/g, planData.course_label)
      .replace(/\{\{course_km\}\}/g, planData.course_km)
      .replace(/\{\{course_elevation\}\}/g, planData.course_elevation)
      .replace(/\{\{course_type\}\}/g, courseTypeLabel)
      .replace(/\{\{frequency\}\}/g, planData.frequency)
      .replace(/\{\{duration\}\}/g, planData.duration)
      .replace(/\{\{course_type_value\}\}/g, planData.course_type)
      .replace(/\{\{activities\}\}/g, 'Aucune activité récente');
  }

  async generateTrainingPlan(planData: TrainingPlanInput): Promise<TrainingPlanResponse> {
    try {
      console.log('Generating training plan with data:', planData);
      const userPrompt = this.generateUserPrompt(planData);
      const fullPrompt = `${this.systemPrompt}\n\n${userPrompt}`;

      console.log('Using Gemini model: gemini-2.0-flash-exp');
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      });

      console.log('Sending request to Gemini...');
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const content = response.text();

      console.log('Received response from Gemini');
      if (!content) {
        throw new Error('No response from Gemini');
      }

      console.log('Parsing JSON response...');
      const trainingPlan: TrainingPlanResponse = JSON.parse(content);

      return trainingPlan;
    } catch (error) {
      console.error('Error generating training plan:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate training plan: ${error.message}`);
      }
      throw error;
    }
  }
}

export default new GeminiService();
