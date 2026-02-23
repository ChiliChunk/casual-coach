import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { StorageAccessFramework, writeAsStringAsync } from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import CreatePlanForm from '../components/CreatePlanForm';
import PlanDetails from '../components/PlanDetails';
import TrainingActivities from '../components/TrainingActivities';
import Popup from '../components/Popup';
import { storageService, TrainingPlan, TrainingSchedule } from '../services/storageService';
import { API_CONFIG } from '../config/api.config';
import stravaService from '../services/stravaService';
import { colors, fonts, spacing, borderRadius, shadows } from '../constants/theme';

interface PopupState {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  showCancel?: boolean;
  buttonText?: string;
}

export default function PlanScreen() {
  const [hasPlan, setHasPlan] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [planData, setPlanData] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingWorkouts, setGeneratingWorkouts] = useState(false);
  const [trainingSchedule, setTrainingSchedule] = useState<TrainingSchedule | null>(null);
  const [popup, setPopup] = useState<PopupState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showPopup = (config: Omit<PopupState, 'visible'>) => {
    setPopup({ ...config, visible: true });
  };

  const hidePopup = () => {
    setPopup(prev => ({ ...prev, visible: false }));
  };

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
    setShowCreateForm(false);
    loadPlan();
  };

  const handleDeletePlan = () => {
    showPopup({
      type: 'warning',
      title: 'Supprimer le plan',
      message: 'Êtes-vous sûr de vouloir supprimer ce plan d\'entraînement et toutes les séances associées ?',
      showCancel: true,
      confirmText: 'Supprimer',
      onConfirm: async () => {
        try {
          await storageService.deleteTrainingPlan();
          await storageService.deleteTrainingSessions();
          setPlanData(null);
          setTrainingSchedule(null);
          setHasPlan(false);
          hidePopup();
        } catch (error) {
          console.error('Erreur lors de la suppression du plan:', error);
        }
      },
    });
  };

  const handleExportPlan = async () => {
    if (!planData) return;
    try {
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        plan: planData,
        sessions: trainingSchedule ?? null,
      };
      const safeName = planData.course_label.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `plan_${safeName}.json`;
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) return;
      const uri = await StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/json');
      await writeAsStringAsync(uri, JSON.stringify(exportData, null, 2));
      showPopup({ type: 'success', title: 'Plan exporté', message: `"${fileName}" a été sauvegardé.` });
    } catch {
      showPopup({ type: 'error', title: 'Erreur', message: "Impossible d'exporter le plan" });
    }
  };

  const handleImportPlan = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (result.canceled) return;
      const content = await new File(result.assets[0].uri).text();
      const data = JSON.parse(content);
      if (!data.version || !data.plan || !data.plan.course_label) {
        showPopup({ type: 'error', title: 'Fichier invalide', message: 'Ce fichier ne contient pas un plan valide.' });
        return;
      }
      const doImport = async () => {
        await storageService.saveTrainingPlan(data.plan);
        if (data.sessions) {
          await storageService.saveTrainingSessions(data.sessions);
        }
        await loadPlan();
        hidePopup();
        showPopup({ type: 'success', title: 'Plan importé', message: `Le plan "${data.plan.course_label}" a été importé avec succès.` });
      };
      if (hasPlan) {
        showPopup({
          type: 'warning',
          title: 'Remplacer le plan',
          message: 'Un plan existe déjà. Voulez-vous le remplacer par le plan importé ?',
          showCancel: true,
          confirmText: 'Remplacer',
          onConfirm: doImport,
        });
      } else {
        await doImport();
      }
    } catch {
      showPopup({ type: 'error', title: 'Erreur', message: "Impossible d'importer le fichier." });
    }
  };

  const handleGenerateWorkouts = async () => {
    if (!planData) {
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: 'Aucun plan disponible',
      });
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
      //MOCKAGE QUI SE RAPPORTE AU PLUMAGE MOCK <=> GENERATE
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRAINING.GENERATE}`, {
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
        showPopup({
          type: 'success',
          title: 'Séances générées',
          message: 'Votre programme d\'entraînement a été créé avec succès !',
          buttonText: 'Voir le programme',
        });
      } else {
        showPopup({
          type: 'error',
          title: 'Erreur',
          message: result.message || 'Erreur lors de la génération des séances',
        });
      }
    } catch (error) {
      console.error('Error generating workouts:', error);
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de générer les séances',
      });
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
        <TouchableOpacity style={styles.importButton} onPress={handleImportPlan}>
          <Ionicons name="download-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.importButtonText}>Importer un plan</Text>
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
              onExport={handleExportPlan}
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

      <Popup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={hidePopup}
        onConfirm={popup.onConfirm}
        confirmText={popup.confirmText}
        showCancel={popup.showCancel}
        buttonText={popup.buttonText}
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
  importButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    marginTop: spacing.md,
  },
  importButtonText: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.family,
    fontWeight: fonts.weights.semibold,
    marginLeft: spacing.md,
  },
});
