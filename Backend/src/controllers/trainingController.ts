import { Request, Response } from 'express';
import geminiService from '../services/geminiService';
import stravaService, { StravaActivity, FilteredActivity } from '../services/stravaService';
import { getValidAccessToken } from './stravaController';
import fs from 'fs';
import path from 'path';

const filterActivitiesForLLM = (activities: StravaActivity[]): FilteredActivity[] => {
  return activities.map(activity => ({
    name: activity.name,
    distance: activity.distance,
    moving_time: activity.moving_time,
    total_elevation_gain: activity.total_elevation_gain,
    type: activity.type,
    sport_type: activity.sport_type,
    start_date: activity.start_date,
    average_speed: activity.average_speed,
    average_heartrate: activity.average_heartrate,
  }));
};

const getStravaActivities = async (userId: string | undefined): Promise<FilteredActivity[]> => {
  const activities: FilteredActivity[] = [];
  if (userId) {
    try {
      const accessToken = await getValidAccessToken(userId);
      if (accessToken) {
        console.log('Fetching recent Strava activities for user:', userId);
        const fetchedActivities = await stravaService.getActivities(accessToken, 1, 10);
        console.log(`Retrieved ${fetchedActivities.length} activities`);
        return filterActivitiesForLLM(fetchedActivities);
      } else {
        console.log('No valid access token found for user:', userId);
      }
    } catch (error) {
      console.error('Error fetching Strava activities:', error);
      // Continue sans les activités si la récupération échoue
    }
  }
  return activities;
};

export const generateTrainingPlan = async (req: Request, res: Response) => {
  try {
    const { course_label, course_type, course_km, course_elevation, frequency, duration, userId } = req.body;

    if (!course_label || !course_type || !course_km || !course_elevation || !frequency || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: course_label, course_type, course_km, course_elevation, frequency, duration',
      });
    }

    const activities = await getStravaActivities(userId);
    const trainingPlan = await geminiService.generateTrainingPlan({
      course_label,
      course_type,
      course_km,
      course_elevation,
      frequency,
      duration,
      activities,
    });

    return res.status(200).json({
      success: true,
      data: trainingPlan,
    });
  } catch (error) {
    console.error('Error in generateTrainingPlan controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate training plan',
    });
  }
};

export const getMockTrainingPlan = async (req: Request, res: Response) => {
  try {
    const { course_label, course_type, course_km, course_elevation, frequency, duration, userId } = req.body;
    console.log(req.body)
    if (!course_label || !course_type || !course_km || !course_elevation || !frequency || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: course_label, course_type, course_km, course_elevation, frequency, duration',
      });
    }
    console.log('Mock plan requested with data:', { course_label, course_type, course_km, course_elevation, frequency, duration, userId });
    const activities = await getStravaActivities(userId);
    console.log(`Retrieved ${activities.length} activities for mock plan generation`);    
    await new Promise(resolve => setTimeout(resolve, 5000));

    const mockDataPath = path.join(__dirname, '../mock/gemini_answer.json');
    const mockData = fs.readFileSync(mockDataPath, 'utf-8');
    const trainingPlan = JSON.parse(mockData);

    return res.status(200).json({
      success: true,
      data: trainingPlan,
    });
  } catch (error) {
    console.error('Error in getMockTrainingPlan controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get mock training plan',
    });
  }
};
