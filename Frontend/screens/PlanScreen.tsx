import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import CreatePlanForm from '../components/CreatePlanForm';
import { storageService, TrainingPlan } from '../services/storageService';
import { API_CONFIG } from '../config/api.config';

interface Exercise {
  name: string;
  details: string;
}

interface Session {
  session_number: number;
  title: string;
  intensity: string;
  description: string;
  exercises: Exercise[];
}

interface Week {
  week_number: number;
  focus: string;
  sessions: Session[];
}

interface TrainingSchedule {
  weeks: Week[];
}

export default function PlanScreen() {
  const [hasPlan, setHasPlan] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [planData, setPlanData] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingWorkouts, setGeneratingWorkouts] = useState(false);
  const [trainingSchedule, setTrainingSchedule] = useState<TrainingSchedule | null>(null);

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
    try {
      await storageService.deleteTrainingPlan();
      setPlanData(null);
      setHasPlan(false);
    } catch (error) {
      console.error('Erreur lors de la suppression du plan:', error);
    }
  };

  const handleGenerateWorkouts = async () => {
    if (!planData) {
      Alert.alert('Erreur', 'Aucun plan disponible');
      return;
    }

    setGeneratingWorkouts(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRAINING.MOCK}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_label: planData.course_label,
          course_type: planData.course_type,
          course_km: planData.course_km,
          course_elevation: planData.course_elevation,
          frequency: planData.frequency,
          duration: planData.duration,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTrainingSchedule(result.data);
        Alert.alert('Succès', 'Les séances ont été générées avec succès!');
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
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!hasPlan) {
    return (
      <View style={styles.container}>
        <AntDesign name="frown" size={80} color="#666" />
        <Text style={styles.emptyTitle}>Aucun plan d'entraînement</Text>
        <Text style={styles.emptySubtitle}>
          Créez votre premier plan pour commencer
        </Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreatePlan}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Créer un plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getLabel = (key: string, value: string) => {
    const labels: Record<string, Record<string, string>> = {
      course_type: {
        road_running: 'Course sur route',
        trail: 'Trail',
      },
      frequency: {
        '2+1': '2 + 1 optionnel',
        '3': '3',
        '3+1': '3 + 1 optionnel',
        '4': '4',
        '4+1': '4 + 1 optionnel',
      },
    };
    return labels[key]?.[value] || value;
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'élevée':
        return '#FF6B35';
      case 'modérée':
        return '#FFA500';
      case 'faible':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const renderSession = (session: Session, weekNumber: number) => (
    <View key={`week-${weekNumber}-session-${session.session_number}`} style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionTitleRow}>
          <Text style={styles.sessionNumber}>Séance {session.session_number}</Text>
          <View style={[styles.intensityBadge, { backgroundColor: getIntensityColor(session.intensity) }]}>
            <Text style={styles.intensityText}>{session.intensity}</Text>
          </View>
        </View>
        <Text style={styles.sessionTitle}>{session.title}</Text>
        <Text style={styles.sessionDescription}>{session.description}</Text>
      </View>

      <View style={styles.exercisesContainer}>
        {session.exercises.map((exercise, index) => (
          <View key={`exercise-${index}`} style={styles.exerciseItem}>
            <Ionicons name="fitness-outline" size={16} color="#FF6B35" />
            <View style={styles.exerciseContent}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseDetails}>{exercise.details}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderWeek = (week: Week) => (
    <View key={`week-${week.week_number}`} style={styles.weekContainer}>
      <View style={styles.weekHeader}>
        <Text style={styles.weekTitle}>S{week.week_number}</Text>
        <View style={styles.weekDivider} />
        <Text style={styles.weekFocus}>{week.focus}</Text>
      </View>
      {week.sessions.map((session) => renderSession(session, week.week_number))}
    </View>
  );

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.planContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Mon Plan</Text>
          <TouchableOpacity onPress={handleDeletePlan} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {planData && (
          <View style={styles.compactCard}>
            <View style={styles.courseTitleSection}>
              <Ionicons name="trophy" size={24} color="#FF6B35" />
              <Text style={styles.courseTitle}>{planData.course_label}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Ionicons name="bicycle-outline" size={20} color="#FF6B35" />
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>
                  {getLabel('course_type', planData.course_type)}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="resize-outline" size={20} color="#FF6B35" />
                <Text style={styles.infoLabel}>Distance</Text>
                <Text style={styles.infoValue}>
                  {planData.course_km} km
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="trending-up-outline" size={20} color="#FF6B35" />
                <Text style={styles.infoLabel}>D+</Text>
                <Text style={styles.infoValue}>
                  {planData.course_elevation} m
                </Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={20} color="#FF6B35" />
                <Text style={styles.infoLabel}>Fréquence</Text>
                <Text style={styles.infoValue}>
                  {getLabel('frequency', planData.frequency)}/sem
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={20} color="#FF6B35" />
                <Text style={styles.infoLabel}>Durée</Text>
                <Text style={styles.infoValue}>
                  {planData.duration} sem.
                </Text>
              </View>

              <View style={styles.infoItem} />
            </View>

            <View style={styles.dateSection}>
              <Ionicons name="checkmark-circle" size={16} color="#666" />
              <Text style={styles.dateText}>
                Créé le {new Date(planData.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        )}

        {!trainingSchedule ? (
          <TouchableOpacity
            style={[styles.createNewButton, generatingWorkouts && styles.buttonDisabled]}
            onPress={handleGenerateWorkouts}
            disabled={generatingWorkouts}
          >
            {generatingWorkouts ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="sparkles-outline" size={20} color="#fff" />
            )}
            <Text style={styles.createNewButtonText}>
              {generatingWorkouts ? 'Génération...' : 'Generer les Scéances'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.scheduleContainer}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleTitle}>Programme d'entraînement</Text>
              <TouchableOpacity onPress={() => setTrainingSchedule(null)} style={styles.closeScheduleButton}>
                <Ionicons name="close-circle-outline" size={24} color="#FF6B35" />
              </TouchableOpacity>
            </View>
            {trainingSchedule.weeks.map((week) => renderWeek(week))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  planContainer: {
    padding: 20,
    paddingTop: 60,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  deleteButton: {
    padding: 8,
  },
  compactCard: {
    backgroundColor: 'rgba(45, 45, 45, 0.7)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(252, 76, 2, 0.2)',
  },
  courseTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },
  courseTitle: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(252, 76, 2, 0.2)',
    marginBottom: 15,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#b0b0b0',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(252, 76, 2, 0.1)',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  createNewButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(252, 76, 2, 0.9)',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  createNewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: 30,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(252, 76, 2, 0.9)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FC4C02',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  scheduleContainer: {
    marginTop: 30,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(252, 76, 2, 0.3)',
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeScheduleButton: {
    padding: 5,
  },
  weekContainer: {
    marginBottom: 25,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252, 76, 2, 0.2)',
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
    minWidth: 30,
  },
  weekDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(252, 76, 2, 0.3)',
  },
  weekFocus: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    flex: 1,
  },
  sessionCard: {
    backgroundColor: 'rgba(45, 45, 45, 0.7)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(252, 76, 2, 0.2)',
  },
  sessionHeader: {
    marginBottom: 12,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionNumber: {
    fontSize: 12,
    color: '#b0b0b0',
    fontWeight: '600',
  },
  intensityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  intensityText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  sessionDescription: {
    fontSize: 13,
    color: '#b0b0b0',
    lineHeight: 18,
  },
  exercisesContainer: {
    gap: 10,
  },
  exerciseItem: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(252, 76, 2, 0.1)',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 12,
    color: '#d0d0d0',
    lineHeight: 17,
  },
});
