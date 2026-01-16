import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import CreatePlanForm from '../components/CreatePlanForm';
import PlanDetails from '../components/PlanDetails';
import TrainingActivities from '../components/TrainingActivities';
import SuccessPopup from '../components/SuccessPopup';
import { storageService, TrainingPlan, TrainingSchedule } from '../services/storageService';
import { API_CONFIG } from '../config/api.config';
import stravaService from '../services/stravaService';
import { colors, fonts, spacing, borderRadius, shadows } from '../constants/theme';

export default function PlanScreen() {
  const [hasPlan, setHasPlan] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [planData, setPlanData] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingWorkouts, setGeneratingWorkouts] = useState(false);
  const [trainingSchedule, setTrainingSchedule] = useState<TrainingSchedule | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const plan = await storageService.getTrainingPlan();
      if (plan) {
        setPlanData(plan);
        setHasPlan(true);
      }
      
      const sessions = await storageService.getTrainingSessions();
      if (sessions) {
        setTrainingSchedule(sessions);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
  };

  const handlePlanComplete = (planData: any) => {
    console.log('Plan créé avec les données:', planData);
    setShowCreateForm(false);
    loadPlan();
  };

  const handleDeletePlan = async () => {
    Alert.alert(
      'Supprimer le plan',
      'Êtes-vous sûr de vouloir supprimer ce plan d\'entraînement et toutes les séances associées ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteTrainingPlan();
              await storageService.deleteTrainingSessions();
              setPlanData(null);
              setTrainingSchedule(null);
              setHasPlan(false);
            } catch (error) {
              console.error('Erreur lors de la suppression du plan:', error);
            }
          },
        },
      ]
    );
  };

  const handleGenerateWorkouts = async () => {
    if (!planData) {
      Alert.alert('Erreur', 'Aucun plan disponible');
      return;
    }

    setGeneratingWorkouts(true);
    try {
      const userId = await stravaService.getUserId();
      var data = {
          course_label: planData.course_label,
          course_type: planData.course_type,
          course_km: planData.course_km,
          course_elevation: planData.course_elevation,
          frequency: planData.frequency,
          duration: planData.duration,
          user_presentation: planData.user_presentation,
          userId,
        }
      console.log('Request data for training plan generation:', data);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRAINING.MOCK}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setTrainingSchedule(result.data);
        await storageService.saveTrainingSessions(result.data);
        setShowSuccessPopup(true);
        console.log('Training plan generated:', result.data);
      } else {
        Alert.alert('Erreur', result.message || 'Erreur lors de la génération des séances');
      }
    } catch (error) {
      console.error('Error generating workouts:', error);
      Alert.alert('Erreur', 'Impossible de générer les séances');
    } finally {
      setGeneratingWorkouts(false);
    }
  };

  const handleToggleSessionDone = async (weekNumber: number, sessionNumber: number) => {
    if (!trainingSchedule) return;

    const updatedSchedule = {
      ...trainingSchedule,
      weeks: trainingSchedule.weeks.map(week => {
        if (week.week_number === weekNumber) {
          return {
            ...week,
            sessions: week.sessions.map(session => {
              if (session.session_number === sessionNumber) {
                return { ...session, done: !session.done };
              }
              return session;
            }),
          };
        }
        return week;
      }),
    };

    setTrainingSchedule(updatedSchedule);
    await storageService.saveTrainingSessions(updatedSchedule);
  };

  if (showCreateForm) {
    return (
      <Modal
        visible={showCreateForm}
        animationType="slide"
        transparent={true}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <CreatePlanForm onClose={handleCloseForm} onComplete={handlePlanComplete} />
        </View>
      </Modal>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!hasPlan) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContent}>
          <AntDesign name="frown" size={80} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Aucun plan d'entraînement</Text>
          <Text style={styles.emptySubtitle}>
            Créez votre premier plan pour commencer
          </Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={handleCreatePlan}>
          <Ionicons name="add-circle-outline" size={24} color={colors.textInverse} />
          <Text style={styles.createButtonText}>Créer un plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.planContainer}>
          {planData && (
            <PlanDetails
              planData={planData}
              hasSchedule={!!trainingSchedule}
              generatingWorkouts={generatingWorkouts}
              onGenerateWorkouts={handleGenerateWorkouts}
              onDelete={handleDeletePlan}
            />
          )}

          {trainingSchedule && (
            <TrainingActivities
              trainingSchedule={trainingSchedule}
              onToggleDone={handleToggleSessionDone}
            />
          )}
        </View>
      </ScrollView>

      <SuccessPopup
        visible={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  planContainer: {
    padding: spacing.xl,
    paddingTop: spacing.xl,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: fonts.sizes.xxl,
    fontWeight: fonts.weights.bold,
    fontFamily: fonts.family,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    ...shadows.md,
  },
  createButtonText: {
    color: colors.textInverse,
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.family,
    fontWeight: fonts.weights.semibold,
    marginLeft: spacing.md,
  },
});
